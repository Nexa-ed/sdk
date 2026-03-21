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
 * Uses XMLHttpRequest internally so `uploadProgress` (0–100) reflects actual
 * byte-transfer progress, then `isDispatching` covers the server-side phase
 * (UploadThing + FastAPI dispatch) while waiting for the 200 response.
 *
 * @example
 * ```tsx
 * const { uploadFile, isUploading, isDispatching, uploadProgress } = useUploadFile();
 *
 * const result = await uploadFile(file);
 * if (result.success && result.fileId) {
 *   // track pipeline progress with useFileProgress(result.fileId)
 * }
 * ```
 */
export function useUploadFile() {
  const { basePath } = useNexaContext();
  const [isUploading, setIsUploading] = useState(false);
  /** True once the bytes are sent but we're still waiting for the server response */
  const [isDispatching, setIsDispatching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    (file: File): Promise<UploadFileResult> =>
      new Promise((resolve) => {
        setIsUploading(true);
        setIsDispatching(false);
        setUploadProgress(0);
        setUploadError(null);

        const form = new FormData();
        form.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${basePath}/upload`);

        // Track byte-level upload progress
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
            // Bytes fully sent — now waiting for server-side pipeline dispatch
            if (pct === 100) setIsDispatching(true);
          }
        };

        xhr.onload = () => {
          setIsUploading(false);
          setIsDispatching(false);

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as {
                success: boolean;
                fileId?: string;
                jobId?: string;
                status?: string;
              };
              setUploadProgress(100);
              resolve({
                success: true,
                fileId: data.fileId,
                jobId: data.jobId,
                status: data.status ?? "pending",
              });
            } catch {
              const message = "Invalid response from server";
              setUploadError(message);
              resolve({ success: false, error: message });
            }
          } else {
            let message = `Upload failed (${xhr.status})`;
            try {
              const body = JSON.parse(xhr.responseText);
              if (body?.error) message = body.error;
              else if (body?.detail) message = body.detail;
            } catch {
              if (xhr.responseText) message += `: ${xhr.responseText.slice(0, 200)}`;
            }
            setUploadError(message);
            resolve({ success: false, error: message });
          }
        };

        xhr.onerror = () => {
          setIsUploading(false);
          setIsDispatching(false);
          const message = "Network error — upload request failed";
          setUploadError(message);
          resolve({ success: false, error: message });
        };

        xhr.ontimeout = () => {
          setIsUploading(false);
          setIsDispatching(false);
          const message = "Upload timed out";
          setUploadError(message);
          resolve({ success: false, error: message });
        };

        xhr.send(form);
      }),
    [basePath],
  );

  return { uploadFile, isUploading, isDispatching, uploadProgress, uploadError };
}
