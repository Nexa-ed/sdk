"use client";

import { useState, useEffect } from "react";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { useUploadFile } from "../hooks/useUploadFile";
import type { UploadState } from "../types";

export interface UploadZoneProps {
  /**
   * Called once the file has been queued in the pipeline.
   * Receives the NeonDB file ID returned after a successful upload.
   */
  onFileQueued: (fileId: string) => void;
  /**
   * Optional custom upload handler. When provided, this overrides the
   * default `useUploadFile` behaviour. Receives the selected File and must
   * resolve with the NeonDB file ID.
   *
   * Omit this prop to use the built-in two-phase direct-upload flow, which
   * sends the file directly to Nexa without going through your app's server.
   */
  onUpload?: (file: File) => Promise<{ fileId: string }>;
  /** Optional label shown below the title. */
  description?: string;
}

export function UploadZone({ onFileQueued, onUpload, description }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  // Default upload mechanism — two-phase direct upload bypassing this server.
  const { uploadFile, isDispatching, uploadProgress } = useUploadFile();

  // Sync byte-level progress from the hook into local state while uploading.
  useEffect(() => {
    setState((prev) => {
      if (prev.phase !== "uploading") return prev;
      return { ...prev, progress: uploadProgress };
    });
  }, [uploadProgress]);

  // Once all bytes are sent, transition from "uploading" to "processing"
  // while Nexa handles UploadThing + FastAPI dispatch.
  useEffect(() => {
    if (!isDispatching) return;
    setState((prev) => {
      if (prev.phase !== "uploading") return prev;
      return { phase: "processing", fileName: prev.fileName };
    });
  }, [isDispatching]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (file.type !== "application/pdf") {
      setState({ phase: "error", message: "Only PDF files are supported" });
      return;
    }
    if (file.size > 64 * 1024 * 1024) {
      setState({ phase: "error", message: "File exceeds 64 MB limit" });
      return;
    }

    setState({ phase: "uploading", fileName: file.name, progress: 0 });

    try {
      let fileId: string;

      if (onUpload) {
        // Custom handler provided by the consuming app.
        const result = await onUpload(file);
        if (!result.fileId) {
          setState({ phase: "error", message: "Pipeline did not return a file ID" });
          return;
        }
        fileId = result.fileId;
      } else {
        // Built-in two-phase direct upload.
        const result = await uploadFile(file);
        if (!result.success || !result.fileId) {
          setState({ phase: "error", message: result.error ?? "Upload failed" });
          return;
        }
        fileId = result.fileId;
      }

      setState({ phase: "done", fileName: file.name, fileId });
      onFileQueued(fileId);
    } catch (e) {
      setState({ phase: "error", message: String(e) });
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const canUpload = state.phase === "idle" || state.phase === "done" || state.phase === "error";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Upload PDF for Processing</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {description ?? "Uploads to the OCR pipeline for student records extraction."}
          </p>
        </div>
        {(state.phase === "done" || state.phase === "error") && (
          <button
            onClick={() => setState({ phase: "idle" })}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1 border border-gray-200 rounded-md"
          >
            Upload another
          </button>
        )}
      </div>

      {canUpload && (
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all
            ${isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}
        >
          <div className="text-4xl select-none">📄</div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              Drop a PDF here, or <span className="text-blue-600">click to browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF only · max 64 MB</p>
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}

      {state.phase === "uploading" && (
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <LoadingSpinner size={4} />
            <span>Uploading <strong>{state.fileName}</strong>…</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.phase === "processing" && (
        <div className="flex items-center gap-2 text-sm text-gray-700 py-4">
          <LoadingSpinner size={4} />
          <span>Sending <strong>{state.fileName}</strong> to the OCR pipeline…</span>
        </div>
      )}

      {state.phase === "done" && (
        <div className="flex items-center gap-2 py-4">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{state.fileName} queued!</p>
            <p className="text-xs text-gray-400">
              File ID: <span className="font-mono text-purple-700">{state.fileId}</span>
              {" · "}<span className="text-blue-600">selected below</span>
            </p>
          </div>
        </div>
      )}

      {state.phase === "error" && (
        <div className="flex items-start gap-2 py-4">
          <span className="text-2xl">❌</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Upload or dispatch failed</p>
            <p className="text-xs text-red-500 mt-0.5 font-mono">{state.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
