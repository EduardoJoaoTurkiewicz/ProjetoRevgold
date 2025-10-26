import React, { useState } from 'react';
import { FileText, CreditCard, CheckCircle, Users, ChevronDown, ChevronUp, ExternalLink, CheckCheck } from 'lucide-react';

export interface Receivable {
  id: string;
  type: 'boleto' | 'cheque' | 'cartao' | 'acerto';
  clientName: string;
  value: number;
  dueDate: string;
  installmentNumber?: number;
  totalInstallments?: number;
  observations?: string;
  saleId?: string;
  status: string;
}

interface ReceivableCardProps {
  receivable: Receivable;
  onNavigate: (type: string, id: string) => void;
  onMarkAsPaid?: (id: string, type: string) => void;
}

export default function ReceivableCard({ receivable, onNavigate, onMarkAsPaid }: ReceivableCardProps) {
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
    const due = new Date(receivable.dueDate + 'T00:00:00');
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
        color: 'bg-green-500 text-white'
      };
    } else {
      return {
        days: diffDays,
        label: `Vence em ${diffDays} dias`,
        color: 'bg-green-600 text-white'
      };
    }
  };

  const getTypeIcon = () => {
    switch (receivable.type) {
      case 'boleto':
        return FileText;
      case 'cheque':
        return CheckCheck;
      case 'cartao':
        return CreditCard;
      case 'acerto':
        return Users;
      default:
        return FileText;
    }
  };

  const getTypeLabel = () => {
    switch (receivable.type) {
      case 'boleto':
        return 'Boleto';
      case 'cheque':
        return 'Cheque';
      case 'cartao':
        return 'Cartão';
      case 'acerto':
        return 'Acerto';
      default:
        return 'Outro';
    }
  };

  const dueInfo = getDaysUntilDue();
  const TypeIcon = getTypeIcon();

  return (
    <div className="border-l-4 border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-green-600 shadow-md">
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-base leading-tight mb-1 truncate">
                {receivable.clientName}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white shadow-sm">
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
            className="p-2 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
            title={isExpanded ? 'Recolher' : 'Expandir'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-green-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-green-700" />
            )}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-800 font-semibold">Valor:</span>
            <span className="text-xl font-black text-green-700">{formatCurrency(receivable.value)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-green-800 font-semibold">Vencimento:</span>
            <span className="text-sm font-bold text-green-900">{formatDate(receivable.dueDate)}</span>
          </div>

          {receivable.installmentNumber && receivable.totalInstallments && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-800 font-semibold">Parcela:</span>
              <span className="text-sm font-bold text-green-900">
                {receivable.installmentNumber}/{receivable.totalInstallments}
              </span>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-green-200 space-y-3 animate-slideDown">
            {receivable.observations && (
              <div>
                <label className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1 block">
                  Observações
                </label>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-green-200">
                  {receivable.observations}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {onMarkAsPaid && (
                <button
                  onClick={() => onMarkAsPaid(receivable.id, receivable.type)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
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
                    acerto: 'acertos'
                  };
                  onNavigate(typeMap[receivable.type], receivable.id);
                }}
                className="flex-1 px-4 py-2 bg-white hover:bg-green-50 text-green-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-green-600 shadow-md"
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
