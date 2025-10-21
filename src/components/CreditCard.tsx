import { useState, useEffect } from 'react';
import { CreditCard as CreditCardIcon, Plus, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, getMonthStart, getMonthEnd, isDateInRange } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import CreditCardSaleForm from './forms/CreditCardSaleForm';
import CreditCardDebtForm from './forms/CreditCardDebtForm';
import AnticipateSaleForm from './forms/AnticipateSaleForm';

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
  const [activeTab, setActiveTab] = useState<'sales' | 'debts'>('sales');
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

  useEffect(() => {
    loadSales();
    loadDebts();
  }, [dateRange]);

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_card_sales')
        .select('*')
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar vendas no cartão: ' + error.message);
    }
  };

  const loadDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_card_debts')
        .select('*')
        .gte('purchase_date', dateRange.start)
        .lte('purchase_date', dateRange.end)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error: any) {
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
      .filter(sale => sale.status === 'active')
      .reduce((sum, sale) => sum + sale.remaining_amount, 0);
  };

  const calculateMonthlyInvoices = () => {
    const now = new Date();
    const monthStart = getMonthStart(now);
    const monthEnd = getMonthEnd(now);

    return debts.reduce((sum, debt) => {
      const installments = debtInstallments[debt.id] || [];
      const monthlyAmount = installments
        .filter(inst => inst.status === 'pending' &&
          isDateInRange(new Date(inst.due_date), new Date(monthStart), new Date(monthEnd)))
        .reduce((acc, inst) => acc + inst.amount, 0);
      return sum + monthlyAmount;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <CreditCardIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cartão de Crédito</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie vendas e dívidas no cartão</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'sales'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Vendas
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'debts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Dívidas
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium mb-1">Total a Receber (Período Filtrado)</p>
                <p className="text-3xl font-bold text-green-700">
                  R$ {calculateTotalToReceive().toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowSaleForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nova Venda
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSaleExpansion(sale.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{sale.client_name}</h3>
                        {sale.anticipated && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                            Antecipada
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          sale.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {sale.status === 'completed' ? 'Completa' : 'Ativa'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Data da Venda</p>
                          <p className="font-medium text-gray-900">{formatDate(new Date(sale.sale_date))}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Valor Total</p>
                          <p className="font-medium text-gray-900">R$ {sale.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Falta Receber</p>
                          <p className="font-medium text-red-600">R$ {sale.remaining_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Parcelas</p>
                          <p className="font-medium text-gray-900">{sale.installments}x</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!sale.anticipated && sale.status === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnticipateSale(sale);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                        >
                          <Zap className="w-4 h-4" />
                          Antecipar
                        </button>
                      )}
                      {expandedSales.has(sale.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedSales.has(sale.id) && saleInstallments[sale.id] && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3">Parcelas</h4>
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

            {sales.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma venda encontrada no período</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg shadow-sm border border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium mb-1">Faturas a Pagar Este Mês</p>
                <p className="text-3xl font-bold text-red-700">
                  R$ {calculateMonthlyInvoices().toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowDebtForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nova Dívida
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {debts.map((debt) => (
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
                    <h4 className="font-semibold text-gray-900 mb-3">Parcelas</h4>
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

            {debts.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma dívida encontrada no período</p>
              </div>
            )}
          </div>
        </div>
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
