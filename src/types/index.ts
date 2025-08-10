export interface User {
  id: string;
  username: string;
  role: 'user';
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
  deliveryDate?: string;
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
  isSeller: boolean; // Indica se é vendedor
  salary: number;
  paymentDay: number; // Day of month (1-31)
  nextPaymentDate?: string; // Optional specific date for next payment
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

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: 'dinheiro' | 'pix' | 'transferencia' | 'desconto_folha';
  status: 'pendente' | 'descontado';
  createdAt: string;
}

export interface EmployeeOvertime {
  id: string;
  employeeId: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  date: string;
  description: string;
  status: 'pendente' | 'pago';
  createdAt: string;
}

export interface EmployeeCommission {
  id: string;
  employeeId: string;
  saleId: string;
  saleValue: number;
  commissionRate: number; // Porcentagem (ex: 5 para 5%)
  commissionAmount: number;
  date: string;
  status: 'pendente' | 'pago';
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