// src/utils/currency.js

/**
 * Standardized Indian Rupee (INR) currency formatter.
 * Clean universal UTF-8 representation without mojibake.
 *
 * Examples:
 *   32 -> ₹32
 *   49.5 -> ₹49.50
 *   1150 -> ₹1,150
 *   11800 -> ₹11,800
 */
export const formatINR = (value) => {
  const amount = Number(value ?? 0);
  if (isNaN(amount)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatRupeesNumber = (value) => {
  const amount = Number(value ?? 0);
  if (isNaN(amount)) return "0";
  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
};
