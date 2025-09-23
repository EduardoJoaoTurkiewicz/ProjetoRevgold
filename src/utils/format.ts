// Formatting utilities for the application

export function fmtBRL(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export function fmtDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export function fmtDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR');
}

export function nowBR(): string {
  return new Date().toLocaleString('pt-BR');
}

export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}

export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = fmtDate(startDate);
  const end = fmtDate(endDate);
  return `${start} - ${end}`;
}

export function formatStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pendente': 'Pendente',
    'pago': 'Pago',
    'parcial': 'Parcial',
    'compensado': 'Compensado',
    'devolvido': 'Devolvido',
    'vencido': 'Vencido',
    'cancelado': 'Cancelado',
    'ativo': 'Ativo',
    'inativo': 'Inativo'
  };
  
  return statusMap[status] || status;
}

export function formatPaymentMethod(method: string): string {
  const methodMap: { [key: string]: string } = {
    'dinheiro': 'Dinheiro',
    'pix': 'PIX',
    'cartao_credito': 'Cartão de Crédito',
    'cartao_debito': 'Cartão de Débito',
    'cheque': 'Cheque',
    'boleto': 'Boleto',
    'transferencia': 'Transferência'
  };
  
  return methodMap[method] || method;
}