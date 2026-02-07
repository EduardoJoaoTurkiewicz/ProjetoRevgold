import React from 'react';
import { CreditCard, Calendar, DollarSign, Building2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function PayablesReport() {
  const { checks, boletos, debts } = useAppContext();

  // Get company payable checks
  const payableChecks = checks.filter(check => 
    check.status === 'pendente' && (check.isOwnCheck || check.isCompanyPayable)
  );

  // Get company payable boletos
  const payableBoletos = boletos.filter(boleto => 
    boleto.status === 'pendente' && boleto.isCompanyPayable
  );

  // Get pending debts
  const pendingDebts = debts.filter(debt => !debt.isPaid);

  const totalPayables = [
    ...payableChecks.map(check => check.value),
    ...payableBoletos.map(boleto => boleto.value),
    ...pendingDebts.map(debt => debt.pendingAmount)
  ].reduce((sum, value) => sum + value, 0);

  return (
    <div className="card modern-shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-red-600">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Valores a Pagar</h3>
          <p className="text-red-700 font-semibold">
            Total: R$ {totalPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Payable Checks */}
        {payableChecks.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Cheques a Pagar ({payableChecks.length})</h4>
            <div className="space-y-3">
              {payableChecks.slice(0, 5).map(check => (
                <div key={check.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-red-900">{check.companyName || check.client}</h5>
                      <p className="text-sm text-red-700">
                        Vencimento: {dbDateToDisplay(check.dueDate)}
                      </p>
                      {check.installmentNumber && check.totalInstallments && (
                        <p className="text-sm text-red-700">
                          Parcela {check.installmentNumber}/{check.totalInstallments}
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-black text-red-600">
                      R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
              {payableChecks.length > 5 && (
                <p className="text-sm text-red-600 text-center">
                  ... e mais {payableChecks.length - 5} cheque(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payable Boletos */}
        {payableBoletos.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Boletos a Pagar ({payableBoletos.length})</h4>
            <div className="space-y-3">
              {payableBoletos.slice(0, 5).map(boleto => (
                <div key={boleto.id} className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-orange-900">{boleto.companyName || boleto.client}</h5>
                      <p className="text-sm text-orange-700">
                        Vencimento: {dbDateToDisplay(boleto.dueDate)}
                      </p>
                      <p className="text-sm text-orange-700">
                        Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                      </p>
                    </div>
                    <span className="text-lg font-black text-orange-600">
                      R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
              {payableBoletos.length > 5 && (
                <p className="text-sm text-orange-600 text-center">
                  ... e mais {payableBoletos.length - 5} boleto(s)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pending Debts */}
        {pendingDebts.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Dívidas Pendentes ({pendingDebts.length})</h4>
            <div className="space-y-3">
              {pendingDebts.slice(0, 5).map(debt => (
                <div key={debt.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-gray-900">{debt.company}</h5>
                      <p className="text-sm text-gray-700">
                        Data: {dbDateToDisplay(debt.date)}
                      </p>
                      <p className="text-sm text-gray-700 truncate max-w-48">
                        {debt.description}
                      </p>
                    </div>
                    <span className="text-lg font-black text-gray-600">
                      R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
              {pendingDebts.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  ... e mais {pendingDebts.length - 5} dívida(s)
                </p>
              )}
            </div>
          </div>
        )}

        {totalPayables === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-green-600 font-semibold">Nenhum valor a pagar!</p>
            <p className="text-green-500 text-sm mt-2">
              Todas as dívidas estão quitadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}