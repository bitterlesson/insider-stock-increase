/**
 * Parse comma-separated number string to number
 * Examples: "1,234,567" -> 1234567, "-1,234" -> -1234, "-" -> 0
 */
export function parseCommaNumber(value: string | null | undefined): number {
  if (!value || value === '-' || value.trim() === '') {
    return 0;
  }
  const cleaned = value.replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse percentage string to decimal
 * Examples: "12.34" -> 12.34, "-" -> 0
 */
export function parseRate(value: string | null | undefined): number {
  if (!value || value === '-' || value.trim() === '') {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format date string from YYYYMMDD to YYYY-MM-DD
 */
export function formatDate(dateStr: string): string {
  if (dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}
