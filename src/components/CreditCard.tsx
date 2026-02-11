import { useState, useEffect } from 'react';
import { CreditCard as CreditCardIcon, Plus, ChevronDown, ChevronUp, Zap, AlertCircle, TrendingDown, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, getMonthStart, getMonthEnd } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import CreditCardSaleForm from './forms/CreditCardSaleForm';
import CreditCardDebtForm from './forms/CreditCardDebtForm';
import AnticipateSaleForm from './forms/AnticipateSaleForm';
import SalesInstallmentsList from './credit-card/SalesInstallmentsList';
import DebtsInstallmentsList from './credit-card/DebtsInstallmentsList';
import { CreditCardService } from '../lib/creditCardService';

interface CreditCardSale {
  id: string;
  sale_id: string | null;
  client_name: string;
  total_amount: number;
  remaining_amount: number;
  installments: number;
  sale_date: string;
  first_due_date: string;
  status: string;
  anticipated: boolean;
  anticipated_date: string | null;
  anticipated_fee: number | null;
  anticipated_amount: number | null;
  created_at: string;
  updated_at: string;
}

interface CreditCardSaleInstallment {
  id: string;
  credit_card_sale_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  received_date: string | null;
}

interface CreditCardDebt {
  id: string;
  debt_id: string | null;
  supplier_name: string;
  total_amount: number;
  remaining_amount: number;
  installments: number;
  purchase_date: string;
  first_due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreditCardDebtInstallment {
  id: string;
  credit_card_debt_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_date: string | null;
}

export default function CreditCard() {
  const [activeTab, setActiveTab] = useState<'sales' | 'debts' | 'sales-installments' | 'debts-installments'>('sales');
  const [sales, setSales] = useState<CreditCardSale[]>([]);
  const [debts, setDebts] = useState<CreditCardDebt[]>([]);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [expandedDebts, setExpandedDebts] = useState<Set<string>>(new Set());
  const [saleInstallments, setSaleInstallments] = useState<Record<string, CreditCardSaleInstallment[]>>({});
  const [debtInstallments, setDebtInstallments] = useState<Record<string, CreditCardDebtInstallment[]>>({});
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showAnticipateSaleForm, setShowAnticipateSaleForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState<CreditCardSale | null>(null);
  const [dateRange, setDateRange] = useState({
    start: getMonthStart(new Date()),
    end: getMonthEnd(new Date())
  });
  const [monthlyBillsCount, setMonthlyBillsCount] = useState(0);

  useEffect(() => {
    loadSales();
    loadDebts();
    processAutomaticPayments();
  }, []);

  useEffect(() => {
    loadSales();
    loadDebts();
    calculateMonthlyBills();
  }, [dateRange]);

  const processAutomaticPayments = async () => {
    try {
      await CreditCardService.checkAndProcessDueInstallments();
    } catch (error: any) {
      console.error('Erro ao processar pagamentos automáticos:', error);
    }
  };

  const calculateMonthlyBills = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data, error } = await supabase
      .from('credit_card_debt_installments')
      .select('*')
      .gte('due_date', `${currentMonth}-01`)
      .lt('due_date', `${currentMonth}-32`)
      .eq('status', 'pending');

