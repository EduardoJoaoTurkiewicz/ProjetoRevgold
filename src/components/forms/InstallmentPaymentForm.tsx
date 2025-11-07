import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateISO } from '../../utils/dateUtils';
import { CreditCardService } from '../../lib/creditCardService';

interface Props {
  type: 'sale' | 'debt';
  installmentId: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  clientOrSupplierName: string;
  dueDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InstallmentPaymentForm({
  type,
  installmentId,
  installmentNumber,
  totalInstallments,
  amount,
  clientOrSupplierName,
  dueDate,
  onClose,
  onSuccess
}: Props) {
  const [paymentDate, setPaymentDate] = useState(formatDateISO(new Date()));
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'sale') {
        await CreditCardService.registerSaleInstallmentPayment(
          installmentId,
          paymentDate,
          observations || undefined
        );
      } else {
        await CreditCardService.registerDebtInstallmentPayment(
          installmentId,
          paymentDate,
          observations || undefined
        );
      }

      toast.success(`Pagamento registrado com sucesso!`);
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isSale = type === 'sale';
  const typeLabel = isSale ? 'Recebimento' : 'Pagamento';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Registrar {typeLabel}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-blue-200">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Cliente/Fornecedor</p>
              <p className="text-lg font-bold text-blue-900">{clientOrSupplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600 font-semibold uppercase">Parcela</p>
                <p className="text-sm font-bold text-blue-900">
                  {installmentNumber}/{totalInstallments}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-semibold uppercase">Valor</p>
                <p className="text-sm font-bold text-blue-900">
                  R$ {amount.toFixed(2)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Data de Vencimento</p>
              <p className="text-sm font-medium text-blue-900">
                {new Date(dueDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de {typeLabel} *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Data em que o {isSale ? 'recebimento' : 'pagamento'} foi realizado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Confirmado por transferência, consulte comprovante..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? `Registrando...` : `Registrar ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
