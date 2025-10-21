import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { formatDateISO, addMonthsToDate } from '../../utils/dateUtils';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreditCardDebtForm({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    supplier_name: '',
    total_amount: '',
    installments: '1',
    purchase_date: formatDateISO(new Date()),
    first_due_date: formatDateISO(addMonthsToDate(new Date(), 1)),
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = parseFloat(formData.total_amount);
      const installments = parseInt(formData.installments);
      const installmentAmount = totalAmount / installments;

      const { data: debt, error: debtError } = await supabase
        .from('credit_card_debts')
        .insert({
          supplier_name: formData.supplier_name,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          installments: installments,
          purchase_date: formData.purchase_date,
          first_due_date: formData.first_due_date,
          status: 'active',
        })
        .select()
        .single();

      if (debtError) throw debtError;

      const installmentsData = [];
      for (let i = 0; i < installments; i++) {
        const dueDate = addMonthsToDate(new Date(formData.first_due_date), i);
        installmentsData.push({
          credit_card_debt_id: debt.id,
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: formatDateISO(dueDate),
          status: 'pending',
        });
      }

      const { error: installmentsError } = await supabase
        .from('credit_card_debt_installments')
        .insert(installmentsData);

      if (installmentsError) throw installmentsError;

      toast.success('Dívida no cartão criada com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao criar dívida: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Nova Dívida no Cartão</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Fornecedor *
            </label>
            <input
              type="text"
              required
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Total *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Parcelas *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Compra *
              </label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primeiro Vencimento *
              </label>
              <input
                type="date"
                required
                value={formData.first_due_date}
                onChange={(e) => setFormData({ ...formData, first_due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              {loading ? 'Salvando...' : 'Salvar Dívida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
