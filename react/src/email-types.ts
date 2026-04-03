export type EmailTier = "tier-1-nexa" | "tier-2-stalwart" | "tier-3-google";

export interface StudentEmail {
  email: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  provider?: "nexa" | "stalwart" | "google";
  providerUserId?: string;
  tier?: EmailTier;
  status: "active" | "suspended" | "deleted";
  passwordResetRequired?: boolean;
  recoveryEmail?: string;
  aliases?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface EmailCreateFormData {
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  gradeLevel?: string;
  recoveryEmail?: string;
}

export interface EmailJobProgress {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  type: string;
  totalStudents: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  results?: Array<{
    studentId: string;
    email?: string;
    status: string;
    error?: string;
  }>;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface StudentEmailAccountManagerProps {
  /** Base path for the Nexa API proxy, e.g. "" or "/api". Defaults to "". */
  basePath?: string;
  /** Email tier to use when creating accounts */
  tier: EmailTier;
  /** Domain to provision accounts on, e.g. "loretto.edu.ng" */
  domain: string;
  /** Called after a new account is successfully created */
  onAccountCreated?: (account: StudentEmail) => void;
  className?: string;
}

export interface EmailBulkProvisioningPanelProps {
  /** Pre-load a list of students — skips the JSON textarea input */
  students?: EmailCreateFormData[];
  /** Base path for the Nexa API proxy. Defaults to "". */
  basePath?: string;
  /** Email tier to use for this bulk job */
  tier: EmailTier;
  /** Domain to provision accounts on */
  domain: string;
  /** Called when the bulk job reaches completed or failed */
  onJobComplete?: (progress: EmailJobProgress) => void;
  className?: string;
}
