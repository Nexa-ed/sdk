import { NexaError } from "../error";
import { assertConfig } from "../config";
import type { ResolvedNexaConfig } from "../config";
import type {
  EmailCreateOptions,
  EmailCreateResult,
  EmailBulkCreateOptions,
  EmailBulkCreateResult,
  EmailJobStatus,
  StudentEmailAccount,
} from "../types";

/**
 * Guard: throws a descriptive error if `nexa.email` is used without
 * the `email` config block in `createNexa()`.
 */
function assertEmailConfig(config: ResolvedNexaConfig): {
  tier: string;
  domain: string;
} {
  assertConfig(config);
  if (!config.email?.tier || !config.email?.domain) {
    throw new NexaError(
      "[nexa-ed] email.tier and email.domain are required to use nexa.email.*. " +
        "Add an `email` block to your createNexa() config:\n\n" +
        "  email: {\n" +
        '    tier: "tier-3-google",   // or "tier-1-nexa" / "tier-2-zoho"\n' +
        '    domain: "yourschool.edu",\n' +
        "  }",
      400,
      "EMAIL_CONFIG_MISSING"
    );
  }
  return { tier: config.email.tier, domain: config.email.domain };
}

/**
 * Email provisioning module — tier-agnostic.
 *
 * Configure the tier once in `createNexa({ email: { tier, domain } })`.
 * Every method below works identically whether your school is on
 * Tier 1 (Nexa/Stalwart), Tier 2 (Zoho), or Tier 3 (Google Workspace).
 *
 * @example
 * // lib/nexa.ts
 * export const nexa = createNexa({
 *   apiKey: process.env.NEXA_API_KEY!,
 *   webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
 *   getUser: async () => { ... },
 *   email: {
 *     tier: "tier-3-google",
 *     domain: "loretto.edu.ng",
 *   },
 * });
 *
 * // Anywhere in your app:
 * const account = await nexa.email.create({
 *   studentId: "stu_001",
 *   firstName: "John",
 *   lastName: "Doe",
 * });
 */
export class EmailModule {
  constructor(private readonly config: ResolvedNexaConfig) {}

  private get headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-api-key": this.config.apiKey,
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { success: boolean; message?: string; data?: T } & T;

    if (!res.ok || data.success === false) {
      const message = (data as { message?: string }).message ?? res.statusText;
      throw new NexaError(message, res.status);
    }

