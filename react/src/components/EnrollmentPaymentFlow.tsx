"use client";

import React, { useState } from "react";
import { CheckCircle, CreditCard, Banknote, Receipt } from "lucide-react";
import { NexaPaymentWidget } from "./NexaPaymentWidget";
import type { EnrollmentPaymentFlowProps, PaymentTransaction } from "../payment-types";

export { EnrollmentPaymentFlowProps };

export function EnrollmentPaymentFlow({
  studentData,
  examLocation,
  examFee,
  onComplete,
  branding,
}: EnrollmentPaymentFlowProps) {
  const [currentStep, setCurrentStep] = useState<"breakdown" | "payment" | "confirmation">("breakdown");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "bank" | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const formatAmount = (kobo: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

  const handlePaymentSuccess = (transaction: PaymentTransaction) => {
    setPaymentReference(transaction.reference);
    setCurrentStep("confirmation");
    onComplete({ paid: true, reference: transaction.reference, transaction });
  };

  // ── Fee breakdown step ────────────────────────────────────────────────────
  if (currentStep === "breakdown") {
    return (
      <div className="max-w-2xl mx-auto rounded-lg border bg-white shadow-sm">
        <div className="p-6 pb-2">
          <h3 className="text-xl font-semibold flex items-center">
            <Receipt className="h-6 w-6 mr-2" />
            Enrollment Fee Breakdown
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Review your enrollment details and payment amount
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Student info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-sm">Student Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name:</p>
                <p className="font-medium">{studentData.firstName} {studentData.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Email:</p>
                <p className="font-medium">{studentData.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Grade:</p>
                <p className="font-medium">{studentData.grade}</p>
              </div>
              <div>
                <p className="text-gray-500">Exam Location:</p>
                <p className="font-medium">{examLocation}</p>
              </div>
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-sm">Fee Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Examination Fee ({examLocation}):</span>
                <span className="font-medium">{formatAmount(examFee)}</span>
              </div>
              <hr className="border-t border-gray-200 my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>{formatAmount(examFee)}</span>
              </div>
            </div>
          </div>

          {/* Payment method selection */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Choose Payment Method</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => { setPaymentMethod("online"); setCurrentStep("payment"); }}
                className="h-16 flex flex-col items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="h-6 w-6 mb-1" />
                <span className="text-sm font-medium">Online Payment</span>
                <span className="text-xs text-gray-500">Card, Bank Transfer</span>
              </button>
              <button
                onClick={() => { setPaymentMethod("bank"); setCurrentStep("payment"); }}
                className="h-16 flex flex-col items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Banknote className="h-6 w-6 mb-1" />
                <span className="text-sm font-medium">Bank Transfer</span>
                <span className="text-xs text-gray-500">Manual Confirmation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment step ──────────────────────────────────────────────────────────
  if (currentStep === "payment") {
    return (
      <div className="max-w-2xl mx-auto">
        <NexaPaymentWidget
          amount={examFee}
          email={studentData.email}
          metadata={{
            source: "enrollment",
            userEmail: studentData.email,
            examLocation,
            studentName: `${studentData.firstName} ${studentData.lastName}`,
            grade: studentData.grade,
          }}
          onSuccess={handlePaymentSuccess}
          onError={(err) => console.error("Payment error:", err)}
          onClose={() => setCurrentStep("breakdown")}
          showBankTransfer={paymentMethod === "bank"}
          branding={branding}
        />
      </div>
    );
  }

  // ── Confirmation step ─────────────────────────────────────────────────────
  if (currentStep === "confirmation") {
    return (
      <div className="max-w-2xl mx-auto rounded-lg border bg-white shadow-sm">
        <div className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Enrollment Payment Complete!
              </h2>
              <p className="text-gray-500">Your enrollment has been successfully processed.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg space-y-4 text-left">
              <h3 className="font-semibold text-center">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Student:</span>
                  <span className="font-medium">{studentData.firstName} {studentData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{studentData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grade:</span>
                  <span className="font-medium">{studentData.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exam Location:</span>
                  <span className="font-medium">{examLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-semibold">{formatAmount(examFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {paymentMethod === "online" ? "Online Payment" : "Bank Transfer"}
                  </span>
                </div>
                {paymentReference && (
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {paymentReference}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-left">
                <h4 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You will receive a confirmation email shortly</li>
                  <li>• Examination details will be sent to your email</li>
                  <li>• Please arrive 30 minutes before your scheduled exam time</li>
                  {paymentMethod === "bank" && (
                    <li>• Bank transfer payments will be confirmed on examination day</li>
                  )}
                </ul>
              </div>

              <button
                onClick={() => onComplete({ paid: true, reference: paymentReference ?? undefined })}
                className="w-full py-3 rounded-md bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
