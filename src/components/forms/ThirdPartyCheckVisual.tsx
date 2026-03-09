import React from 'react';
import { Trash2 } from 'lucide-react';
import { ThirdPartyCheckDetails } from '../../types';

interface ThirdPartyCheckVisualProps {
  check: ThirdPartyCheckDetails;
  checkIndex: number;
  checkNumber: number;
  totalChecks: number;
  amount: number;
  dueDate?: string;
  onUpdate: (field: keyof ThirdPartyCheckDetails, value: string) => void;
  onRemove: () => void;
}

export function ThirdPartyCheckVisual({
  check,
  checkIndex,
  checkNumber,
  totalChecks,
  amount,
  dueDate,
  onUpdate,
  onRemove
}: ThirdPartyCheckVisualProps) {
  const formattedAmount = amount > 0
    ? amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '________________';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-600">
          Cheque {checkNumber} de {totalChecks}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remover
        </button>
      </div>

      <div
        className="relative rounded-xl overflow-hidden shadow-lg border-2 border-slate-300"
        style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 40%, #fef3c7 100%)',
          fontFamily: '"Courier New", monospace'
        }}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #92400e 0px, #92400e 1px, transparent 1px, transparent 12px)',
          }}
        />

        <div className="relative p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <input
                type="text"
                value={check.bank}
                onChange={(e) => onUpdate('bank', e.target.value)}
                placeholder="Nome do Banco"
                className="w-full bg-transparent border-0 border-b-2 border-amber-400 focus:border-amber-600 focus:outline-none text-slate-800 font-bold text-base placeholder-amber-300 pb-0.5"
                style={{ fontFamily: '"Arial", sans-serif' }}
              />
              <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Banco</span>
            </div>
            <div className="ml-4 text-right">
              <div className="bg-amber-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                Cheque Nº
              </div>
              <input
                type="text"
                value={check.checkNumber}
                onChange={(e) => onUpdate('checkNumber', e.target.value)}
                placeholder="000000"
                className="mt-1 w-24 text-center bg-white border border-amber-400 rounded px-2 py-0.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Agência</span>
              <input
                type="text"
                value={check.agency}
                onChange={(e) => onUpdate('agency', e.target.value)}
                placeholder="0000"
                className="w-full bg-transparent border-0 border-b-2 border-amber-400 focus:border-amber-600 focus:outline-none text-slate-800 font-mono text-sm placeholder-amber-300 pb-0.5 mt-0.5"
              />
            </div>
            <div>
              <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Conta</span>
              <input
                type="text"
                value={check.account}
                onChange={(e) => onUpdate('account', e.target.value)}
                placeholder="00000-0"
                className="w-full bg-transparent border-0 border-b-2 border-amber-400 focus:border-amber-600 focus:outline-none text-slate-800 font-mono text-sm placeholder-amber-300 pb-0.5 mt-0.5"
              />
            </div>
          </div>

          <div className="mb-3">
            <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
              Pague-se a quantia de
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-amber-600 font-bold text-lg">R$</span>
              <div
                className="flex-1 bg-white border-2 border-amber-400 rounded px-3 py-1 text-slate-800 font-bold text-lg text-center min-h-[36px] flex items-center justify-center"
              >
                {formattedAmount}
              </div>
            </div>
          </div>

          {dueDate && (
            <div className="mb-3">
              <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Vencimento</span>
              <div className="w-full border-b-2 border-amber-400 pb-0.5 mt-0.5 text-slate-800 font-mono text-sm">
                {new Date(dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}

          <div className="border-t border-amber-300 pt-3 mt-3">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
                  Emissor (Nome) *
                </span>
                <input
                  type="text"
                  value={check.issuer}
                  onChange={(e) => onUpdate('issuer', e.target.value)}
                  placeholder="Nome completo do emissor"
                  className="w-full bg-transparent border-0 border-b-2 border-amber-400 focus:border-amber-600 focus:outline-none text-slate-800 text-sm placeholder-amber-300 pb-0.5 mt-0.5"
                />
              </div>
              <div>
                <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
                  CPF / CNPJ *
                </span>
                <input
                  type="text"
                  value={check.cpfCnpj}
                  onChange={(e) => onUpdate('cpfCnpj', e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-transparent border-0 border-b-2 border-amber-400 focus:border-amber-600 focus:outline-none text-slate-800 font-mono text-sm placeholder-amber-300 pb-0.5 mt-0.5"
                />
              </div>
            </div>

            <div>
              <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
                Observações
              </span>
              <input
                type="text"
                value={check.observations || ''}
                onChange={(e) => onUpdate('observations', e.target.value)}
                placeholder="Informações adicionais sobre o cheque"
                className="w-full bg-transparent border-0 border-b border-amber-300 focus:border-amber-600 focus:outline-none text-slate-700 text-sm placeholder-amber-300 pb-0.5 mt-0.5"
              />
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <div className="w-40 border-t-2 border-amber-600 pt-1 text-center">
              <span className="text-xs text-amber-700">Assinatura do Emissor</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-600 px-4 py-1.5 flex items-center justify-between">
          <span className="text-xs text-amber-100 font-medium">
            Cheque de Terceiro
          </span>
          <span className="text-xs text-white font-bold">
            {check.bank || 'Banco não informado'} • Ag. {check.agency || '----'} • C/C {check.account || '--------'}
          </span>
        </div>
      </div>

      {(!check.bank || !check.agency || !check.account || !check.checkNumber || !check.issuer || !check.cpfCnpj) && (
        <p className="text-xs text-amber-600 mt-1 font-medium">
          Preencha todos os campos obrigatórios marcados com *
        </p>
      )}
    </div>
  );
}
