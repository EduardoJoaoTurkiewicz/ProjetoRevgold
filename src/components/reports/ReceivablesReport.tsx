import React from 'react';
import { Receipt, Calendar, DollarSign, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function ReceivablesReport() {
  const { checks, boletos, sales } = useAppContext();

  // Get pending checks (to receive)
  const pendingChecks = checks.filter(check => 
    check.status === 'pendente' && !check.isOwnCheck && !check.isCompanyPayable
  );

  // Get pending boletos (to receive)
  const pendingBoletos = boletos.filter(boleto => 
    boleto.status === 'pendente' && !boleto.isCompanyPayable
  );

  // Get pending sales amounts
  const pendingSales = sales.filter(sale => sale.pendingAmount > 0);

  const totalReceivables = [
    ...pendingChecks.map(check => check.value),
    ...pendingBoletos.map(boleto => boleto.value),
    ...pendingSales.map(sale => sale.pendingAmount)
  ].reduce((sum, value) => sum + value, 0);

  return (
    <div className="card modern-shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-green-600">
          <Receipt className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Valores a Receber</h3>
          <p className="text-green-700 font-semibold">
            Total: R$ {totalReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Pending Checks */}
        {pendingChecks.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Cheques Pendentes ({pendingChecks.length})</h4>
            <div className="space-y-3">
              {pendingChecks.slice(0, 5).map(check => (
                <div key={check.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-yellow-900">{check.client}</h5>
                      <p className="text-sm text-yellow-700">
                        Vencimento: {dbDateToDisplay(check.dueDate)}
                      </p>
                      {check.installmentNumber && check.totalInstallments && (
                        <p className="text-sm text-yellow-700">
                          Parcela {check.installmentNumber}/{check.totalInstallments}
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-black text-yellow-600">
                      R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
              {pendingChecks.length > 5 && (
                <p className="text-sm text-yellow-600 text-center">
                  ... e mais {pendingChecks.length - 5} cheque(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pending Boletos */}
        {pendingBoletos.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Boletos Pendentes ({pendingBoletos.length})</h4>
            <div className="space-y-3">
              {pendingBoletos.slice(0, 5).map(boleto => (
                <div key={boleto.id} className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-cyan-900">{boleto.client}</h5>
                      <p className="text-sm text-cyan-700">
                        Vencimento: {dbDateToDisplay(boleto.dueDate)}
                      </p>
                      <p className="text-sm text-cyan-700">
                        Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                      </p>
                    </div>
                    <span className="text-lg font-black text-cyan-600">
                      R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
              {pendingBoletos.length > 5 && (
                <p className="text-sm text-cyan-600 text-center">
                  ... e mais {pendingBoletos.length - 5} boleto(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pending Sales */}
        {pendingSales.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Vendas Pendentes ({pendingSales.length})</h4>
            <div className="space-y-3">
              {pendingSales.slice(0, 5).map(sale => (
                <div key={sale.id} className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-purple-900">{sale.client}</h5>
                      <p className="text-sm text-purple-700">
                        Data: {dbDateToDisplay(sale.date)}
                      </p>
                      <p className="text-sm text-purple-700">
                        Status: {sale.status}
                      </p>
                    </div>
                    <span className="text-lg font-black text-purple-600">
                      R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
              {pendingSales.length > 5 && (
                <p className="text-sm text-purple-600 text-center">
                  ... e mais {pendingSales.length - 5} venda(s)
                </p>
              )}
            </div>
          </div>
        )}

        {totalReceivables === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-green-600 font-semibold">Nenhum valor a receber!</p>
            <p className="text-green-500 text-sm mt-2">
              Todos os pagamentos estão em dia
            </p>
          </div>
        )}
      </div>
    </div>
  );
}