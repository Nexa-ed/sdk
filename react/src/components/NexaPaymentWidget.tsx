"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CreditCard, Banknote, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNexaContext } from "../context";
import { normalizePaymentMetadata } from "../utils/paymentMetadata";
import { calculateTotalAmountFromNetAmount } from "../utils/feeCalculation";
import type {
  NexaPaymentWidgetProps,
  PaymentConfig,
  PaymentTransaction,
} from "../payment-types";

export { NexaPaymentWidgetProps };

export function NexaPaymentWidget({
  amount,
  email,
  metadata,
  onSuccess,
  onError,
  onClose,
  callbackUrl,
  branding,
  size = "medium",
  showBankTransfer = false,
  paymentStatus: externalPaymentStatus,
  paymentReference: externalPaymentReference,
}: NexaPaymentWidgetProps) {
  const { basePath } = useNexaContext();

  const [paymentMethod, setPaymentMethod] = useState<"online" | "bank" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [internalPaymentReference, setInternalPaymentReference] = useState<string | null>(null);
  const [internalPaymentStatus, setInternalPaymentStatus] = useState<"pending" | "success" | "failed" | null>(null);
  const [feeCalculation, setFeeCalculation] = useState<{
    netAmount: number;
    platformFee: number;
    totalAmount: number;
  } | null>(null);

  const paymentStatus = externalPaymentStatus !== undefined ? externalPaymentStatus : internalPaymentStatus;
  const paymentReference = externalPaymentReference !== undefined ? externalPaymentReference : internalPaymentReference;

  // Fetch payment config through the SDK proxy
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${basePath}/payments/config`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        } else if (data.isActive !== undefined) {
          // Some Nexa versions return the config directly
          setConfig(data as PaymentConfig);
        } else {
          setError(data.message || "Failed to load payment configuration");
        }
      } catch (err: any) {
        setError("Failed to load payment configuration");
      }
    };
    fetchConfig();
  }, [basePath]);

  // Calculate fees when config loads
  useEffect(() => {
    if (!config) return;

    const hasValidFees =
      config.platformFeePercent != null &&
      !isNaN(config.platformFeePercent) &&
      config.platformFeeFixed != null &&
      !isNaN(config.platformFeeFixed);

    if (hasValidFees) {
      try {
        const calculation = calculateTotalAmountFromNetAmount(
          amount,
          config.platformFeePercent as number,
          config.platformFeeFixed as number,
        );
        setFeeCalculation(calculation);
      } catch {
        setError("Failed to calculate payment fees");
      }
    } else {
      setFeeCalculation({ netAmount: amount, platformFee: 0, totalAmount: amount });
    }
  }, [config, amount]);

  // Poll payment status
  useEffect(() => {
    if (!paymentReference || paymentStatus === "success" || paymentStatus === "failed") return;

    const poll = async () => {
      try {
        const response = await fetch(
          `${basePath}/payments/status?reference=${encodeURIComponent(paymentReference)}`,
        );
        const data = await response.json();
        if (data.success) {
          setInternalPaymentStatus(data.status);
          if (data.status === "success") onSuccess?.(data.transaction);
          else if (data.status === "failed") onError?.({ code: "PAYMENT_FAILED", message: "Payment failed" });
        } else if (data.status) {
          // Direct transaction object format
          setInternalPaymentStatus(data.status as any);
          if (data.status === "success") onSuccess?.(data);
          else if (data.status === "failed") onError?.({ code: "PAYMENT_FAILED", message: "Payment failed" });
        }
      } catch {
        // Silently retry on network error
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [paymentReference, paymentStatus, basePath, onSuccess, onError]);

  const handleOnlinePayment = useCallback(async () => {
    if (!config || !feeCalculation) return;
    setIsLoading(true);
    setError(null);

    try {
      const normalizedMetadata = normalizePaymentMetadata(metadata);
      const finalCallbackUrl =
        callbackUrl ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/payment/callback?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
          : "/payment/callback");

      const response = await fetch(`${basePath}/payments/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          netAmount: amount,
          metadata: normalizedMetadata,
          callbackUrl: finalCallbackUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInternalPaymentReference(data.reference);
        setInternalPaymentStatus("pending");
        window.location.href = data.authorizationUrl ?? data.authorization_url;
      } else {
        setError(data.message || "Failed to initialize payment");
        onError?.({ code: "INITIALIZATION_FAILED", message: data.message || "Failed to initialize payment" });
      }
    } catch {
      setError("Failed to initialize payment");
      onError?.({ code: "NETWORK_ERROR", message: "Failed to initialize payment" });
    } finally {
      setIsLoading(false);
    }
  }, [config, feeCalculation, basePath, email, amount, metadata, callbackUrl, onError]);

  const formatAmount = (kobo: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

  const sizeClass = size === "small" ? "max-w-sm" : size === "large" ? "max-w-2xl" : "w-full";

  const resetState = () => {
    setError(null);
    setPaymentMethod(null);
    if (externalPaymentReference === undefined) setInternalPaymentReference(null);
    if (externalPaymentStatus === undefined) setInternalPaymentStatus(null);
  };

  const bankDetails = config?.bankDetails as { bankName?: string; accountNumber?: string; accountName?: string } | undefined;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!config && !error) {
    return (
      <div className={`${sizeClass} rounded-lg border bg-white shadow-sm`}>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading payment options…</span>
        </div>
      </div>
    );
  }

  // ── Config error ──────────────────────────────────────────────────────────
  if (error && !config) {
    return (
      <div className={`${sizeClass} rounded-lg border bg-white shadow-sm`}>
        <div className="p-6">
          <div className="flex items-center text-red-600 mb-4">
            <XCircle className="h-6 w-6 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={resetState}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (paymentStatus === "success") {
    return (
      <div className={`${sizeClass} rounded-lg border bg-white shadow-sm`}>
        <div className="p-6 pb-2">
          <h3 className="text-xl font-semibold flex items-center">
            {branding?.logo && <img src={branding.logo} alt="Logo" className="h-8 w-8 mr-2 rounded" />}
            {branding?.businessName || config?.customBranding?.businessName || "Payment"}
          </h3>
        </div>
        <div className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
          <p className="text-sm text-gray-500 mb-4">
            Your payment of{" "}
            {feeCalculation ? formatAmount(feeCalculation.totalAmount) : formatAmount(amount)} has
            been processed successfully.
          </p>
          {paymentReference && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 mb-4">
              Reference: {paymentReference}
            </span>
          )}
          {feeCalculation && (
            <div className="bg-gray-50 p-4 rounded-lg border mt-4 text-left">
              <h4 className="font-semibold mb-3 text-center text-sm">Payment Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount to School:</span>
                  <span className="font-semibold">{formatAmount(feeCalculation.netAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Fee:</span>
                  <span>{formatAmount(feeCalculation.platformFee)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold text-green-600">Total Paid:</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatAmount(feeCalculation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">You will receive a confirmation email shortly.</p>
        </div>
      </div>
    );
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (paymentStatus === "failed") {
    return (
      <div className={`${sizeClass} rounded-lg border bg-white shadow-sm`}>
        <div className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Payment Failed</h3>
          <p className="text-sm text-gray-500 mb-4">
            Your payment could not be processed. Please try again or contact support.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={resetState}
              className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending ───────────────────────────────────────────────────────────────
  if (paymentStatus === "pending") {
    return (
      <div className={`${sizeClass} rounded-lg border bg-white shadow-sm`}>
        <div className="p-6 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Processing Payment…</h3>
          <p className="text-sm text-gray-500 mb-4">
            Complete your payment of{" "}
            {feeCalculation ? formatAmount(feeCalculation.totalAmount) : formatAmount(amount)}
          </p>
          {paymentReference && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              Reference: {paymentReference}
            </span>
          )}
        </div>
      </div>
    );
  }

  const businessName = branding?.businessName || config?.customBranding?.businessName || "Payment";
  const supportEmail = config?.customBranding?.supportEmail ?? "";

  // ── Main payment UI ───────────────────────────────────────────────────────
  return (
    <div className={`w-full rounded-lg border bg-white shadow-sm`}>
      {/* Header */}
      <div className="p-6 pb-0">
        <h3 className="text-xl font-semibold flex items-center">
          {branding?.logo && <img src={branding.logo} alt="Logo" className="h-8 w-8 mr-2 rounded" />}
          {businessName}
        </h3>
        {feeCalculation ? (
          <div className="mt-1 space-y-0.5">
            <p className="text-sm text-gray-500">Amount to School: {formatAmount(feeCalculation.netAmount)}</p>
            <p className="text-xs text-gray-400">Platform Fee: {formatAmount(feeCalculation.platformFee)}</p>
            <p className="text-base font-semibold">Total to Pay: {formatAmount(feeCalculation.totalAmount)}</p>
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-500">
            Complete your payment of {formatAmount(amount)}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {error && (
          <div className="flex items-center text-red-600 text-sm">
            <XCircle className="h-4 w-4 mr-1.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Method selection */}
        {!paymentMethod && (
          <div className="space-y-3">
            {feeCalculation && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold mb-3 text-center text-sm">Payment Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount to School:</span>
                    <span className="font-semibold">{formatAmount(feeCalculation.netAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Fee:</span>
                    <span>{formatAmount(feeCalculation.platformFee)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Total to Pay:</span>
                    <span className="font-bold text-lg">{formatAmount(feeCalculation.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setPaymentMethod("online")}
              disabled={!feeCalculation && !config}
              className="w-full h-12 flex items-center justify-center rounded-md text-base font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: branding?.primaryColor ?? "#111827" }}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Pay Online{feeCalculation ? ` (${formatAmount(feeCalculation.totalAmount)})` : ""}
            </button>

            {showBankTransfer && (
              <button
                onClick={() => setPaymentMethod("bank")}
                className="w-full h-12 flex items-center justify-center rounded-md border border-gray-300 text-base font-medium hover:bg-gray-50 transition-colors"
              >
                <Banknote className="h-5 w-5 mr-2" />
                Bank Transfer
              </button>
            )}

            <div className="text-center">
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Online payment confirmation */}
        {paymentMethod === "online" && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Payment Details</h4>
              <div className="space-y-1 text-sm">
                {feeCalculation ? (
                  <>
                    <div className="flex justify-between">
                      <span>Amount to School:</span>
                      <span className="font-semibold">{formatAmount(feeCalculation.netAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Platform Fee:</span>
                      <span>{formatAmount(feeCalculation.platformFee)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-semibold">Total to Pay:</span>
                      <span className="font-bold text-lg">{formatAmount(feeCalculation.totalAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">{formatAmount(amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span>{email}</span>
                </div>
                {metadata.examLocation && (
                  <div className="flex justify-between">
                    <span>Exam Location:</span>
                    <span>{metadata.examLocation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleOnlinePayment}
                disabled={isLoading || !feeCalculation}
                className="w-full h-12 flex items-center justify-center rounded-md text-base font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: branding?.primaryColor ?? "#111827" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay {feeCalculation ? formatAmount(feeCalculation.totalAmount) : formatAmount(amount)}
                  </>
                )}
              </button>
              <button
                onClick={() => setPaymentMethod(null)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Bank transfer */}
        {paymentMethod === "bank" && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-sm">Bank Transfer Details</h4>
              {bankDetails?.bankName ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Bank Name:</span>
                    <span className="font-semibold">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Account Number:</span>
                    <span className="font-mono font-semibold text-lg">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Account Name:</span>
                    <span className="font-semibold">{bankDetails.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-500">Amount to Transfer:</span>
                    <span className="font-bold text-lg">
                      {feeCalculation ? formatAmount(feeCalculation.totalAmount) : formatAmount(amount)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Bank details not configured. Please contact {supportEmail} for bank transfer instructions.
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Include your email address ({email}) in the transfer description</li>
                    <li>
                      Transfer the exact amount:{" "}
                      {feeCalculation ? formatAmount(feeCalculation.totalAmount) : formatAmount(amount)}
                    </li>
                    {supportEmail && (
                      <li>After transferring, contact {supportEmail} with proof of payment</li>
                    )}
                    <li>Payment confirmation will be processed manually by the school</li>
                  </ul>
                </div>
              </div>
            </div>

            {bankDetails?.bankName && (
              <button
                onClick={() => {
                  const details = `Bank: ${bankDetails.bankName}\nAccount Number: ${bankDetails.accountNumber}\nAccount Name: ${bankDetails.accountName}\nAmount: ${feeCalculation ? formatAmount(feeCalculation.totalAmount) : formatAmount(amount)}`;
                  navigator.clipboard.writeText(details).catch(() => {});
                }}
                className="w-full px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Copy Details
              </button>
            )}

            <button
              onClick={() => setPaymentMethod(null)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {supportEmail && (
          <p className="text-center text-xs text-gray-400">Need help? Contact {supportEmail}</p>
        )}
      </div>
    </div>
  );
}
