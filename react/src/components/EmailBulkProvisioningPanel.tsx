"use client";

import { useState, useEffect, useRef } from "react";
import type {
  EmailBulkProvisioningPanelProps,
  EmailCreateFormData,
  EmailJobProgress,
} from "../email-types";

const POLL_INTERVAL_MS = 3000;

export function EmailBulkProvisioningPanel({
  students: studentsProp,
  basePath = "",
  tier,
  domain,
  onJobComplete,
  className,
}: EmailBulkProvisioningPanelProps) {
  const [jsonInput, setJsonInput]       = useState("");
  const [parseError, setParseError]     = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [job, setJob]                   = useState<EmailJobProgress | null>(null);
  const pollRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling when job reaches a terminal state
  useEffect(() => {
    if (!job) return;
    if (job.status === "completed" || job.status === "failed") {
      if (pollRef.current) clearInterval(pollRef.current);
      onJobComplete?.(job);
    }
  }, [job, onJobComplete]);

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function startPolling(jobId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${basePath}/api/student-emails/status?jobId=${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJob(data.data);
      } catch {
        // silent — keep polling
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleSubmit() {
    setParseError(null);
    setSubmitError(null);

    let students: EmailCreateFormData[];

    if (studentsProp) {
      students = studentsProp;
    } else {
      try {
        students = JSON.parse(jsonInput);
        if (!Array.isArray(students)) throw new Error("Must be a JSON array");
      } catch (e: any) {
        setParseError(e.message ?? "Invalid JSON");
        return;
      }
    }

    if (students.length === 0) {
      setParseError("No students provided");
      return;
    }
    if (students.length > 500) {
      setParseError("Maximum 500 students per bulk job");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${basePath}/api/student-emails/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, tier, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);

      const initialJob: EmailJobProgress = {
        jobId:          data.data.jobId,
        status:         "pending",
        type:           "bulk-create",
        totalStudents:  data.data.totalStudents,
        processedCount: 0,
        successCount:   0,
        failedCount:    0,
        createdAt:      Date.now(),
      };
      setJob(initialJob);
      startPolling(data.data.jobId);
    } catch (e: any) {
      setSubmitError(e.message ?? "Failed to start bulk job");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setJob(null);
    setJsonInput("");
    setParseError(null);
    setSubmitError(null);
  }

  const progressPct = job && job.totalStudents > 0
    ? Math.round((job.processedCount / job.totalStudents) * 100)
    : 0;

  const statusColor: Record<string, string> = {
    pending:    "bg-gray-100 text-gray-700",
    processing: "bg-blue-100 text-blue-700",
    completed:  "bg-green-100 text-green-800",
    failed:     "bg-red-100 text-red-700",
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className ?? ""}`}>
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">Bulk provision</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Create up to 500 student accounts at once. Processed in the background.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Input ──────────────────────────────────────────────────── */}
        {!job && (
          <>
            {!studentsProp && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Students (JSON array)
                </label>
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={PLACEHOLDER}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs text-gray-800 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}

            {studentsProp && (
              <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
                {studentsProp.length} student{studentsProp.length !== 1 ? "s" : ""} ready to provision
              </div>
            )}

            {parseError && (
              <p className="text-sm text-red-600">{parseError}</p>
            )}
            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "Starting…" : "Provision all"}
            </button>
          </>
        )}

        {/* ── Progress ───────────────────────────────────────────────── */}
        {job && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[job.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {job.status}
                </span>
                <span className="text-sm text-gray-600">
                  {job.processedCount} / {job.totalStudents} processed
                </span>
              </div>
              {(job.status === "completed" || job.status === "failed") && (
                <button
                  onClick={reset}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  New job
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  job.status === "failed" ? "bg-red-500" : "bg-green-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <Stat label="Total"   value={job.totalStudents}  />
              <Stat label="Created" value={job.successCount}   color="text-green-700" />
              <Stat label="Failed"  value={job.failedCount}    color={job.failedCount > 0 ? "text-red-600" : undefined} />
            </div>

            {/* Per-student results */}
            {job.results && job.results.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {["Student ID", "Email", "Result"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {job.results.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-600">{r.studentId}</td>
                        <td className="px-3 py-2 text-gray-800">{r.email ?? "—"}</td>
                        <td className="px-3 py-2">
                          {r.status === "success" ? (
                            <span className="text-green-700">✓ Created</span>
                          ) : (
                            <span className="text-red-600" title={r.error}>✗ {r.error ?? "Failed"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Job error */}
            {job.error && (
              <p className="text-sm text-red-600">{job.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-md bg-gray-50 p-2">
      <p className={`text-lg font-semibold ${color ?? "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

const PLACEHOLDER = `[
  { "studentId": "stu_001", "firstName": "Amara",  "lastName": "Obi"     },
  { "studentId": "stu_002", "firstName": "Chidi",  "lastName": "Eze"     },
  { "studentId": "stu_003", "firstName": "Ngozi",  "lastName": "Adeyemi" }
]`;
