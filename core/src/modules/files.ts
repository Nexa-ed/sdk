import { NexaError } from "../error";
import { nexaFetch } from "../http";
import type { ResolvedNexaConfig } from "../config";
import type {
  FileSubmitOptions,
  FileSubmitResult,
  FileProgressEvent,
} from "../types";

export class FilesModule {
  constructor(private readonly config: ResolvedNexaConfig) {}

  /**
   * Submit a file for processing by the Nexa OCR pipeline.
   *
   * Returns immediately with a `jobId` (HTTP 202). Use `streamProgress()`
   * or the webhook to know when processing is complete.
   *
   * @example
   * const job = await nexa.files.submit({
   *   fileUrl: uploadedFile.url,
   *   userId: currentUser.id,
   *   extractionType: "results",
   * });
   */
  async submit(options: FileSubmitOptions): Promise<FileSubmitResult> {
    return nexaFetch<FileSubmitResult>(
      this.config,
      "/api/file-processing/extract",
      {
        method: "POST",
        body: {
          fileUrl: options.fileUrl,
          userId: options.userId,
          extractionType: options.extractionType,
          processorType: options.processorType,
          userEmail: options.userEmail,
          userName: options.userName,
        },
      },
    );
  }

  /**
   * Stream real-time processing progress for a file as an async generator.
   *
   * Yields `FileProgressEvent` objects until the event type is `"complete"`
   * or `"error"`, then the generator returns.
   *
   * Tip: in a Next.js Server Component or Route Handler, proxy this through
   * `@nexa-ed/next`'s route handler instead of calling directly — the
   * browser's `EventSource` cannot attach custom headers.
   *
   * @example
   * for await (const event of nexa.files.streamProgress(fileId, userId)) {
   *   if (event.type === "complete") console.log("done!", event.recordsExtracted);
   * }
   */
  async *streamProgress(
    fileId: string,
    userId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<FileProgressEvent> {
    const url = `${this.config.baseUrl}/api/file-processing/progress/${fileId}`;

    const res = await fetch(url, {
      headers: {
        "x-api-key": this.config.apiKey,
        "x-user-id": userId,
        accept: "text/event-stream",
      },
      signal,
    });

    if (!res.ok || !res.body) {
      throw new NexaError(
        `Failed to open progress stream: ${res.statusText}`,
        res.status,
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as FileProgressEvent;
            yield event;
            if (event.type === "complete" || event.type === "error") return;
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.cancel().catch(() => undefined);
    }
  }
}
