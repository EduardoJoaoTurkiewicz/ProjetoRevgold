export interface User {
  id: string;
  username: string;
  role: 'admin' | 'financeiro' | 'visualizador';
}

export interface PaymentMethod {
  type: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'cheque' | 'boleto' | 'transferencia';
  amount: number;
  installments?: number;
  installmentValue?: number;
  installmentInterval?: number;
  startDate?: string;
  firstInstallmentDate?: string;
}

export interface Sale {
  id: string;
  date: string;
  client: string;
  sellerId?: string; // ID do funcionário vendedor
  products: Product[];
  observations?: string;
  totalValue: number;
  paymentMethods: PaymentMethod[];
  receivedAmount: number;
  pendingAmount: number;
  status: 'pago' | 'pendente' | 'parcial';
  paymentDescription?: string;
  createdAt: string;
}

export interface Product {
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Debt {
  id: string;
  date: string;
  description: string;
  company: string;
  totalValue: number;
  paymentMethods: PaymentMethod[];
  isPaid: boolean;
  paidAmount: number;
  pendingAmount: number;
  checksUsed?: string[];
  paymentDescription?: string;
  debtPaymentDescription?: string;
  createdAt: string;
}

export interface Check {
  id: string;
  saleId?: string;
  debtId?: string;
  client: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'compensado' | 'devolvido' | 'reapresentado';
  isOwnCheck: boolean;
  observations?: string;
  usedFor?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  frontImage?: string;
  backImage?: string;
  selectedAvailableChecks?: string[];
  usedInDebt?: string; // ID da dívida onde foi usado
  discountDate?: string; // Data de desconto para cheques próprios
  createdAt: string;
}

export interface Installment {
  id: string;
  saleId?: string;
  debtId?: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  type: 'venda' | 'divida';
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  paymentDay: number; // Day of month (1-31)
  paymentDate?: string; // Optional specific date for next payment
  isActive: boolean;
  hireDate: string;
  observations?: string;
  createdAt: string;
}

export interface EmployeePayment {
  id: string;
  employeeId: string;
  amount: number;
  paymentDate: string;
  isPaid: boolean;
  receipt?: string; // Base64 or file path
  observations?: string;
  createdAt: string;
}

export interface Boleto {
  id: string;
  saleId: string;
  client: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'compensado' | 'vencido' | 'cancelado' | 'nao_pago';
  installmentNumber: number;
  totalInstallments: number;
  boletoFile?: string; // Base64 or file path
  observations?: string;
  createdAt: string;
}