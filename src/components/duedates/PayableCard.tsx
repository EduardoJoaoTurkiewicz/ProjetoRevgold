import React, { useState } from 'react';
import { FileText, CreditCard, CheckCheck, Building, Briefcase, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from 'lucide-react';

export interface Payable {
  id: string;
  type: 'boleto' | 'cheque' | 'imposto' | 'salario' | 'cartao';
  description: string;
  value: number;
  dueDate: string;
  installmentNumber?: number;
  totalInstallments?: number;
  observations?: string;
  relatedId?: string;
  status: string;
}

interface PayableCardProps {
  payable: Payable;
  onNavigate: (type: string, id: string) => void;
  onMarkAsPaid?: (id: string, type: string) => void;
}

export default function PayableCard({ payable, onNavigate, onMarkAsPaid }: PayableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDaysUntilDue = (): { days: number; label: string; color: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(payable.dueDate + 'T00:00:00');
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: Math.abs(diffDays),
        label: `Vencido há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`,
        color: diffDays < -3 ? 'bg-red-900 text-white' : 'bg-red-700 text-white'
      };
    } else if (diffDays === 0) {
      return {
        days: 0,
        label: 'Vence hoje',
        color: 'bg-orange-600 text-white'
      };
    } else if (diffDays === 1) {
      return {
        days: 1,
        label: 'Vence amanhã',
        color: 'bg-orange-500 text-white'
      };
    } else if (diffDays <= 3) {
      return {
        days: diffDays,
        label: `Vence em ${diffDays} dias`,
        color: 'bg-yellow-500 text-white'
      };
    } else if (diffDays <= 7) {
      return {
        days: diffDays,
        label: `Vence em ${diffDays} dias`,
        color: 'bg-amber-500 text-white'
      };
    } else {
      return {
        days: diffDays,
        label: `Vence em ${diffDays} dias`,
        color: 'bg-slate-500 text-white'
      };
    }
  };

  const getTypeIcon = () => {
    switch (payable.type) {
      case 'boleto':
        return FileText;
      case 'cheque':
        return CheckCheck;
      case 'cartao':
        return CreditCard;
      case 'imposto':
        return Building;
      case 'salario':
        return Briefcase;
      default:
        return FileText;
    }
  };

  const getTypeLabel = () => {
    switch (payable.type) {
      case 'boleto':
        return 'Boleto';
      case 'cheque':
        return 'Cheque';
      case 'cartao':
        return 'Cartão';
      case 'imposto':
        return 'Imposto';
      case 'salario':
        return 'Salário';
      default:
        return 'Outro';
    }
  };

  const dueInfo = getDaysUntilDue();
  const TypeIcon = getTypeIcon();

  return (
    <div className="border-l-4 border-red-600 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-red-600 shadow-md">
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-base leading-tight mb-1 truncate">
                {payable.description}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm">
                  {getTypeLabel()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${dueInfo.color}`}>
                  {dueInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
            title={isExpanded ? 'Recolher' : 'Expandir'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-red-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-700" />
            )}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-800 font-semibold">Valor:</span>
            <span className="text-xl font-black text-red-700">{formatCurrency(payable.value)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-red-800 font-semibold">Vencimento:</span>
            <span className="text-sm font-bold text-red-900">{formatDate(payable.dueDate)}</span>
          </div>

          {payable.installmentNumber && payable.totalInstallments && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-800 font-semibold">Parcela:</span>
              <span className="text-sm font-bold text-red-900">
                {payable.installmentNumber}/{payable.totalInstallments}
              </span>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-red-200 space-y-3 animate-slideDown">
            {payable.observations && (
              <div>
                <label className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1 block">
                  Observações
                </label>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-red-200">
                  {payable.observations}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {onMarkAsPaid && (
                <button
                  onClick={() => onMarkAsPaid(payable.id, payable.type)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marcar como Pago
                </button>
              )}
              <button
                onClick={() => {
                  const typeMap: Record<string, string> = {
                    boleto: 'boletos',
                    cheque: 'checks',
                    cartao: 'credit-cards',
                    imposto: 'taxes',
                    salario: 'employees'
                  };
                  onNavigate(typeMap[payable.type], payable.id);
                }}
                className="flex-1 px-4 py-2 bg-white hover:bg-red-50 text-red-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-red-600 shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Detalhes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
