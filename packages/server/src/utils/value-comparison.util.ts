/**
 * Utility functions for comparing values in pending changes
 * Handles formatting differences, type coercion, and null/undefined values
 */

export function normalizeValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      trimmed === '' ||
      trimmed.toLowerCase() === 'n/a' ||
      trimmed.toLowerCase() === 'na'
    ) {
      return null;
    }
    return trimmed;
  }

  if (typeof value === 'number') {
    // Normalize numbers to remove unnecessary decimal places
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (typeof value === 'object') {
    const normalized: any = {};
    for (const [key, val] of Object.entries(value)) {
      normalized[key] = normalizeValue(val);
    }
    return normalized;
  }

  return value;
}

export function valuesAreEqual(original: any, updated: any): boolean {
  const normalizedOriginal = normalizeValue(original);
  const normalizedUpdated = normalizeValue(updated);

  // Handle null/undefined cases
  if (normalizedOriginal === null && normalizedUpdated === null) {
    return true;
  }

  if (normalizedOriginal === null || normalizedUpdated === null) {
    return false;
  }

  // Handle numbers (including string-to-number conversion)
  if (
    typeof normalizedOriginal === 'number' &&
    typeof normalizedUpdated === 'number'
  ) {
    return normalizedOriginal === normalizedUpdated;
  }

  // Handle string-to-number comparison
  if (
    typeof normalizedOriginal === 'string' &&
    typeof normalizedUpdated === 'number'
  ) {
    const parsedOriginal = parseFloat(normalizedOriginal);
    return !isNaN(parsedOriginal) && parsedOriginal === normalizedUpdated;
  }

  if (
    typeof normalizedOriginal === 'number' &&
    typeof normalizedUpdated === 'string'
  ) {
    const parsedUpdated = parseFloat(normalizedUpdated);
    return !isNaN(parsedUpdated) && normalizedOriginal === parsedUpdated;
  }

  // Handle strings
  if (
    typeof normalizedOriginal === 'string' &&
    typeof normalizedUpdated === 'string'
  ) {
    return normalizedOriginal === normalizedUpdated;
  }

  // Handle arrays
  if (Array.isArray(normalizedOriginal) && Array.isArray(normalizedUpdated)) {
    if (normalizedOriginal.length !== normalizedUpdated.length) {
      return false;
    }
    return normalizedOriginal.every((item, index) =>
      valuesAreEqual(item, normalizedUpdated[index]),
    );
  }

  // Handle objects
  if (
    typeof normalizedOriginal === 'object' &&
    typeof normalizedUpdated === 'object'
  ) {
    const originalKeys = Object.keys(normalizedOriginal);
    const updatedKeys = Object.keys(normalizedUpdated);

    if (originalKeys.length !== updatedKeys.length) {
      return false;
    }

    return originalKeys.every((key) =>
      valuesAreEqual(normalizedOriginal[key], normalizedUpdated[key]),
    );
  }

  // Fallback to strict equality
  return normalizedOriginal === normalizedUpdated;
}

export function hasActualChanges(original: any, updated: any): boolean {
  return !valuesAreEqual(original, updated);
}
