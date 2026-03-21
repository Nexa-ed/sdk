"use client";

// ─── Core payment types ───────────────────────────────────────────────────────

export interface PaymentMetadata {
  source: "enrollment" | "tuition" | "fees" | "donation" | "event" | "custom";
  userEmail: string;
  category?: "academic" | "financial" | "event" | "donation" | "other";
  examLocation?: string;
  [key: string]: any;
}

export interface PaymentTransaction {
  tenantId?: string;
  reference: string;
  paystackReference?: string;
  transactionId?: string;
  amount: number;
  currency?: string;
  amountPaid?: number;
  fees?: number;
  platformFee?: number;
  netAmount?: number;
  customerEmail?: string;
  customerName?: string;
  status: "pending" | "success" | "failed" | "abandoned";
  gatewayResponse?: string;
  failureReason?: string;
  metadata?: PaymentMetadata | Record<string, unknown> | null;
  settled?: boolean;
  settlementDate?: string;
  channel?: string;
  paidAt?: string;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
}

export interface PaymentConfig {
  tenantId?: string;
  mode: "test" | "live";
  subaccountCode?: string;
  platformFeePercent?: number;
  platformFeeFixed?: number;
  customBranding: {
    businessName: string;
    supportEmail: string;
    logo?: string;
  };
  isActive: boolean;
  publicKey?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface PaymentError {
  code: string;
  message: string;
  details?: any;
}

export interface TransactionFilters {
  status?: "pending" | "success" | "failed" | "abandoned";
  dateRange?: {
    from?: string;
    to?: string;
  };
  source?: ("enrollment" | "tuition" | "fees" | "custom")[];
  customerEmail?: string;
  limit?: number;
  offset?: number;
}

export interface PaymentStats {
  total?: number;
  totalTransactions?: number;
  pending?: number;
  pendingTransactions?: number;
  successful?: number;
  successfulTransactions?: number;
  failed?: number;
  failedTransactions?: number;
  abandoned?: number;
  totalAmount: number;
  totalPaid?: number;
  successRate?: number;
}

// ─── Component prop types ─────────────────────────────────────────────────────

export interface NexaPaymentWidgetProps {
  /** tenantId is no longer required — the server derives it from the API key */
  tenantId?: string;
  /** Amount in kobo that the school expects to receive (net) */
  amount: number;
  email: string;
  metadata: PaymentMetadata;
  onSuccess?: (transaction: PaymentTransaction) => void;
  onError?: (error: PaymentError) => void;
  onClose?: () => void;
  callbackUrl?: string;
  branding?: {
    primaryColor?: string;
    logo?: string;
    businessName?: string;
  };
  theme?: "light" | "dark" | "auto";
  size?: "small" | "medium" | "large";
  showBankTransfer?: boolean;
  paymentStatus?: "pending" | "success" | "failed" | null;
  paymentReference?: string | null;
}

export interface EnrollmentPaymentFlowProps {
  tenantId?: string;
  studentData: {
    firstName: string;
    lastName: string;
    email: string;
    grade: string;
  };
  examLocation: string;
  examFee: number;
  onComplete: (result: { paid: boolean; reference?: string; transaction?: PaymentTransaction }) => void;
  branding?: {
    primaryColor?: string;
    logo?: string;
    businessName?: string;
  };
}

export interface PaymentStatusDashboardProps {
  tenantId?: string;
  userEmail?: string;
  filters?: TransactionFilters;
  onFiltersChange?: (filters: TransactionFilters) => void;
  branding?: {
    primaryColor?: string;
    logo?: string;
    businessName?: string;
  };
}

export interface PaymentConfigPanelProps {
  tenantId?: string;
  onConfigUpdate?: (config: PaymentConfig) => void;
  onTestConnection?: (mode: "test" | "live") => Promise<boolean>;
  branding?: {
    primaryColor?: string;
    logo?: string;
    businessName?: string;
  };
}
