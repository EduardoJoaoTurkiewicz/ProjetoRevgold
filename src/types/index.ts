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
  isOwnCheck?: boolean;
  isThirdPartyCheck?: boolean;
  thirdPartyDetails?: ThirdPartyCheckDetails[];
}

export interface Sale {
  id: string;
  date: string;
  deliveryDate?: string;
  client: string;
  sellerId?: string; // ID do funcionário vendedor
  customCommissionRate?: number; // Porcentagem personalizada de comissão para esta venda
  products: string; // Simplified to string description
  observations?: string;
  totalValue: number;
  paymentMethods: PaymentMethod[];
  receivedAmount: number;
  pendingAmount: number;
  status: 'pago' | 'pendente' | 'parcial';
  paymentDescription?: string;
  paymentObservations?: string;
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
  commissionRate: number; // Porcentagem personalizada para esta venda
  commissionAmount: number;
  date: string;
  status: 'pendente' | 'pago';
  createdAt: string;
}
export interface Boleto {
  id: string;
  saleId?: string;
  client: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'compensado' | 'vencido' | 'cancelado' | 'nao_pago';
  installmentNumber: number;
  totalInstallments: number;
  boletoFile?: string; // Base64 or file path
  observations?: string;
  overdueAction?: 'pago_com_juros' | 'pago_com_multa' | 'pago_integral' | 'protestado' | 'negativado' | 'acordo_realizado' | 'cancelado' | 'perda_total';
  interestAmount?: number;
  penaltyAmount?: number;
  notaryCosts?: number;
  finalAmount?: number;
  overdueNotes?: string;
  createdAt: string;
}

export interface CashFlow {
  id: string;
  date: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  category: 'venda' | 'divida' | 'adiantamento' | 'salario' | 'comissao' | 'outro';
  relatedId?: string; // ID da venda, dívida, etc.
  createdAt: string;
}

export interface CashBalance {
  id: string;
  currentBalance: number;
  lastUpdated: string;
  initialBalance: number;
  initialDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThirdPartyCheck {
  id: string;
  checkId: string;
  bank: string;
  agency: string;
  account: string;
  checkNumber: string;
  issuer: string; // Quem emitiu o cheque
  cpfCnpj: string;
  observations?: string;
}

export interface ThirdPartyCheckDetails {
  bank: string;
  agency: string;
  account: string;
  checkNumber: string;
  issuer: string;
  cpfCnpj: string;
  observations?: string;
}

export interface CashTransaction {
  id: string;
  date: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  category: 'venda' | 'divida' | 'adiantamento' | 'salario' | 'comissao' | 'cheque' | 'boleto' | 'outro';
  relatedId?: string;
  paymentMethod?: string;
  createdAt: string;
}