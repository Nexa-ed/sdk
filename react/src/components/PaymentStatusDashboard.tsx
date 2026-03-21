"use client";

import React, { useState, useEffect } from "react";
import { Download, RefreshCw, Search, Filter, Calendar } from "lucide-react";
import { useNexaContext } from "../context";
import type { PaymentStatusDashboardProps, PaymentTransaction, TransactionFilters, PaymentStats } from "../payment-types";

export { PaymentStatusDashboardProps };

export function PaymentStatusDashboard({
  userEmail,
  filters: initialFilters = {},
  onFiltersChange,
}: PaymentStatusDashboardProps) {
  const { basePath } = useNexaContext();

  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const updateFilters = (next: TransactionFilters) => {
    setFilters(next);
    onFiltersChange?.(next);
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.customerEmail ?? userEmail) params.set("customerEmail", (filters.customerEmail ?? userEmail)!);
      if (filters.dateRange?.from) params.set("from", filters.dateRange.from);
      if (filters.dateRange?.to) params.set("to", filters.dateRange.to);
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.offset) params.set("offset", String(filters.offset));

      const [txRes, statsRes] = await Promise.all([
        fetch(`${basePath}/payments/transactions?${params}`),
        fetch(`${basePath}/payments/stats?${params}`),
      ]);

      const txData = await txRes.json();
      if (txData.success !== false) {
        setTransactions(txData.transactions ?? (Array.isArray(txData) ? txData : []));
      } else {
        setError(txData.message ?? "Failed to fetch transactions");
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats ?? statsData ?? null);
      }
    } catch {
      setError("Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters, basePath]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatAmount = (kobo: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

  const formatDate = (val: string | number | null | undefined) => {
    if (!val) return "—";
    const d = new Date(typeof val === "number" ? val : val);
    return d.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    success: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    abandoned: "bg-gray-100 text-gray-600",
  };

  const filtered = transactions.filter(
    (t) =>
      !searchTerm ||
      t.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const exportCsv = () => {
    const rows = [
      ["Reference", "Customer Email", "Amount", "Status", "Date", "Channel"].join(","),
      ...filtered.map((t) =>
        [t.reference, t.customerEmail ?? "", t.amount / 100, t.status, formatDate(t.createdAt), t.channel ?? "N/A"].join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls =
    "rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm p-6 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin mr-2 text-gray-400" />
        <span className="text-gray-500">Loading transactions…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white shadow-sm p-6 text-center text-red-600">
        <p className="mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center mx-auto px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  const totalCount = stats?.total ?? stats?.totalTransactions ?? 0;
  const successCount = stats?.successful ?? stats?.successfulTransactions ?? 0;
  const pendingCount = stats?.pending ?? stats?.pendingTransactions ?? 0;
  const totalAmt = stats?.totalAmount ?? 0;
  const successRate = stats?.successRate ?? (totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-white shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                {successRate.toFixed(1)}% Success
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
          </div>

          <div className="rounded-lg border bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>

          <div className="rounded-lg border bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold">{formatAmount(totalAmt)}</p>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 pb-2">
          <h3 className="text-xl font-semibold flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Payment Transactions
          </h3>
          <p className="text-sm text-gray-500 mt-1">View and manage payment transactions</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Filters row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                placeholder="Search by email, reference, or name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} w-full pl-9`}
              />
            </div>

            <select
              value={filters.status ?? "all"}
              onChange={(e) =>
                updateFilters({ ...filters, status: e.target.value === "all" ? undefined : (e.target.value as any) })
              }
              className={`${inputCls} md:w-48`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
              <option value="abandoned">Abandoned</option>
            </select>

            <button
              onClick={exportCsv}
              className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>

            <button
              onClick={fetchData}
              className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Date range */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.dateRange?.from ?? ""}
                onChange={(e) =>
                  updateFilters({ ...filters, dateRange: { ...filters.dateRange, from: e.target.value } })
                }
                className={`${inputCls} w-40`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.dateRange?.to ?? ""}
                onChange={(e) =>
                  updateFilters({ ...filters, dateRange: { ...filters.dateRange, to: e.target.value } })
                }
                className={`${inputCls} w-40`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Reference", "Customer", "Amount", "Status", "Date", "Channel", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.reference} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{t.reference}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.customerEmail}</p>
                        {t.customerName && (
                          <p className="text-xs text-gray-500">{t.customerName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{formatAmount(t.amount)}</p>
                        {t.fees != null && (
                          <p className="text-xs text-gray-500">Fee: {formatAmount(t.fees)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs">{formatDate(t.createdAt)}</p>
                        {t.paidAt && (
                          <p className="text-xs text-gray-400">Paid: {formatDate(t.paidAt)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs capitalize">{t.channel ?? "N/A"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => console.log("View transaction:", t.reference)}
                          className="px-3 py-1 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