    if (!error && data) {
      setMonthlyBillsCount(data.length);
    }
  };

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_card_sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar vendas no cartão:', error);
      toast.error('Erro ao carregar vendas no cartão: ' + error.message);
    }
  };

  const loadDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_card_debts')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dívidas no cartão:', error);
      toast.error('Erro ao carregar dívidas no cartão: ' + error.message);
    }
  };

  const loadSaleInstallments = async (saleId: string) => {
    try {
      const { data, error } = await supabase
        .from('credit_card_sale_installments')
        .select('*')
        .eq('credit_card_sale_id', saleId)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      setSaleInstallments(prev => ({ ...prev, [saleId]: data || [] }));
    } catch (error: any) {
      toast.error('Erro ao carregar parcelas: ' + error.message);
    }
  };

  const loadDebtInstallments = async (debtId: string) => {
    try {
      const { data, error } = await supabase
        .from('credit_card_debt_installments')
        .select('*')
        .eq('credit_card_debt_id', debtId)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      setDebtInstallments(prev => ({ ...prev, [debtId]: data || [] }));
    } catch (error: any) {
      toast.error('Erro ao carregar parcelas: ' + error.message);
    }
  };

  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
      if (!saleInstallments[saleId]) {
        loadSaleInstallments(saleId);
      }
    }
    setExpandedSales(newExpanded);
  };

  const toggleDebtExpansion = (debtId: string) => {
    const newExpanded = new Set(expandedDebts);
    if (newExpanded.has(debtId)) {
      newExpanded.delete(debtId);
    } else {
      newExpanded.add(debtId);
      if (!debtInstallments[debtId]) {
        loadDebtInstallments(debtId);
      }
    }
    setExpandedDebts(newExpanded);
  };

  const handleAnticipateSale = (sale: CreditCardSale) => {
    setSelectedSale(sale);
    setShowAnticipateSaleForm(true);
  };

  const calculateTotalToReceive = () => {
    return sales
      .filter(sale => sale.status === 'active' &&
        sale.sale_date >= dateRange.start &&
        sale.sale_date <= dateRange.end)
      .reduce((sum, sale) => sum + sale.remaining_amount, 0);
  };

  const calculateTotalToPay = () => {
    return debts
      .filter(debt => debt.status === 'active' &&
        debt.purchase_date >= dateRange.start &&
        debt.purchase_date <= dateRange.end)
      .reduce((sum, debt) => sum + debt.remaining_amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card-primary p-8 hover-lift">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-sky-600 rounded-3xl shadow-2xl hover:scale-110 transition-transform duration-300">
              <CreditCardIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-1">Cartão de Crédito</h1>
              <p className="text-base text-slate-600 font-medium">Gerencie vendas e dívidas no cartão</p>
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-glass p-8 hover-lift-sm">
        <label className="block text-base font-bold text-slate-800 mb-4">Filtrar por Período</label>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-2 font-semibold">Data Inicial</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-5 py-3 border-0 rounded-2xl focus:ring-2 focus:ring-blue-400 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 font-medium"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-2 font-semibold">Data Final</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-5 py-3 border-0 rounded-2xl focus:ring-2 focus:ring-blue-400 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('sales')}
            className={`apple-tab ${activeTab === 'sales' ? 'active' : ''}`}
          >
            Vendas
          </button>
          <button
            onClick={() => setActiveTab('sales-installments')}
            className={`apple-tab ${activeTab === 'sales-installments' ? 'active' : ''}`}
          >
            Parcelas a Receber
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`apple-tab ${activeTab === 'debts' ? 'active' : ''}`}
          >
            Dívidas
          </button>
          <button
            onClick={() => setActiveTab('debts-installments')}
            className={`apple-tab ${activeTab === 'debts-installments' ? 'active' : ''}`}
          >
            Parcelas a Pagar
          </button>
        </div>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-5">
          <div className="glass-card-success p-8 apple-shadow-lg hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-bold mb-2 uppercase tracking-wider">Total a Receber (Período Filtrado)</p>
                <p className="text-5xl font-black text-green-800 mb-2">
                  R$ {calculateTotalToReceive().toFixed(2)}
                </p>
                <p className="text-base text-green-600 font-semibold">
                  {sales.filter(s => s.status === 'active' && s.sale_date >= dateRange.start && s.sale_date <= dateRange.end).length} vendas ativas
                </p>
              </div>
              <button
                onClick={() => setShowSaleForm(true)}
                className="pill-button ripple-effect flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 apple-shadow hover:apple-shadow-lg font-bold"
              >
                <Plus className="w-5 h-5" />
                Nova Venda
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {sales.filter(sale =>
              sale.sale_date >= dateRange.start &&
              sale.sale_date <= dateRange.end
            ).map((sale) => (
              <div key={sale.id} className="glass-card apple-press hover-lift-sm">
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleSaleExpansion(sale.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-900">{sale.client_name}</h3>
                        {sale.anticipated && (
                          <span className="apple-badge bg-yellow-100/80 text-yellow-700 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Antecipada
                          </span>
                        )}
                        <span className={`apple-badge ${
                          sale.status === 'completed'
                            ? 'bg-green-100/80 text-green-700'
                            : 'bg-blue-100/80 text-blue-700'
                        }`}>
                          {sale.status === 'completed' ? 'Completa' : 'Ativa'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="text-slate-500 font-medium mb-1">Data da Venda</p>
                          <p className="font-bold text-slate-900">{formatDate(new Date(sale.sale_date))}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium mb-1">Valor Total</p>
                          <p className="font-bold text-slate-900">R$ {sale.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium mb-1">Falta Receber</p>
                          <p className="font-bold text-red-600">R$ {sale.remaining_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium mb-1">Parcelas</p>
                          <p className="font-bold text-slate-900">{sale.installments}x</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {!sale.anticipated && sale.status === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnticipateSale(sale);
                          }}
                          className="pill-button ripple-effect flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 font-semibold text-sm"
                        >
                          <Zap className="w-4 h-4" />
                          Antecipar
                        </button>
                      )}
                      <div className="transition-transform duration-300" style={{ transform: expandedSales.has(sale.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {expandedSales.has(sale.id) && saleInstallments[sale.id] && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Parcelas
                    </h4>
                    <div className="space-y-2">
                      {saleInstallments[sale.id].map((installment) => (
                        <div
                          key={installment.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-900">
                              {installment.installment_number}/{sale.installments}
                            </span>
                            <span className="text-gray-600">
                              Vencimento: {formatDate(new Date(installment.due_date))}
                            </span>
                            {installment.received_date && (
                              <span className="text-green-600 text-sm">
                                Recebida em: {formatDate(new Date(installment.received_date))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-900">
                              R$ {installment.amount.toFixed(2)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              installment.status === 'received'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {installment.status === 'received' ? 'Recebida' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sales.filter(sale =>
              sale.sale_date >= dateRange.start &&
              sale.sale_date <= dateRange.end
            ).length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma venda encontrada no período</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="space-y-5">
          <div className="glass-card-danger p-8 apple-shadow-lg hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-bold mb-2 uppercase tracking-wider">Total a Pagar (Período Filtrado)</p>
                <p className="text-5xl font-black text-red-800 mb-2">
                  R$ {calculateTotalToPay().toFixed(2)}
                </p>
                <p className="text-base text-red-600 font-semibold">
                  {monthlyBillsCount} faturas a pagar este mês
                </p>
              </div>
              <button
                onClick={() => setShowDebtForm(true)}
                className="pill-button ripple-effect flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 apple-shadow hover:apple-shadow-lg font-bold"
              >
                <Plus className="w-5 h-5" />
                Nova Dívida
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {debts.filter(debt =>
              debt.purchase_date >= dateRange.start &&
              debt.purchase_date <= dateRange.end
            ).map((debt) => (
              <div key={debt.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDebtExpansion(debt.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{debt.supplier_name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          debt.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {debt.status === 'completed' ? 'Paga' : 'Ativa'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Data da Compra</p>
                          <p className="font-medium text-gray-900">{formatDate(new Date(debt.purchase_date))}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Valor Total</p>
                          <p className="font-medium text-gray-900">R$ {debt.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Falta Pagar</p>
                          <p className="font-medium text-red-600">R$ {debt.remaining_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Parcelas</p>
                          <p className="font-medium text-gray-900">{debt.installments}x</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedDebts.has(debt.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedDebts.has(debt.id) && debtInstallments[debt.id] && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Parcelas
                    </h4>
                    <div className="space-y-2">
                      {debtInstallments[debt.id].map((installment) => (
                        <div
                          key={installment.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-900">
                              {installment.installment_number}/{debt.installments}
                            </span>
                            <span className="text-gray-600">
                              Vencimento: {formatDate(new Date(installment.due_date))}
                            </span>
                            {installment.paid_date && (
                              <span className="text-green-600 text-sm">
                                Paga em: {formatDate(new Date(installment.paid_date))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-900">
                              R$ {installment.amount.toFixed(2)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              installment.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {installment.status === 'paid' ? 'Paga' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {debts.filter(debt =>
              debt.purchase_date >= dateRange.start &&
              debt.purchase_date <= dateRange.end
            ).length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma dívida encontrada no período</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sales-installments' && (
        <SalesInstallmentsList
          dateRange={dateRange}
          onPaymentSuccess={() => {
            loadSales();
            loadDebts();
          }}
        />
      )}

      {activeTab === 'debts-installments' && (
        <DebtsInstallmentsList
          dateRange={dateRange}
          onPaymentSuccess={() => {
            loadSales();
            loadDebts();
          }}
        />
      )}

      {showSaleForm && (
        <CreditCardSaleForm
          onClose={() => setShowSaleForm(false)}
          onSuccess={() => {
            setShowSaleForm(false);
            loadSales();
          }}
        />
      )}

      {showDebtForm && (
        <CreditCardDebtForm
          onClose={() => setShowDebtForm(false)}
          onSuccess={() => {
            setShowDebtForm(false);
            loadDebts();
          }}
        />
      )}

      {showAnticipateSaleForm && selectedSale && (
        <AnticipateSaleForm
          sale={selectedSale}
          onClose={() => {
            setShowAnticipateSaleForm(false);
            setSelectedSale(null);
          }}
          onSuccess={() => {
            setShowAnticipateSaleForm(false);
            setSelectedSale(null);
            loadSales();
          }}
        />
      )}
    </div>
  );
}
