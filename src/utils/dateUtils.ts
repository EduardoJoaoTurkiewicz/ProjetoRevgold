// Date utilities with proper timezone handling to prevent date shifting
export function formatDateForInput(date: string | Date): string {
  if (!date) return '';
  
  let d: Date;
  if (typeof date === 'string') {
    // Always extract just the date part to prevent timezone shifts
    const datePart = date.includes('T') ? date.split('T')[0] : date;
    // Return the date string directly if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
    // Parse manually to avoid timezone issues
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = String(parseInt(parts[1])).padStart(2, '0');
      const day = String(parseInt(parts[2])).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    d = new Date(date);
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return '';
  
  // Format as YYYY-MM-DD for input fields using local date components
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(date: string | Date): string {
  if (!date) return '';
  
  let d: Date;
  if (typeof date === 'string') {
    // Always extract just the date part to prevent timezone shifts
    const datePart = date.includes('T') ? date.split('T')[0] : date;
    // Parse manually to avoid timezone issues
    const parts = datePart.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      d = new Date(date + 'T12:00:00'); // Use noon to avoid timezone edge cases
    }
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('pt-BR');
}

export function parseInputDate(dateString: string): string {
  if (!dateString) return '';
  
  // Ensure we always return YYYY-MM-DD format without timezone conversion
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If it's not in the correct format, try to parse and reformat
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = String(parseInt(parts[1])).padStart(2, '0');
    const day = String(parseInt(parts[2])).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return dateString;
}

export function createDateFromInput(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Create date in local timezone to prevent shifting
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  
  // Fallback with midnight time to avoid timezone issues
  return new Date(dateString + 'T00:00:00');
}

export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function addDays(dateString: string, days: number): string {
  // Always work with the date string directly to prevent timezone shifts
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Fallback method - parse in local time and format manually
  const date = new Date(dateString + 'T12:00:00');
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Helper function to ensure date consistency across the application
export function normalizeDate(date: string | Date): string {
  if (!date) return getCurrentDateString();
  
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Parse and normalize other formats
    const d = new Date(date + 'T00:00:00');
    if (isNaN(d.getTime())) return getCurrentDateString();
    
    return formatDateForInput(d);
  }
  
  return formatDateForInput(date);
}

// Helper to convert database date to display format safely
export function dbDateToDisplay(dbDate: string): string {
  if (!dbDate) return '';
  
  // Database dates are stored as YYYY-MM-DD
  // Parse in local timezone to prevent shifting
  const parts = dbDate.split('T')[0].split('-'); // Remove time part if present
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('pt-BR');
  }
  
  return dbDate;
}