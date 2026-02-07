/**
 * Date utilities - Now using timezone-safe dateOnly module
 * @deprecated Most functions moved to lib/dateOnly.ts
 */

import {
  toISODateOnly,
  formatDateBR,
  getCurrentDateISO,
  formatDateForInput as formatDateForInputNew,
  parseDateFromInput as parseDateFromInputNew,
  addDays as addDaysNew,
  fromISODateOnly
} from '../lib/dateOnly';

// Re-export new implementations with legacy names for compatibility
export function formatDateForInput(date: string | Date | null | undefined): string {
  return formatDateForInputNew(date);
}

export function formatDateForDisplay(date: string | Date): string {
  if (!date) return '';
  if (typeof date === 'string') {
    return formatDateBR(date);
  }
  return formatDateBR(toISODateOnly(date));
}

export function parseInputDate(dateString: string): string {
  return parseDateFromInputNew(dateString);
}

export function createDateFromInput(dateString: string): Date {
  return fromISODateOnly(dateString);
}

export function getCurrentDateString(): string {
  return getCurrentDateISO();
}

export function addDays(dateString: string, days: number): string {
  return addDaysNew(dateString, days);
}

export function normalizeDate(date: string | Date): string {
  return toISODateOnly(date || new Date());
}

export function dbDateToDisplay(dbDate: string): string {
  return formatDateBR(dbDate);
}

export function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  return formatDateBR(toISODateOnly(date));
}

export function formatDateISO(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  return toISODateOnly(date);
}

export function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getMonthStart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function getMonthEnd(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}