    // Some endpoints wrap in { success, data }, others return the payload directly
    return (data as { data?: T }).data ?? data;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      headers: this.headers,
    });

    const data = (await res.json()) as { success: boolean; message?: string; data?: T } & T;

    if (!res.ok || data.success === false) {
      const message = (data as { message?: string }).message ?? res.statusText;
      throw new NexaError(message, res.status);
    }

    return (data as { data?: T }).data ?? data;
  }

  // ------------------------------------------------------------------
  // Account lifecycle
  // ------------------------------------------------------------------

  /**
   * Create a single student email account.
   *
   * The email address is generated from `firstName.lastName@<domain>` unless
   * you supply an explicit `email`.
   *
   * @example
   * const account = await nexa.email.create({
   *   studentId: "stu_001",
   *   firstName: "John",
   *   lastName: "Doe",
   *   gradeLevel: "SS2",
   *   recoveryEmail: "parent@gmail.com",
   * });
   *
   * // Send account.temporaryPassword to the student via your preferred channel.
   */
  async create(options: EmailCreateOptions): Promise<EmailCreateResult> {
    const { tier, domain } = assertEmailConfig(this.config);
    const result = await this.post<{ email: string; temporaryPassword: string; providerUserId: string; tier: string }>(
      "/api/student-emails/create",
      { ...options, domain, tier }
    );
    return result as EmailCreateResult;
  }

  /**
   * Provision email accounts for multiple students in a single background job.
   *
   * Returns immediately with a `jobId`. Poll `nexa.email.getJobStatus(jobId)`
   * to track progress, or use the job status endpoint.
   *
   * Supports up to 500 students per call. Internally splits into batches of
   * 100 students processed in parallel.
   *
   * @example
   * const { jobId } = await nexa.email.bulkCreate({
   *   students: [
   *     { studentId: "stu_001", firstName: "John", lastName: "Doe" },
   *     { studentId: "stu_002", firstName: "Jane", lastName: "Smith" },
   *   ],
   * });
   *
   * // Later — poll for completion:
   * const status = await nexa.email.getJobStatus(jobId);
   * console.log(status.successCount, "/", status.totalStudents);
   */
  async bulkCreate(options: EmailBulkCreateOptions): Promise<EmailBulkCreateResult> {
    const { tier, domain } = assertEmailConfig(this.config);
    const res = await fetch(`${this.config.baseUrl}/api/student-emails/bulk`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ students: options.students, domain, tier }),
    });

    const data = (await res.json()) as { success: boolean; jobId?: string; tier?: string; totalStudents?: number; message?: string };

    if (!res.ok || data.success === false) {
      throw new NexaError(data.message ?? res.statusText, res.status);
    }

    return {
      jobId: data.jobId!,
      tier: (data.tier ?? tier) as EmailBulkCreateResult["tier"],
      totalStudents: data.totalStudents ?? options.students.length,
      message: data.message ?? `Bulk provisioning started for ${options.students.length} students.`,
    };
  }

  /**
   * Suspend a student's email account.
   * The mailbox is preserved — the student simply cannot log in.
   * Use `restore()` to re-enable access.
   *
   * @example
   * await nexa.email.suspend("john.doe@loretto.edu.ng");
   */
  async suspend(email: string): Promise<void> {
    const { tier, domain } = assertEmailConfig(this.config);
    const emailDomain = email.split("@")[1] ?? domain;
    await this.post("/api/student-emails/suspend", { email, domain: emailDomain, tier });
  }

  /**
   * Restore a previously suspended student email account.
   *
   * @example
   * await nexa.email.restore("john.doe@loretto.edu.ng");
   */
  async restore(email: string): Promise<void> {
    const { tier, domain } = assertEmailConfig(this.config);
    const emailDomain = email.split("@")[1] ?? domain;
    await this.post("/api/student-emails/restore", { email, domain: emailDomain, tier });
  }

  /**
   * Generate and set a new temporary password for a student account.
   * Returns the temporary password so you can deliver it to the student.
   *
   * @example
   * const { temporaryPassword } = await nexa.email.resetPassword("john.doe@loretto.edu.ng");
   * await sendSms(studentPhone, `Your new password: ${temporaryPassword}`);
   */
  async resetPassword(email: string): Promise<{ email: string; temporaryPassword: string }> {
    const { tier, domain } = assertEmailConfig(this.config);
    const emailDomain = email.split("@")[1] ?? domain;
    return this.post<{ email: string; temporaryPassword: string }>(
      "/api/student-emails/reset-password",
      { email, domain: emailDomain, tier }
    );
  }

  // ------------------------------------------------------------------
  // Listing & status
  // ------------------------------------------------------------------

  /**
   * List student email accounts for this tenant.
   *
   * @example
   * const accounts = await nexa.email.list();
   * const active = await nexa.email.list({ status: "active" });
   */
  async list(options?: {
    status?: "active" | "suspended" | "deleted";
    limit?: number;
  }): Promise<StudentEmailAccount[]> {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", String(options.limit));

    const query = params.toString();
    const path = `/api/student-emails/list${query ? `?${query}` : ""}`;

    const res = await this.get<{ data: StudentEmailAccount[]; count: number } | StudentEmailAccount[]>(path);

    // Nexa returns { data: [...], count: N } from the list endpoint
    if (Array.isArray(res)) return res;
    return (res as { data: StudentEmailAccount[] }).data ?? [];
  }

  /**
   * Poll the status of a bulk provisioning job.
   *
   * @example
   * const status = await nexa.email.getJobStatus(jobId);
   * if (status.status === "completed") {
   *   console.log(`${status.successCount} accounts created`);
   * }
   */
  async getJobStatus(jobId: string): Promise<EmailJobStatus> {
    const res = await this.get<{ data: EmailJobStatus } | EmailJobStatus>(
      `/api/student-emails/status?jobId=${encodeURIComponent(jobId)}`
    );
    // Nexa wraps in { success, data }
    if ((res as { data?: EmailJobStatus }).data) {
      return (res as { data: EmailJobStatus }).data;
    }
    return res as EmailJobStatus;
  }
}
