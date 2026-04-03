"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  StudentEmail,
  StudentEmailAccountManagerProps,
  EmailCreateFormData,
} from "../email-types";

type ActionState = { email: string; action: "suspend" | "restore" | "reset" } | null;

export function StudentEmailAccountManager({
  basePath = "",
  tier,
  domain,
  onAccountCreated,
  className,
}: StudentEmailAccountManagerProps) {
  const [accounts, setAccounts]         = useState<StudentEmail[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);

  const [form, setForm]                 = useState<EmailCreateFormData>({
    studentId: "",
    firstName: "",
    lastName: "",
    gradeLevel: "",
    recoveryEmail: "",
  });
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const [actionState, setActionState]   = useState<ActionState>(null);
  const [actionError, setActionError]   = useState<string | null>(null);
  const [resetResult, setResetResult]   = useState<{ email: string; temporaryPassword: string } | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setLoadError(null);
    try {
      const res = await fetch(`${basePath}/api/student-emails/list`);
      if (!res.ok) throw new Error(`Failed to load accounts (${res.status})`);
      const data = await res.json();
      setAccounts(data.data ?? []);
    } catch (e: any) {
      setLoadError(e.message ?? "Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  }, [basePath]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const res = await fetch(`${basePath}/api/student-emails/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tier, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
      setCreateSuccess({ email: data.data.email, temporaryPassword: data.data.temporaryPassword });
      setForm({ studentId: "", firstName: "", lastName: "", gradeLevel: "", recoveryEmail: "" });
      onAccountCreated?.(data.data);
      fetchAccounts();
    } catch (e: any) {
      setCreateError(e.message ?? "Failed to create account");
    } finally {
      setCreating(false);
    }
  }

  async function handleAction(email: string, action: "suspend" | "restore" | "reset") {
    setActionState({ email, action });
    setActionError(null);
    setResetResult(null);
    try {
      const endpoint = action === "reset" ? "reset-password" : action;
      const res = await fetch(`${basePath}/api/student-emails/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
      if (action === "reset") {
        setResetResult({ email: data.data.email, temporaryPassword: data.data.temporaryPassword });
      }
      fetchAccounts();
    } catch (e: any) {
      setActionError(e.message ?? `Failed to ${action} account`);
    } finally {
      setActionState(null);
    }
  }

  const statusBadge = (status: StudentEmail["status"]) => {
    const styles: Record<string, string> = {
      active:    "bg-green-100 text-green-800",
      suspended: "bg-yellow-100 text-yellow-800",
      deleted:   "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className={`space-y-8 ${className ?? ""}`}>
      {/* ── Create form ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Create account</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Student ID *">
            <input
              required
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              placeholder="stu_001"
              className={inputCls}
            />
          </Field>
          <Field label="First name *">
            <input
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="Amara"
              className={inputCls}
            />
          </Field>
          <Field label="Last name *">
            <input
              required
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Obi"
              className={inputCls}
            />
          </Field>
          <Field label="Grade level">
            <input
              value={form.gradeLevel}
              onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
              placeholder="JSS2"
              className={inputCls}
            />
          </Field>
          <Field label="Recovery email" className="sm:col-span-2">
            <input
              type="email"
              value={form.recoveryEmail}
              onChange={(e) => setForm((f) => ({ ...f, recoveryEmail: e.target.value }))}
              placeholder="parent@example.com"
              className={inputCls}
            />
          </Field>

          {createError && (
            <p className="sm:col-span-2 text-sm text-red-600">{createError}</p>
          )}
          {createSuccess && (
            <div className="sm:col-span-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm">
              <p className="font-medium text-green-800">Account created</p>
              <p className="text-green-700 mt-0.5">Email: <code>{createSuccess.email}</code></p>
              <p className="text-green-700">Temporary password: <code>{createSuccess.temporaryPassword}</code></p>
              <p className="text-xs text-green-600 mt-1">Share this password securely — the student will be prompted to change it.</p>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Accounts table ───────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Accounts
            {accounts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({accounts.length})</span>
            )}
          </h2>
          <button
            onClick={fetchAccounts}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Refresh
          </button>
        </div>

        {actionError && (
          <div className="mx-6 mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
        {resetResult && (
          <div className="mx-6 mt-3 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm">
            <p className="font-medium text-blue-800">Password reset</p>
            <p className="text-blue-700 mt-0.5">
              New temporary password for <code>{resetResult.email}</code>:{" "}
              <code>{resetResult.temporaryPassword}</code>
            </p>
          </div>
        )}

        {loadingAccounts ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            Loading accounts…
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center py-12 text-sm text-red-600">
            {loadError}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            No accounts yet. Create one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Email", "Grade", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {accounts.map((acct) => {
                  const busy =
                    actionState?.email === acct.email;
                  return (
                    <tr key={acct.email} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {acct.firstName} {acct.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{acct.email}</td>
                      <td className="px-4 py-3 text-gray-500">{acct.gradeLevel ?? "—"}</td>
                      <td className="px-4 py-3">{statusBadge(acct.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {acct.status === "active" && (
                            <ActionButton
                              onClick={() => handleAction(acct.email, "suspend")}
                              disabled={busy}
                              busy={busy && actionState?.action === "suspend"}
                              label="Suspend"
                              busyLabel="Suspending…"
                              variant="warn"
                            />
                          )}
                          {acct.status === "suspended" && (
                            <ActionButton
                              onClick={() => handleAction(acct.email, "restore")}
                              disabled={busy}
                              busy={busy && actionState?.action === "restore"}
                              label="Restore"
                              busyLabel="Restoring…"
                              variant="primary"
                            />
                          )}
                          {acct.status !== "deleted" && (
                            <ActionButton
                              onClick={() => handleAction(acct.email, "reset")}
                              disabled={busy}
                              busy={busy && actionState?.action === "reset"}
                              label="Reset password"
                              busyLabel="Resetting…"
                              variant="neutral"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  busy,
  label,
  busyLabel,
  variant,
}: {
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  label: string;
  busyLabel: string;
  variant: "primary" | "warn" | "neutral";
}) {
  const styles: Record<string, string> = {
    primary: "text-green-700 hover:text-green-900",
    warn:    "text-yellow-700 hover:text-yellow-900",
    neutral: "text-gray-500 hover:text-gray-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-medium disabled:opacity-40 ${styles[variant]}`}
    >
      {busy ? busyLabel : label}
    </button>
  );
}
