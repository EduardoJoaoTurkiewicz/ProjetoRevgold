import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface DueDatesSummaryProps {
  totalReceivable: number;
  totalPayable: number;
  receivableCount: number;
  payableCount: number;
}

export default function DueDatesSummary({
  totalReceivable,
  totalPayable,
  receivableCount,
  payableCount
}: DueDatesSummaryProps) {
  const balance = totalReceivable - totalPayable;
  const isPositive = balance >= 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 modern-shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-green-900 uppercase tracking-wide mb-1">
              Total a Receber
            </h3>
            <p className="text-3xl font-black text-green-700 mb-1">
              {formatCurrency(totalReceivable)}
            </p>
            <p className="text-xs text-green-600 font-semibold">
              {receivableCount} {receivableCount === 1 ? 'vencimento' : 'vencimentos'}
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 modern-shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl">
            <TrendingDown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide mb-1">
              Total a Pagar
            </h3>
            <p className="text-3xl font-black text-red-700 mb-1">
              {formatCurrency(totalPayable)}
            </p>
            <p className="text-xs text-red-600 font-semibold">
              {payableCount} {payableCount === 1 ? 'vencimento' : 'vencimentos'}
            </p>
          </div>
        </div>
      </div>

      <div className={`card bg-gradient-to-br ${
        isPositive
          ? 'from-blue-50 to-indigo-50 border-blue-300'
          : 'from-orange-50 to-amber-50 border-orange-300'
      } border-2 modern-shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${
            isPositive
              ? 'from-blue-600 to-indigo-700'
              : 'from-orange-600 to-amber-700'
          } shadow-xl`}>
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-bold ${
              isPositive ? 'text-blue-900' : 'text-orange-900'
            } uppercase tracking-wide mb-1`}>
              Saldo Projetado
            </h3>
            <p className={`text-3xl font-black ${
              isPositive ? 'text-blue-700' : 'text-orange-700'
            } mb-1`}>
              {formatCurrency(Math.abs(balance))}
            </p>
            <p className={`text-xs ${
              isPositive ? 'text-blue-600' : 'text-orange-600'
            } font-semibold`}>
              {isPositive ? 'Superávit' : 'Déficit'} no período
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
