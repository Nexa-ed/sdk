export type PaymentSource = "enrollment" | "tuition" | "fees" | "donation" | "event" | "custom";
export type PaymentCategory = "academic" | "financial" | "event" | "donation" | "other";

const VALID_CATEGORIES: readonly PaymentCategory[] = [
  "academic",
  "financial",
  "event",
  "donation",
  "other",
] as const;

export function getValidPaymentCategory(metadata: {
  source: PaymentSource;
  category?: string | PaymentCategory;
}): PaymentCategory {
  const provided = metadata.category;
  if (
    provided &&
    typeof provided === "string" &&
    VALID_CATEGORIES.includes(provided as PaymentCategory)
  ) {
    return provided as PaymentCategory;
  }

  switch (metadata.source) {
    case "enrollment":
      return "academic";
    case "tuition":
    case "fees":
      return "financial";
    case "donation":
      return "donation";
    case "event":
      return "event";
    default:
      return "academic";
  }
}

export function normalizePaymentMetadata<
  T extends { source: PaymentSource; userEmail: string; category?: string | PaymentCategory; [key: string]: any },
>(metadata: T): T & { category: PaymentCategory } {
  return {
    ...metadata,
    category: getValidPaymentCategory(metadata),
  };
}
