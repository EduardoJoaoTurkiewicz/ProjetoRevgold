import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Loader, AlertCircle } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import DueDatesSummary from './DueDatesSummary';
import ReceivableCard, { Receivable } from './ReceivableCard';
import PayableCard, { Payable } from './PayableCard';
import { dueDatesService } from '../../lib/dueDatesService';
import toast from 'react-hot-toast';

export default function DueDatesSection() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToISODate = (brazilianDate: string): string => {
    const [day, month, year] = brazilianDate.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      const isoStartDate = convertToISODate(startDate);
      const isoEndDate = convertToISODate(endDate);

      const [receivablesData, payablesData] = await Promise.all([
        dueDatesService.getReceivables(isoStartDate, isoEndDate),
        dueDatesService.getPayables(isoStartDate, isoEndDate)
      ]);

      setReceivables(receivablesData);
      setPayables(payablesData);

      toast.success('Vencimentos carregados com sucesso!');
    } catch (err) {
      console.error('Error loading due dates:', err);
      setError('Erro ao carregar vencimentos. Tente novamente.');
      toast.error('Erro ao carregar vencimentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setReceivables([]);
    setPayables([]);
    setHasSearched(false);
    setError(null);
  };

  const handleNavigate = (type: string, id: string) => {
    window.location.hash = type;

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('filterByRelatedId', {
        detail: { type, id }
      }));
    }, 100);

    toast.success(`Navegando para ${type}`);
  };

  const handleMarkAsPaid = async (id: string, type: string) => {
    if (!window.confirm('Tem certeza que deseja marcar este item como pago?')) {
      return;
    }

    try {
      if (type === 'boleto') {
        await dueDatesService.markBoletoAsPaid(id);
      } else if (type === 'cheque') {
        await dueDatesService.markCheckAsPaid(id);
      } else if (type === 'acerto') {
        await dueDatesService.markAcertoAsPaid(id);
      }

      toast.success('Item marcado como pago!');
      handleSearch();
    } catch (err) {
      console.error('Error marking as paid:', err);
      toast.error('Erro ao marcar como pago');
    }
  };

  const totalReceivable = receivables.reduce((sum, r) => sum + r.value, 0);
  const totalPayable = payables.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-8 mt-12">
      <div className="border-t-4 border-slate-300 pt-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Vencimentos</h2>
            <p className="text-slate-600 text-lg">Gerencie recebíveis e pagáveis por período</p>
          </div>
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onSearch={handleSearch}
          onClear={handleClear}
        />

        {error && (
          <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-bold text-red-800">Erro ao Carregar Dados</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">Carregando vencimentos...</p>
            </div>
          </div>
        )}

        {!isLoading && hasSearched && !error && (
          <>
            <div className="mt-8">
              <DueDatesSummary
                totalReceivable={totalReceivable}
                totalPayable={totalPayable}
                receivableCount={receivables.length}
                payableCount={payables.length}
              />
            </div>

            {receivables.length === 0 && payables.length === 0 ? (
              <div className="card modern-shadow-xl text-center py-16">
                <Calendar className="w-24 h-24 mx-auto mb-6 text-slate-300" />
                <h3 className="text-2xl font-bold text-slate-700 mb-3">
                  Nenhum vencimento encontrado
                </h3>
                <p className="text-slate-600 text-lg mb-6">
                  Não há vencimentos no período selecionado.
                </p>
                <p className="text-slate-500">
                  Tente expandir o período de busca ou verificar se há registros pendentes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 modern-shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-green-600 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-green-900">A Receber</h3>
                        <p className="text-green-700 font-semibold">
                          {receivables.length} {receivables.length === 1 ? 'vencimento' : 'vencimentos'}
                        </p>
                      </div>
                    </div>

                    {receivables.length > 0 ? (
                      <div className="space-y-4 max-h-[800px] overflow-y-auto modern-scrollbar pr-2">
                        {receivables.map(receivable => (
                          <ReceivableCard
                            key={receivable.id}
                            receivable={receivable}
                            onNavigate={handleNavigate}
                            onMarkAsPaid={handleMarkAsPaid}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-green-300" />
                        <p className="text-green-700 font-semibold text-lg">
                          Nenhum recebível neste período
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 modern-shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-red-600 shadow-lg">
                        <TrendingDown className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-red-900">A Pagar</h3>
                        <p className="text-red-700 font-semibold">
                          {payables.length} {payables.length === 1 ? 'vencimento' : 'vencimentos'}
                        </p>
                      </div>
                    </div>

                    {payables.length > 0 ? (
                      <div className="space-y-4 max-h-[800px] overflow-y-auto modern-scrollbar pr-2">
                        {payables.map(payable => (
                          <PayableCard
                            key={payable.id}
                            payable={payable}
                            onNavigate={handleNavigate}
                            onMarkAsPaid={handleMarkAsPaid}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <TrendingDown className="w-16 h-16 mx-auto mb-4 text-red-300" />
                        <p className="text-red-700 font-semibold text-lg">
                          Nenhum pagável neste período
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!hasSearched && !isLoading && (
          <div className="mt-8 card modern-shadow-xl text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50">
            <Calendar className="w-24 h-24 mx-auto mb-6 text-blue-300" />
            <h3 className="text-2xl font-bold text-slate-700 mb-3">
              Selecione um período
            </h3>
            <p className="text-slate-600 text-lg mb-2">
              Para visualizar os vencimentos, selecione as datas e clique em "Buscar Vencimentos".
            </p>
            <p className="text-slate-500">
              Use os atalhos rápidos para facilitar a seleção do período.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
