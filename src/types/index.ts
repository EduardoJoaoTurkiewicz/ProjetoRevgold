// User types
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

// Product interface
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Payment method interface
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

// Third party check details
export interface ThirdPartyCheckDetails {
  id?: string;
  checkId?: string;
  bank: string;
  agency: string;
  account: string;
  checkNumber: string;
  issuer: string;
  cpfCnpj: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Sale interface
export interface Sale {
  id: string;
  date: string;
  deliveryDate?: string;
  client: string;
  sellerId?: string | null;
  products: string | Product[];
  observations?: string;
  totalValue: number;
  paymentMethods: PaymentMethod[];
  receivedAmount: number;
  pendingAmount: number;
  status: 'pago' | 'pendente' | 'parcial';
  paymentDescription?: string;
  paymentObservations?: string;
  createdAt: string;
  updatedAt?: string;
  customCommissionRate: number;
}

// Debt interface
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
  updatedAt?: string;
}

// Check interface
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
  usedInDebt?: string;
  discountDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// Boleto interface
export interface Boleto {
  id: string;
  saleId?: string;
  client: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'compensado' | 'vencido' | 'cancelado' | 'nao_pago';
  installmentNumber: number;
  totalInstallments: number;
  boletoFile?: string;
  observations?: string;
  createdAt: string;
  updatedAt?: string;
  overdueAction?: 'pago_com_juros' | 'pago_com_multa' | 'pago_integral' | 'protestado' | 'negativado' | 'acordo_realizado' | 'cancelado' | 'perda_total';
  interestAmount?: number;
  penaltyAmount?: number;
  notaryCosts?: number;
  finalAmount?: number;
  overdueNotes?: string;
}

// Employee interface
export interface Employee {
  id: string;
  name: string;
  position: string;
  isSeller: boolean;
  salary: number;
  paymentDay: number;
  nextPaymentDate?: string;
  isActive: boolean;
  hireDate: string;
  observations?: string;
  createdAt: string;
  updatedAt?: string;
}

// Employee Payment interface
export interface EmployeePayment {
  id?: string;
  employeeId: string;
  amount: number;
  paymentDate: string;
  isPaid: boolean;
  receipt?: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Employee Advance interface
export interface EmployeeAdvance {
  id?: string;
  employeeId: string;
  amount: number;
  date: string;
  description?: string;
  paymentMethod: 'dinheiro' | 'pix' | 'transferencia' | 'desconto_folha';
  status: 'pendente' | 'descontado';
  createdAt?: string;
  updatedAt?: string;
}

// Employee Overtime interface
export interface EmployeeOvertime {
  id?: string;
  employeeId: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  date: string;
  description: string;
  status: 'pendente' | 'pago';
  createdAt?: string;
  updatedAt?: string;
}

// Employee Commission interface
export interface EmployeeCommission {
  id?: string;
  employeeId: string;
  saleId: string;
  saleValue: number;
  commissionRate: number;
  commissionAmount: number;
  date: string;
  status: 'pendente' | 'pago';
  createdAt?: string;
  updatedAt?: string;
}

// Cash Balance interface
export interface CashBalance {
  id?: string;
  currentBalance: number;
  initialBalance: number;
  initialDate: string;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

// Cash Transaction interface
export interface CashTransaction {
  id?: string;
  date: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  category: 'venda' | 'divida' | 'adiantamento' | 'salario' | 'comissao' | 'cheque' | 'boleto' | 'outro';
  relatedId?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

// PIX Fee interface
export interface PixFee {
  id?: string;
  date: string;
  amount: number;
  description: string;
  bank: string;
  transactionType: 'pix_out' | 'pix_in' | 'ted' | 'doc' | 'other';
  relatedTransactionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Installment interface
export interface Installment {
  id?: string;
  saleId?: string;
  debtId?: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  type: 'venda' | 'divida';
  description: string;
  createdAt?: string;
  updatedAt?: string;
}