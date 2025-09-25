// Date utilities to fix date handling issues
export function formatDateForInput(date: string | Date): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (isNaN(d.getTime())) return '';
  
  // Format as YYYY-MM-DD for input fields
  return d.toISOString().split('T')[0];
}

export function formatDateForDisplay(date: string | Date): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('pt-BR');
}

export function parseInputDate(dateString: string): string {
  if (!dateString) return '';
  
  // Ensure we're working with the exact date string without timezone conversion
  return dateString;
}

export function createDateFromInput(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Create date without timezone conversion
  return new Date(dateString + 'T00:00:00');
}

export function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}