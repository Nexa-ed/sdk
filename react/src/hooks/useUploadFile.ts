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
 * Upload a file to the Nexa pipeline using a two-phase direct-upload flow.
 *
 * Phase 1 — Prepare (no file bytes leave Loretto):
 *   POST /api/nexa/prepare  { name, size, type }
 *   ← { token, uploadUrl }
 *
 * Phase 2 — Upload (file goes directly to Nexa, skipping the Loretto server):
 *   POST uploadUrl  (multipart/form-data, x-upload-token header)
 *   ← { success, fileId }
 *
 * `uploadProgress` (0–100) reflects actual byte-transfer progress from
 * the browser to Nexa. `isDispatching` covers Nexa's UploadThing + FastAPI
 * dispatch phase while waiting for the final response.
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

        // Phase 1: get a short-lived token + the direct upload URL from the SDK
        // server handler. The API key never leaves the server — only a 2-minute
        // signed token is returned to the browser.
        fetch(`${basePath}/prepare`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size, type: file.type }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({})) as { error?: string };
              throw new Error(body.error ?? `Prepare failed (${res.status})`);
            }
            return res.json() as Promise<{ token: string; uploadUrl: string }>;
          })
          .then(({ token, uploadUrl }) => {
            // Phase 2: upload the file directly to Nexa using the token.
            // The Loretto server is NOT in this path — only the browser and Nexa.
            const form = new FormData();
            form.append("file", file);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", uploadUrl);
            xhr.setRequestHeader("x-upload-token", token);
            xhr.timeout = 10 * 60 * 1000; // 10 minutes — large PDFs can be slow

            // Track byte-level progress during the direct upload
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(pct);
                // All bytes sent — Nexa is now uploading to UploadThing + dispatching FastAPI
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
          })
          .catch((err) => {
            setIsUploading(false);
            setIsDispatching(false);
            const message = err instanceof Error ? err.message : "Prepare step failed";
            setUploadError(message);
            resolve({ success: false, error: message });
          });
      }),
    [basePath],
  );

  return { uploadFile, isUploading, isDispatching, uploadProgress, uploadError };
}
