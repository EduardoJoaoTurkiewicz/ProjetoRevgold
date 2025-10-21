import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { formatDateISO } from '../../utils/dateUtils';

interface CreditCardSale {
  id: string;
  client_name: string;
  total_amount: number;
  remaining_amount: number;
  installments: number;
}

interface Props {
  sale: CreditCardSale;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AnticipateSaleForm({ sale, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    anticipated_date: formatDateISO(new Date()),
    anticipated_fee: '',
  });
  const [loading, setLoading] = useState(false);

  const calculateReceivedAmount = () => {
    const fee = parseFloat(formData.anticipated_fee) || 0;
    return sale.remaining_amount - fee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const anticipatedFee = parseFloat(formData.anticipated_fee) || 0;
      const anticipatedAmount = calculateReceivedAmount();

      const { error: updateError } = await supabase
        .from('credit_card_sales')
        .update({
          anticipated: true,
          anticipated_date: formData.anticipated_date,
          anticipated_fee: anticipatedFee,
          anticipated_amount: anticipatedAmount,
          status: 'completed',
          remaining_amount: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sale.id);

      if (updateError) throw updateError;

      const { error: installmentsError } = await supabase
        .from('credit_card_sale_installments')
        .update({
          status: 'received',
          received_date: formData.anticipated_date,
          updated_at: new Date().toISOString(),
        })
        .eq('credit_card_sale_id', sale.id)
        .eq('status', 'pending');

      if (installmentsError) throw installmentsError;

      const { error: cashError } = await supabase
        .from('cash_transactions')
        .insert({
          date: formData.anticipated_date,
          type: 'income',
          amount: anticipatedAmount,
          description: `Antecipação de venda - ${sale.client_name}`,
          category: 'Vendas',
          payment_method: 'Cartão de Crédito (Antecipado)',
        });

      if (cashError) throw cashError;

      toast.success('Venda antecipada com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao antecipar venda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Antecipar Venda</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Informações da Venda</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-blue-600">Cliente:</span> {sale.client_name}</p>
              <p><span className="text-blue-600">Valor a Receber:</span> R$ {sale.remaining_amount.toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Antecipação *
              </label>
              <input
                type="date"
                required
                value={formData.anticipated_date}
                onChange={(e) => setFormData({ ...formData, anticipated_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de Juros/Desconto (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.anticipated_fee}
                onChange={(e) => setFormData({ ...formData, anticipated_fee: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Valor cobrado pela antecipação</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium mb-1">Valor a Receber</p>
              <p className="text-2xl font-bold text-green-700">
                R$ {calculateReceivedAmount().toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Este valor será adicionado ao caixa
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                <strong>Atenção:</strong> Após antecipar, todas as parcelas pendentes serão marcadas como recebidas e o valor líquido será adicionado ao caixa.
              </p>
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
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Antecipar Venda'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
