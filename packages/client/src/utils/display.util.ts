/**
 * Utility functions for displaying values in the admin dashboard
 * Handles formatting differences and null/undefined values
 */

export function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed === "" ||
      trimmed.toLowerCase() === "n/a" ||
      trimmed.toLowerCase() === "na"
    ) {
      return "N/A";
    }
    return trimmed;
  }

  if (typeof value === "number") {
    // Format numbers consistently
    if (Number.isInteger(value)) {
      return value.toString();
    }
    // Remove trailing zeros for decimal numbers
    return parseFloat(value.toString()).toString();
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "N/A";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function valuesAreEffectivelyEqual(
  original: any,
  updated: any
): boolean {
  const normalizedOriginal = formatDisplayValue(original);
  const normalizedUpdated = formatDisplayValue(updated);

  return normalizedOriginal === normalizedUpdated;
}

export function shouldShowChange(original: any, updated: any): boolean {
  return !valuesAreEffectivelyEqual(original, updated);
}

