// Date utilities with proper timezone handling to prevent date shifting
export function formatDateForInput(date: string | Date): string {
  if (!date) return '';
  
  let d: Date;
  if (typeof date === 'string') {
    // Parse date string without timezone conversion
    if (date.includes('T')) {
      // For ISO strings, extract just the date part
      const datePart = date.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        d = new Date(date);
      }
    } else {
      // For date-only strings, create date in local timezone
      const parts = date.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        d = new Date(date + 'T00:00:00'); // Use midnight local time
      }
    }
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
    // Parse date string without timezone conversion
    if (date.includes('T')) {
      // For ISO strings, extract just the date part
      const datePart = date.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        d = new Date(date);
      }
    } else {
      // For date-only strings, create date in local timezone
      const parts = date.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        d = new Date(date + 'T00:00:00'); // Use midnight local time
      }
    }
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('pt-BR');
}

export function parseInputDate(dateString: string): string {
  if (!dateString) return '';
  
  // Return the exact date string without any conversion
  // This prevents timezone shifts when saving to database
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
  // Parse date in local timezone to prevent shifting
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // Fallback method
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
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