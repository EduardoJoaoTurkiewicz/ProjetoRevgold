import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/dateUtils';
import InstallmentPaymentForm from '../forms/InstallmentPaymentForm';
import toast from 'react-hot-toast';

interface SaleInstallment {
  id: string;
  credit_card_sale_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  received_date: string | null;
  credit_card_sales: {
    installments: number;
    client_name: string;
  };
}

interface Props {
  dateRange: {
    start: string;
    end: string;
  };
  onPaymentSuccess: () => void;
}

export default function SalesInstallmentsList({ dateRange, onPaymentSuccess }: Props) {
  const [installments, setInstallments] = useState<SaleInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<SaleInstallment | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    loadInstallments();
  }, [dateRange]);

  const loadInstallments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_card_sale_installments')
        .select('*, credit_card_sales(installments, client_name)')
        .eq('status', 'pending')
        .gte('due_date', dateRange.start)
        .lte('due_date', dateRange.end)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setInstallments((data as any) || []);
    } catch (error: any) {
      toast.error('Erro ao carregar parcelas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (installment: SaleInstallment) => {
    setSelectedInstallment(installment);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedInstallment(null);
    loadInstallments();
    onPaymentSuccess();
  };

  const calculateTotals = () => {
    return {
      totalAmount: installments.reduce((sum, inst) => sum + inst.amount, 0),
      count: installments.length,
      overdueCount: installments.filter(
        inst => new Date(inst.due_date) < new Date()
      ).length
    };
  };

  const getStatusIcon = (status: string, dueDate: string) => {
    if (status === 'received') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (new Date(dueDate) < new Date()) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <Clock className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'received') {
      return 'bg-green-100 text-green-700';
    }
    if (new Date(dueDate) < new Date()) {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'received') {
      return 'Recebida';
    }
    if (new Date(dueDate) < new Date()) {
      return 'Vencida';
    }
    return 'Pendente';
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex justify-center mb-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-gray-500">Carregando parcelas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-lg border-2 border-cyan-300 p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-cyan-600 font-semibold uppercase">Total a Receber</p>
            <p className="text-3xl font-black text-cyan-900">
              R$ {totals.totalAmount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-cyan-600 font-semibold uppercase">Parcelas Pendentes</p>
            <p className="text-3xl font-black text-cyan-900">{totals.count}</p>
          </div>
          <div>
            <p className="text-xs text-cyan-600 font-semibold uppercase">Vencidas</p>
            <p className={`text-3xl font-black ${totals.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totals.overdueCount}
            </p>
          </div>
        </div>
      </div>

      {installments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma parcela pendente no período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {installments.map((installment) => (
            <div
              key={installment.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(installment.status, installment.due_date)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {installment.credit_card_sales.client_name}
                      </p>
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {installment.installment_number}/{installment.credit_card_sales.installments}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(new Date(installment.due_date))}
                      </div>
                      <div className="text-gray-500">
                        Valor: <span className="font-semibold text-gray-900">R$ {installment.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                    installment.status,
                    installment.due_date
                  )}`}>
                    {getStatusText(installment.status, installment.due_date)}
                  </span>

                  {installment.status === 'pending' && (
                    <button
                      onClick={() => handlePaymentClick(installment)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Registrar Pagamento
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPaymentForm && selectedInstallment && (
        <InstallmentPaymentForm
          type="sale"
          installmentId={selectedInstallment.id}
          installmentNumber={selectedInstallment.installment_number}
          totalInstallments={selectedInstallment.credit_card_sales.installments}
          amount={selectedInstallment.amount}
          clientOrSupplierName={selectedInstallment.credit_card_sales.client_name}
          dueDate={selectedInstallment.due_date}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
