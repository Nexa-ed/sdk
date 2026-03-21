"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Save, TestTube, Globe, AlertCircle, CheckCircle } from "lucide-react";
import { useNexaContext } from "../context";
import type { PaymentConfigPanelProps, PaymentConfig } from "../payment-types";

export { PaymentConfigPanelProps };

export function PaymentConfigPanel({
  onConfigUpdate,
  onTestConnection,
  branding,
}: PaymentConfigPanelProps) {
  const { basePath } = useNexaContext();

  const [config, setConfig] = useState<Partial<PaymentConfig>>({
    mode: "test",
    platformFeePercent: 2.5,
    platformFeeFixed: 0,
    customBranding: { businessName: branding?.businessName ?? "", supportEmail: "" },
    isActive: false,
    publicKey: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ test?: boolean; live?: boolean }>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${basePath}/payments/config`);
        if (response.ok) {
          const data = await response.json();
          const cfg = data.config ?? (data.isActive !== undefined ? data : null);
          if (cfg) setConfig(cfg);
        } else if (response.status !== 404) {
          throw new Error("Failed to fetch payment configuration");
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load payment configuration");
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [basePath]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${basePath}/payments/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message ?? "Failed to save configuration");
      }

      const data = await response.json();
      if (data.success !== false) {
        setSuccess("Payment configuration saved successfully!");
        onConfigUpdate?.(config as PaymentConfig);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to save payment configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (mode: "test" | "live") => {
    try {
      setIsTesting(true);
      setError(null);

      const result = await onTestConnection?.(mode);

      if (result !== undefined) {
        setTestResults((prev) => ({ ...prev, [mode]: result }));
      } else {
        const testResponse = await fetch(`${basePath}/payments/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            amount: 100,
            metadata: { source: "custom", userEmail: "test@example.com", testMode: true },
          }),
        });
        setTestResults((prev) => ({ ...prev, [mode]: testResponse.ok }));
      }
    } catch {
      setTestResults((prev) => ({ ...prev, [mode]: false }));
    } finally {
      setIsTesting(false);
    }
  };

  const setField = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
    setError(null);
  };

  const setBranding = (key: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      customBranding: { ...prev.customBranding!, [key]: value } as PaymentConfig["customBranding"],
    }));
    setSuccess(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading payment configuration…</span>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 pb-2">
          <h3 className="text-xl font-semibold">Payment Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure Paystack settings and platform fees for{" "}
            {config.customBranding?.businessName || "your school"}.
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Error / success alerts */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Mode */}
          <div>
            <label className={labelCls}>Payment Mode</label>
            <select
              value={config.mode ?? "test"}
              onChange={(e) => setField("mode", e.target.value as "test" | "live")}
              className={inputCls}
            >
              <option value="test">Test Mode</option>
              <option value="live">Live Mode</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {config.mode === "test"
                ? "Test mode uses Paystack test keys for development and testing."
                : "Live mode processes real payments. Ensure you have valid live keys configured."}
            </p>
          </div>

          {/* Public Key */}
          <div>
            <label className={labelCls}>Paystack Public Key</label>
            <input
              type="password"
              placeholder={config.mode === "test" ? "pk_test_…" : "pk_live_…"}
              value={config.publicKey ?? ""}
              onChange={(e) => setField("publicKey", e.target.value)}
              className={`${inputCls} font-mono`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Paystack public key for {config.mode} mode.
            </p>
          </div>

          {/* Subaccount */}
          <div>
            <label className={labelCls}>Subaccount Code (Optional)</label>
            <input
              type="text"
              placeholder="ACCT_…"
              value={config.subaccountCode ?? ""}
              onChange={(e) => setField("subaccountCode", e.target.value)}
              className={`${inputCls} font-mono`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paystack subaccount code for direct settlement.
            </p>
          </div>

          <hr className="border-t border-gray-200" />

          {/* Platform fees */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold">Platform Fees</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Percentage Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="2.5"
                  value={config.platformFeePercent ?? ""}
                  onChange={(e) => setField("platformFeePercent", parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
                <p className="text-xs text-gray-500 mt-1">Percentage of transaction (e.g. 2.5%)</p>
              </div>
              <div>
                <label className={labelCls}>Fixed Fee (Kobo)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={config.platformFeeFixed ?? ""}
                  onChange={(e) => setField("platformFeeFixed", parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
                <p className="text-xs text-gray-500 mt-1">Fixed amount in kobo (e.g. 100 = ₦1.00)</p>
              </div>
            </div>

            {/* Fee preview */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h5 className="font-semibold text-sm mb-2">Fee Preview (on ₦1,000)</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Amount:</span>
                  <span>₦1,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Fee:</span>
                  <span>
                    ₦
                    {(
                      (100000 * (config.platformFeePercent ?? 0)) / 100 +
                      (config.platformFeeFixed ?? 0)
                    ) / 100}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-500">Net Amount:</span>
                  <span>
                    ₦
                    {(
                      100000 -
                      ((100000 * (config.platformFeePercent ?? 0)) / 100 +
                        (config.platformFeeFixed ?? 0))
                    ) / 100}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-200" />

          {/* Branding */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold">Custom Branding</h4>
            <div>
              <label className={labelCls}>Business Name</label>
              <input
                type="text"
                placeholder="Your School Name"
                value={config.customBranding?.businessName ?? ""}
                onChange={(e) => setBranding("businessName", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Support Email</label>
              <input
                type="email"
                placeholder="support@yourschool.com"
                value={config.customBranding?.supportEmail ?? ""}
                onChange={(e) => setBranding("supportEmail", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Logo URL (Optional)</label>
              <input
                type="url"
                placeholder="https://yourschool.com/logo.png"
                value={config.customBranding?.logo ?? ""}
                onChange={(e) => setBranding("logo", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <hr className="border-t border-gray-200" />

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Payments</p>
              <p className="text-xs text-gray-500">Allow students to make payments through this configuration.</p>
            </div>
            <button
              role="switch"
              aria-checked={config.isActive ?? false}
              onClick={() => setField("isActive", !(config.isActive ?? false))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                config.isActive ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  config.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Connection test */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Connection Test</h4>
            <div className="flex gap-3">
              <button
                onClick={() => handleTestConnection("test")}
                disabled={isTesting || !config.publicKey}
                className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Mode
                {testResults.test !== undefined && (
                  <span
                    className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                      testResults.test
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {testResults.test ? "✓" : "✗"}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTestConnection("live")}
                disabled={isTesting || !config.publicKey || config.mode !== "live"}
                className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Live Mode
                {testResults.live !== undefined && (
                  <span
                    className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                      testResults.live
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {testResults.live ? "✓" : "✗"}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                !config.publicKey ||
                !config.customBranding?.businessName ||
                !config.customBranding?.supportEmail
              }
              className="flex items-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
