import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Check } from '../../types';
import { supabase } from '../../lib/supabase';
import { getCurrentDateString } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

interface DiscountChecksFormProps {
  checks: Check[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DiscountChecksForm({ checks, onClose, onSuccess }: DiscountChecksFormProps) {
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleCheckSelection = (checkId: string) => {
    const newSelected = new Set(selectedChecks);
    if (newSelected.has(checkId)) {
      newSelected.delete(checkId);
    } else {
      newSelected.add(checkId);
    }
    setSelectedChecks(newSelected);
  };

  const calculateTotalValue = () => {
    return checks
      .filter(check => selectedChecks.has(check.id))
      .reduce((sum, check) => sum + check.value, 0);
  };

  const handleProceed = () => {
    if (selectedChecks.size === 0) {
      toast.error('Selecione pelo menos um cheque para antecipar');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!receivedAmount || parseFloat(receivedAmount) <= 0) {
      toast.error('Informe o valor que cairá na conta');
      return;
    }

    const totalValue = calculateTotalValue();
    const received = parseFloat(receivedAmount);

    if (received > totalValue) {
      toast.error('O valor recebido não pode ser maior que o valor total dos cheques');
      return;
    }

    setIsProcessing(true);

    try {
      const discountDate = getCurrentDateString();
      const discountFee = totalValue - received;

      for (const checkId of Array.from(selectedChecks)) {
        const check = checks.find(c => c.id === checkId);
        if (!check) continue;

        const { error } = await supabase
          .from('checks')
          .update({
            is_discounted: true,
            discount_date: discountDate,
            discounted_amount: received / selectedChecks.size,
            discount_fee: discountFee / selectedChecks.size,
            status: 'compensado',
            updated_at: new Date().toISOString()
          })
          .eq('id', checkId);

        if (error) throw error;
      }

      const { error: transactionError } = await supabase
        .from('cash_transactions')
        .insert({
          date: discountDate,
          type: 'entrada',
          amount: received,
          description: `Antecipação de ${selectedChecks.size} cheque(s) - Taxa: R$ ${discountFee.toFixed(2)}`,
          category: 'cheque',
          payment_method: 'cheque'
        });

      if (transactionError) throw transactionError;

      // Remover eventos da agenda para os cheques antecipados
      try {
        const { AgendaAutoService } = await import('../../lib/agendaAutoService');
        for (const checkId of selectedChecks) {
          await AgendaAutoService.removeCheckEvents(checkId);
        }
        console.log('✅ Removed agenda events for discounted checks');
      } catch (agendaError) {
        console.error('❌ Error removing agenda events:', agendaError);
        // Não falha a operação se não conseguir remover eventos da agenda
      }

      toast.success(`${selectedChecks.size} cheque(s) antecipado(s) com sucesso!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao antecipar cheques:', error);
      toast.error('Erro ao antecipar cheques: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (showConfirmation) {
    const totalValue = calculateTotalValue();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-yellow-600">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Confirmar Antecipação</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Cheques selecionados:</strong> {selectedChecks.size}
              </p>
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Valor total dos cheques:</strong> R$ {totalValue.toFixed(2)}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Valor que cairá na conta *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={totalValue}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="input-field"
                placeholder="0,00"
                autoFocus
              />
              <p className="text-xs text-slate-600 mt-1">
                Informe o valor líquido que será creditado (já descontados os juros bancários)
              </p>
            </div>

            {receivedAmount && parseFloat(receivedAmount) > 0 && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-800 font-bold">
                  Taxa bancária: R$ {(totalValue - parseFloat(receivedAmount)).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 btn-secondary"
              disabled={isProcessing}
            >
              Voltar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Confirmar Antecipação'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-600">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Antecipar Cheques</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                Selecione os cheques que deseja antecipar. Na próxima etapa, você informará o valor que realmente cairá na conta.
              </p>
            </div>
          </div>

          {selectedChecks.size > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-800 font-bold">
                {selectedChecks.size} cheque(s) selecionado(s) - Total: R$ {calculateTotalValue().toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {checks.map(check => (
              <label
                key={check.id}
                className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedChecks.has(check.id)}
                  onChange={() => toggleCheckSelection(check.id)}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{check.client}</p>
                      <p className="text-xs text-slate-600">
                        Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                      {check.installmentNumber && check.totalInstallments && (
                        <p className="text-xs text-slate-600">
                          Parcela {check.installmentNumber}/{check.totalInstallments}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">
                        R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleProceed}
              className="btn-primary"
              disabled={selectedChecks.size === 0}
            >
              Prosseguir ({selectedChecks.size} selecionado{selectedChecks.size !== 1 ? 's' : ''})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
