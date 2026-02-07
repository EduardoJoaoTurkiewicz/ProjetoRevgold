/**
 * Date-only utilities for handling dates without timezone issues
 *
 * CRITICAL: This module prevents the -1 day bug by avoiding UTC conversion
 *
 * The problem: new Date("2025-09-20") creates a Date at midnight UTC,
 * which when displayed in local timezone (e.g., GMT-3) shows as 2025-09-19
 *
 * The solution: Parse date strings as local dates using Date constructor
 * with year, month, day parameters
 */

/**
 * Converts a Date object or date string to ISO format date-only string (YYYY-MM-DD)
 * Uses local timezone to avoid shifting
 *
 * @param input - Date object or string
 * @returns ISO date string (YYYY-MM-DD)
 */
export function toISODateOnly(input: Date | string): string {
  let date: Date;

  if (typeof input === 'string') {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    date = fromISODateOnly(input);
  } else {
    date = input;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Converts an ISO date string (YYYY-MM-DD) to a Date object in local timezone
 * CRITICAL: Does NOT use UTC conversion to avoid date shifting
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Date object at midnight local time
 */
export function fromISODateOnly(dateStr: string): Date {
  if (!dateStr) {
    return new Date();
  }

  // Handle full ISO datetime strings by extracting date part
  const dateOnly = dateStr.split('T')[0];

  const [year, month, day] = dateOnly.split('-').map(Number);

  if (!year || !month || !day) {
    console.warn('Invalid date string:', dateStr);
    return new Date();
  }

  // Create date in LOCAL timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';

  const date = fromISODateOnly(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Gets current date as ISO date string (YYYY-MM-DD)
 *
 * @returns Current date in YYYY-MM-DD format
 */
export function getCurrentDateISO(): string {
  return toISODateOnly(new Date());
}

/**
 * Formats a date for display in forms (maintains YYYY-MM-DD for input[type="date"])
 *
 * @param date - Date object or string
 * @returns ISO date string for form inputs
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return getCurrentDateISO();
  return toISODateOnly(date);
}

/**
 * Parses a date from a form input, ensuring no timezone shift
 *
 * @param dateStr - Date string from input[type="date"]
 * @returns ISO date string (YYYY-MM-DD)
 */
export function parseDateFromInput(dateStr: string): string {
  if (!dateStr) return getCurrentDateISO();
  // Input type="date" always returns YYYY-MM-DD, just validate and return
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  return toISODateOnly(dateStr);
}

/**
 * Legacy compatibility: alias for formatDateBR
 * @deprecated Use formatDateBR instead
 */
export function dbDateToDisplay(dateStr: string): string {
  return formatDateBR(dateStr);
}

/**
 * Adds days to a date without timezone issues
 *
 * @param dateStr - ISO date string
 * @param days - Number of days to add (can be negative)
 * @returns New ISO date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = fromISODateOnly(dateStr);
  date.setDate(date.getDate() + days);
  return toISODateOnly(date);
}

/**
 * Calculates difference in days between two dates
 *
 * @param dateStr1 - First ISO date string
 * @param dateStr2 - Second ISO date string
 * @returns Number of days between dates
 */
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const date1 = fromISODateOnly(dateStr1);
  const date2 = fromISODateOnly(dateStr2);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a date string is valid
 *
 * @param dateStr - Date string to validate
 * @returns true if valid
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = fromISODateOnly(dateStr);
  return !isNaN(date.getTime());
}
