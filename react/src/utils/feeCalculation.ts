/**
 * Calculate the total amount a user needs to pay so that the school receives
 * a specific net amount (reverse / upward calculation).
 *
 * Formula: totalAmount = (netAmount + platformFeeFixed) / (1 - platformFeePercent / 100)
 */
export function calculateTotalAmountFromNetAmount(
  netAmount: number,
  platformFeePercent: number,
  platformFeeFixed: number,
): {
  netAmount: number;
  platformFee: number;
  totalAmount: number;
  breakdown: {
    schoolReceives: number;
    platformFee: number;
    totalToPay: number;
  };
} {
  if (netAmount <= 0) throw new Error("Net amount must be greater than 0");
  if (platformFeePercent < 0 || platformFeePercent >= 100)
    throw new Error("Platform fee percentage must be between 0 and 100");
  if (platformFeeFixed < 0)
    throw new Error("Platform fee fixed amount must be non-negative");

  const denominator = 1 - platformFeePercent / 100;
  if (denominator <= 0) throw new Error("Platform fee percentage must be less than 100%");

  let totalAmount = Math.ceil((netAmount + platformFeeFixed) / denominator);
  let platformFee = Math.round((totalAmount * platformFeePercent) / 100) + platformFeeFixed;
  let calculatedNetAmount = totalAmount - platformFee;

  if (calculatedNetAmount < netAmount) {
    let iterations = 0;
    while (calculatedNetAmount < netAmount && iterations < 10) {
      totalAmount += 1;
      platformFee = Math.round((totalAmount * platformFeePercent) / 100) + platformFeeFixed;
      calculatedNetAmount = totalAmount - platformFee;
      iterations++;
    }
  }

  return {
    netAmount: calculatedNetAmount,
    platformFee,
    totalAmount,
    breakdown: {
      schoolReceives: calculatedNetAmount,
      platformFee,
      totalToPay: totalAmount,
    },
  };
}
