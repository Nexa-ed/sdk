"use client";

import { useState, useCallback } from "react";
import { useNexaContext } from "../context";

export interface UploadFileResult {
  success: boolean;
  fileId?: string;
  jobId?: string;
  status?: string;
  error?: string;
}

/**
 * Upload a file to the Nexa pipeline via the SDK proxy at `/api/nexa/upload`.
 *
 * The server-side handler injects the NEXA_API_KEY and starts the OCR
 * processing job — secrets never touch the browser.
 *
 * @example
 * ```tsx
 * const { uploadFile, isUploading, uploadError } = useUploadFile();
 *
 * const result = await uploadFile(file);
 * if (result.success && result.fileId) {
 *   // track progress with useFileProgress(result.fileId)
 * }
 * ```
 */
export function useUploadFile() {
  const { basePath } = useNexaContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadFileResult> => {
      setIsUploading(true);
      setUploadError(null);

      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch(`${basePath}/upload`, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`Upload failed (${res.status}): ${detail}`);
        }

        const data = (await res.json()) as {
          success: boolean;
          fileId?: string;
          jobId?: string;
          status?: string;
        };

        return {
          success: true,
          fileId: data.fileId,
          jobId: data.jobId,
          status: data.status ?? "pending",
        };
      } catch (err: any) {
        const message = err?.message ?? "Upload failed";
        setUploadError(message);
        return { success: false, error: message };
      } finally {
        setIsUploading(false);
      }
    },
    [basePath],
  );

  return { uploadFile, isUploading, uploadError };
}
