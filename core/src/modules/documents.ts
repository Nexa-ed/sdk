import { nexaRpc } from "../http";
import type { ResolvedNexaConfig } from "../config";
import type {
  AnalysisJob,
  FileDetails,
  GetStudentRecordsOptions,
  GetUserDocumentsResponse,
  RefinementResult,
  StudentRecord,
  StudentRecordsResponse,
  SubjectGroup,
  UserDocument,
} from "../types";

export class DocumentsModule {
  constructor(private readonly config: ResolvedNexaConfig) {}

  // ─── Document listing ──────────────────────────────────────────────────────

  /**
   * List all documents processed by this user.
   *
   * @example
   * const { documents } = await nexa.documents.getUserDocuments(userId);
   */
  async getUserDocuments(userId: string): Promise<GetUserDocumentsResponse> {
    return nexaRpc<GetUserDocumentsResponse>(
      this.config,
      "documents/getUserDocuments",
      {},
      userId,
    );
  }

  /**
   * Get full metadata for a single file.
   */
  async getFileDetails(userId: string, fileId: string): Promise<FileDetails> {
    return nexaRpc<FileDetails>(
      this.config,
      "documents/getFileDetails",
      { fileId },
      userId,
    );
  }

  /**
   * Get aggregated statistics (page count, record count, chunk progress) for a file.
   */
  async getFileStatistics(
    userId: string,
    fileId: string,
  ): Promise<Record<string, unknown>> {
    return nexaRpc(this.config, "documents/getFileStatistics", { fileId }, userId);
  }

  // ─── Student records ───────────────────────────────────────────────────────

  /**
   * Get paginated student records for a file with optional filters.
   *
   * @example
   * const { items, pagination } = await nexa.documents.getStudentRecords(userId, fileId, {
   *   page: 1,
   *   limit: 50,
   *   filters: { pageStart: 1, pageEnd: 5 },
   * });
   */
  async getStudentRecords(
    userId: string,
    fileId: string,
    options?: GetStudentRecordsOptions,
  ): Promise<StudentRecordsResponse> {
    return nexaRpc<StudentRecordsResponse>(
      this.config,
      "documents/getFileStudentRecords",
      {
        fileId,
        page: options?.page ?? 1,
        limit: options?.limit ?? 100,
        filters: options?.filters,
      },
      userId,
    );
  }

  /**
   * Get all student records for a specific page, including any LLM refinements.
   */
  async getPageRecords(
    userId: string,
    fileId: string,
    pageNumber: number,
  ): Promise<{ records: StudentRecord[]; refinements: unknown[] }> {
    return nexaRpc(
      this.config,
      "documents/getPageRecordsWithRefinement",
      { fileId, pageNumber },
      userId,
    );
  }

  /**
   * Update a single student record's fields.
   */
  async updateRecord(
    userId: string,
    recordId: string,
    data: Partial<Pick<StudentRecord, "studentName" | "normalizedData" | "rawData">>,
  ): Promise<StudentRecord> {
    return nexaRpc<StudentRecord>(
      this.config,
      "documents/updateStudentRecord",
      { recordId, recordData: data },
      userId,
    );
  }

  /**
   * Create new student records for a specific page in bulk.
   */
  async createRecords(
    userId: string,
    fileId: string,
    pageNumber: number,
    rows: Record<string, unknown>[],
  ): Promise<{ created: StudentRecord[] }> {
    return nexaRpc(
      this.config,
      "documents/createStudentRecords",
      { fileId, pageNumber, rows },
      userId,
    );
  }

  /**
   * Delete a student record.
   */
  async deleteRecord(
    userId: string,
    recordId: string,
  ): Promise<{ success: boolean }> {
    return nexaRpc(
      this.config,
      "documents/deleteStudentRecord",
      { recordId },
      userId,
    );
  }

  // ─── Analysis jobs ─────────────────────────────────────────────────────────

  /**
   * Get the latest analysis job for a file.
   */
  async getLatestJob(userId: string, fileId: string): Promise<AnalysisJob | null> {
    return nexaRpc<AnalysisJob | null>(
      this.config,
      "documents/getLatestAnalysisJobForFile",
      { fileId },
      userId,
    );
  }

  /**
   * Get an analysis job by ID.
   */
  async getJob(userId: string, jobId: string): Promise<AnalysisJob> {
    return nexaRpc<AnalysisJob>(
      this.config,
      "documents/getAnalysisJob",
      { jobId },
      userId,
    );
  }

  /**
   * Get the full result of an analysis job.
   */
  async getJobResult(
    userId: string,
    jobId: string,
  ): Promise<Record<string, unknown>> {
    return nexaRpc(
      this.config,
      "documents/getAnalysisJobResult",
      { jobId },
      userId,
    );
  }

  /**
   * Reset the analysis job for a file so it can be re-run.
   */
  async resetJob(userId: string, fileId: string): Promise<{ success: boolean }> {
    return nexaRpc(this.config, "documents/resetAnalysisJob", { fileId }, userId);
  }

  /**
   * Confirm subject group assignments for a batch of student records.
   */
  async confirmSubjectGroups(
    userId: string,
    groups: SubjectGroup[],
  ): Promise<{ success: boolean }> {
    return nexaRpc(
      this.config,
      "documents/confirmSubjectGroups",
      { groups },
      userId,
    );
  }

  // ─── LLM Refinement ────────────────────────────────────────────────────────

  /**
   * Trigger LLM re-refinement for a specific page in a file.
   *
   * This re-runs the worker's vision model on the PDF page image and
   * updates the student records with any corrections.
   *
   * @example
   * const result = await nexa.documents.refinePage(userId, fileId, chunkId, 3);
   * console.log(`Refined ${result.transactionCount} records`);
   */
  async refinePage(
    userId: string,
    fileId: string,
    chunkId: string,
    pageNumber: number,
  ): Promise<RefinementResult> {
    return nexaRpc<RefinementResult>(
      this.config,
      "documents/refinePageWithLLM",
      { fileId, chunkId, pageNumber },
      userId,
    );
  }

  // ─── Retry / chunk details ─────────────────────────────────────────────────

  /**
   * Get retry statistics for a user (failed chunks, retry waves).
   */
  async getRetryStatistics(userId: string): Promise<Record<string, unknown>> {
    return nexaRpc(this.config, "documents/getUserRetryStatistics", {}, userId);
  }

  /**
   * Get chunk-to-page mapping for a file.
   */
  async getChunksWithPages(
    userId: string,
    fileId: string,
  ): Promise<Record<string, unknown>> {
    return nexaRpc(
      this.config,
      "documents/getChunksWithPages",
      { fileId },
      userId,
    );
  }
}
