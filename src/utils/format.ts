export const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

export const formatCurrency = fmtBRL;

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove currency symbols and convert comma to dot
  const cleaned = value.replace(/[R$\s]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const fmtDate = (d?: string | Date) => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('pt-BR').format(dt);
};

export const fmtDateTime = (d?: string | Date) => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('pt-BR', { 
    dateStyle: 'short', 
    timeStyle: 'medium' 
  }).format(dt);
};

export const nowBR = () =>
  new Intl.DateTimeFormat('pt-BR', { 
    dateStyle: 'short', 
    timeStyle: 'medium' 
  }).format(new Date());

export const formatNumber = (n: number, decimals: number = 2) =>
  new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(n ?? 0);

export const formatPercent = (n: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1 
  }).format(n / 100);

export const transformToSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformToSnakeCase);
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = transformToSnakeCase(value);
  }
  return result;
};