import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  FileText, 
  Receipt,
  CreditCard,
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { safeCurrency } from '../../utils/numberUtils';

interface ComprehensiveReportProps {
  filters: {
    startDate: string;
    endDate: string;
    status?: string;
  };
}

export function ComprehensiveReport({ filters }: ComprehensiveReportProps) {
  const { 
    sales, 
    debts, 
    checks, 
    boletos, 
    employees, 
    employeePayments,
    pixFees,
    taxes,
    cashBalance
  } = useAppContext();

  // Filter data by period
  const reportData = useMemo(() => {
    const periodSales = sales.filter(sale => 
      sale.date >= filters.startDate && sale.date <= filters.endDate
    );

    const periodDebts = debts.filter(debt => 
      debt.date >= filters.startDate && debt.date <= filters.endDate
    );

    // Calculate received values
    const receivedValues = [];
    
    // Sales with instant payment
    periodSales.forEach(sale => {
      (sale.paymentMethods || []).forEach((method, methodIndex) => {
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
            (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
          receivedValues.push({
            id: `sale-${sale.id}-${methodIndex}`,
            date: sale.date,
            type: 'Venda Instantânea',
            description: `Venda - ${sale.client}`,
            paymentMethod: method.type.replace('_', ' ').toUpperCase(),
            amount: method.amount,
            reference: sale,
            details: {
              saleId: sale.id,
              client: sale.client,
              products: sale.products,
              totalSaleValue: sale.totalValue,
              seller: sale.sellerId ? employees.find(e => e.id === sale.sellerId)?.name : 'Sem vendedor'
            }
          });
        }
      });
    });

    // Checks compensated in period
    checks.forEach(check => {
      if (check.dueDate >= filters.startDate && check.dueDate <= filters.endDate && check.status === 'compensado') {
        const relatedSale = sales.find(s => s.id === check.saleId);
        receivedValues.push({
          id: `check-${check.id}`,
          date: check.dueDate,
          type: 'Cheque Compensado',
          description: `Cheque compensado - ${check.client}`,
          paymentMethod: 'CHEQUE',
          amount: check.value,
          reference: relatedSale,
          details: {
            checkId: check.id,
            client: check.client,
            dueDate: check.dueDate,
            installment: `${check.installmentNumber}/${check.totalInstallments}`,
            usedFor: check.usedFor,
            isOwnCheck: check.isOwnCheck,
            relatedSale: relatedSale
          }
        });
      }
    });

    // Boletos paid in period
    boletos.forEach(boleto => {
      if (boleto.dueDate >= filters.startDate && boleto.dueDate <= filters.endDate && boleto.status === 'compensado') {
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        const relatedSale = sales.find(s => s.id === boleto.saleId);
        
        receivedValues.push({
          id: `boleto-${boleto.id}`,
          date: boleto.dueDate,
          type: 'Boleto Recebido',
          description: `Boleto pago - ${boleto.client}`,
          paymentMethod: 'BOLETO',
          amount: netReceived,
          reference: relatedSale,
          details: {
            boletoId: boleto.id,
            client: boleto.client,
            originalValue: boleto.value,
            finalAmount: finalAmount,
            notaryCosts: notaryCosts,
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
            overdueAction: boleto.overdueAction,
            relatedSale: relatedSale
          }
        });
      }
    });

    // Calculate paid values
    const paidValues = [];

    // Paid debts in period
    periodDebts.forEach(debt => {
      if (debt.isPaid) {
        (debt.paymentMethods || []).forEach((method, methodIndex) => {
          if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            paidValues.push({
              id: `debt-${debt.id}-${methodIndex}`,
              date: debt.date,
              type: 'Pagamento de Dívida',
              description: `Pagamento - ${debt.company}`,
              paymentMethod: method.type.replace('_', ' ').toUpperCase(),
              amount: method.amount,
              reference: debt,
              details: {
                debtId: debt.id,
                company: debt.company,
                description: debt.description,
                totalDebtValue: debt.totalValue,
                paidAmount: debt.paidAmount,
                pendingAmount: debt.pendingAmount
              }
            });
          }
        });
      }
    });

    // Own checks paid in period
    checks.forEach(check => {
      if (check.isOwnCheck && check.dueDate >= filters.startDate && check.dueDate <= filters.endDate && check.status === 'compensado') {
        const relatedDebt = debts.find(d => d.id === check.debtId);
        paidValues.push({
          id: `own-check-${check.id}`,
          date: check.dueDate,
          type: 'Cheque Próprio Pago',
          description: `Cheque próprio pago - ${check.client}`,
          paymentMethod: 'CHEQUE PRÓPRIO',
          amount: check.value,
          reference: relatedDebt,
          details: {
            checkId: check.id,
            client: check.client,
            usedFor: check.usedFor,
            installment: `${check.installmentNumber}/${check.totalInstallments}`,
            relatedDebt: relatedDebt
          }
        });
      }
    });

    // Company boletos paid in period
    boletos.forEach(boleto => {
      if (boleto.isCompanyPayable && boleto.dueDate >= filters.startDate && boleto.dueDate <= filters.endDate && boleto.status === 'compensado') {
        const relatedDebt = debts.find(d => d.id === boleto.debtId);
        paidValues.push({
          id: `company-boleto-${boleto.id}`,
          date: boleto.dueDate,
          type: 'Boleto Pago',
          description: `Boleto pago - ${boleto.client}`,
          paymentMethod: 'BOLETO',
          amount: boleto.value,
          reference: relatedDebt,
          details: {
            boletoId: boleto.id,
            client: boleto.client,
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
            relatedDebt: relatedDebt
          }
        });
      }
    });

    // Employee payments in period
    employeePayments.forEach(payment => {
      if (payment.paymentDate >= filters.startDate && payment.paymentDate <= filters.endDate) {
        const employee = employees.find(e => e.id === payment.employeeId);
        paidValues.push({
          id: `employee-payment-${payment.id}`,
          date: payment.paymentDate,
          type: 'Pagamento de Salário',
          description: `Pagamento de salário - ${employee?.name || 'Funcionário'}`,
          paymentMethod: 'DINHEIRO',
          amount: payment.amount,
          reference: employee,
          details: {
            employeeId: payment.employeeId,
            employeeName: employee?.name,
            position: employee?.position,
            observations: payment.observations,
            receipt: payment.receipt
          }
        });
      }
    });

    // PIX fees in period
    pixFees.forEach(fee => {
      if (fee.date >= filters.startDate && fee.date <= filters.endDate) {
        paidValues.push({
          id: `pix-fee-${fee.id}`,
          date: fee.date,
          type: 'Tarifa PIX',
          description: `Tarifa PIX - ${fee.bank}`,
          paymentMethod: 'PIX',
          amount: fee.amount,
          reference: null,
          details: {
            bank: fee.bank,
            transactionType: fee.transactionType,
            description: fee.description,
            relatedTransactionId: fee.relatedTransactionId
          }
        });
      }
    });

    // Tax payments in period
    taxes.forEach(tax => {
      if (tax.date >= filters.startDate && tax.date <= filters.endDate) {
        paidValues.push({
          id: `tax-${tax.id}`,
          date: tax.date,
          type: 'Pagamento de Imposto',
          description: `Imposto - ${tax.description}`,
          paymentMethod: tax.paymentMethod.replace('_', ' ').toUpperCase(),
          amount: tax.amount,
          reference: null,
          details: {
            taxType: tax.taxType,
            description: tax.description,
            documentNumber: tax.documentNumber,
            referencePeriod: tax.referencePeriod
          }
        });
      }
    });

    // Outstanding debts (unpaid)
    const outstandingDebts = debts.filter(debt => !debt.isPaid);

    // Outstanding receivables
    const outstandingReceivables = [];
    
    // Pending checks
    checks.forEach(check => {
      if (check.status === 'pendente' && !check.isOwnCheck && !check.isCompanyPayable) {
        const relatedSale = sales.find(s => s.id === check.saleId);
        outstandingReceivables.push({
          id: check.id,
          type: 'Cheque Pendente',
          client: check.client,
          amount: check.value,
          dueDate: check.dueDate,
          description: `Cheque - Parcela ${check.installmentNumber}/${check.totalInstallments}`,
          reference: relatedSale,
          details: {
            installment: `${check.installmentNumber}/${check.totalInstallments}`,
            usedFor: check.usedFor,
            relatedSale: relatedSale
          }
        });
      }
    });
    
    // Pending boletos
    boletos.forEach(boleto => {
      if (boleto.status === 'pendente' && !boleto.isCompanyPayable) {
        const relatedSale = sales.find(s => s.id === boleto.saleId);
        outstandingReceivables.push({
          id: boleto.id,
          type: 'Boleto Pendente',
          client: boleto.client,
          amount: boleto.value,
          dueDate: boleto.dueDate,
          description: `Boleto - Parcela ${boleto.installmentNumber}/${boleto.totalInstallments}`,
          reference: relatedSale,
          details: {
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
            relatedSale: relatedSale
          }
        });
      }
    });
    
    // Pending sales amounts
    sales.forEach(sale => {
      if (sale.pendingAmount > 0) {
        outstandingReceivables.push({
          id: sale.id,
          type: 'Venda Pendente',
          client: sale.client,
          amount: sale.pendingAmount,
          dueDate: sale.date,
          description: `Venda pendente`,
          reference: sale,
          details: {
            totalValue: sale.totalValue,
            receivedAmount: sale.receivedAmount,
            status: sale.status
          }
        });
      }
    });

    // Calculate totals
    const totalSales = periodSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = receivedValues.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = periodDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalPaid = paidValues.reduce((sum, item) => sum + item.amount, 0);
    const totalOutstandingDebts = outstandingDebts.reduce((sum, debt) => sum + debt.pendingAmount, 0);
    const totalOutstandingReceivables = outstandingReceivables.reduce((sum, item) => sum + item.amount, 0);

    return {
      periodSales: periodSales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      periodDebts: periodDebts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      receivedValues: receivedValues.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      paidValues: paidValues.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      outstandingDebts: outstandingDebts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      outstandingReceivables: outstandingReceivables.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      totals: {
        sales: totalSales,
        received: totalReceived,
        debts: totalDebts,
        paid: totalPaid,
        outstandingDebts: totalOutstandingDebts,
        outstandingReceivables: totalOutstandingReceivables,
        netResult: totalReceived - totalPaid,
        cashBalance: cashBalance?.currentBalance || 0
      }
    };
  }, [sales, debts, checks, boletos, employees, employeePayments, pixFees, taxes, cashBalance, filters]);

  const getRelatedInstallments = (item: any, type: 'sale' | 'debt') => {
    if (type === 'sale') {
      const saleChecks = checks.filter(c => c.saleId === item.id);
      const saleBoletos = boletos.filter(b => b.saleId === item.id);
      return { checks: saleChecks, boletos: saleBoletos };
    } else {
      const debtChecks = checks.filter(c => c.debtId === item.id);
      const debtBoletos = boletos.filter(b => b.debtId === item.id);
      return { checks: debtChecks, boletos: debtBoletos };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
      case 'compensado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'parcial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pendente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'vencido':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case 'dinheiro':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pix':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cartao credito':
      case 'cartao debito':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cheque':
      case 'cheque proprio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'boleto':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Report Header */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl print:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Relatório Financeiro Completo</h1>
              <p className="text-blue-700 font-semibold">
                Período: {formatDateForDisplay(filters.startDate)} até {formatDateForDisplay(filters.endDate)}
              </p>
              <p className="text-blue-600 text-sm">
                Gerado em: {new Date().toLocaleString('pt-BR')} • Sistema RevGold
              </p>
            </div>
          </div>
          <img 
            src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
            alt="RevGold Logo" 
            className="h-16 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Executive Summary */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-600">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Resumo Executivo</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <h3 className="font-bold text-green-900 mb-2">Vendas Realizadas</h3>
            <p className="text-2xl font-black text-green-700">{safeCurrency(reportData.totals.sales)}</p>
            <p className="text-sm text-green-600">{reportData.periodSales.length} venda(s)</p>
          </div>
          
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <h3 className="font-bold text-emerald-900 mb-2">Valores Recebidos</h3>
            <p className="text-2xl font-black text-emerald-700">{safeCurrency(reportData.totals.received)}</p>
            <p className="text-sm text-emerald-600">{reportData.receivedValues.length} recebimento(s)</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
            <h3 className="font-bold text-red-900 mb-2">Valores Pagos</h3>
            <p className="text-2xl font-black text-red-700">{safeCurrency(reportData.totals.paid)}</p>
            <p className="text-sm text-red-600">{reportData.paidValues.length} pagamento(s)</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Resultado Líquido</h3>
            <p className={`text-2xl font-black ${reportData.totals.netResult >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {reportData.totals.netResult >= 0 ? '+' : ''}{safeCurrency(reportData.totals.netResult)}
            </p>
            <p className="text-sm text-blue-600">Recebido - Pago</p>
          </div>
        </div>
      </div>

      {/* 1. ALL SALES */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-600">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">1. Todas as Vendas do Período</h2>
        </div>
        
        {reportData.periodSales.length > 0 ? (
          <div className="space-y-4">
            {reportData.periodSales.map(sale => {
              const installments = getRelatedInstallments(sale, 'sale');
              const seller = employees.find(e => e.id === sale.sellerId);
              
              return (
                <div key={sale.id} className="p-6 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-green-900">{sale.client}</h3>
                      <p className="text-green-700">Data: {formatDateForDisplay(sale.date)}</p>
                      {seller && <p className="text-green-700">Vendedor: {seller.name}</p>}
                      <p className="text-green-700">Produtos: {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-green-700">{safeCurrency(sale.totalValue)}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(sale.status)}`}>
                        {sale.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="mb-4">
                    <h4 className="font-bold text-green-900 mb-2">Métodos de Pagamento:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(sale.paymentMethods || []).map((method, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-green-100">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodBadge(method.type)}`}>
                              {method.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="font-bold text-green-700">{safeCurrency(method.amount)}</span>
                          </div>
                          {method.installments && method.installments > 1 && (
                            <p className="text-xs text-green-600 mt-1">
                              {method.installments}x de {safeCurrency(method.installmentValue || 0)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Related Installments */}
                  {(installments.checks.length > 0 || installments.boletos.length > 0) && (
                    <div className="border-t border-green-200 pt-4">
                      <h4 className="font-bold text-green-900 mb-3">Parcelas Relacionadas:</h4>
                      
                      {installments.checks.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-green-800 mb-2">Cheques ({installments.checks.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {installments.checks.map(check => (
                              <div key={check.id} className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-yellow-800">
                                    Parcela {check.installmentNumber}/{check.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-yellow-700">{safeCurrency(check.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-yellow-700">Venc: {formatDateForDisplay(check.dueDate)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(check.status)}`}>
                                    {check.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {installments.boletos.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-green-800 mb-2">Boletos ({installments.boletos.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {installments.boletos.map(boleto => (
                              <div key={boleto.id} className="p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-cyan-800">
                                    Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-cyan-700">{safeCurrency(boleto.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-cyan-700">Venc: {formatDateForDisplay(boleto.dueDate)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(boleto.status)}`}>
                                    {boleto.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="border-t border-green-200 pt-4 mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-green-600 font-semibold">Total</p>
                        <p className="text-lg font-bold text-green-800">{safeCurrency(sale.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-green-600 font-semibold">Recebido</p>
                        <p className="text-lg font-bold text-green-700">{safeCurrency(sale.receivedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-green-600 font-semibold">Pendente</p>
                        <p className="text-lg font-bold text-orange-600">{safeCurrency(sale.pendingAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="p-6 bg-green-100 rounded-xl border-2 border-green-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-900 mb-2">TOTAL DE TODAS AS VENDAS</h3>
                <p className="text-3xl font-black text-green-700">{safeCurrency(reportData.totals.sales)}</p>
                <p className="text-green-600 font-semibold">{reportData.periodSales.length} venda(s) no período</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-green-600 font-semibold">Nenhuma venda no período selecionado</p>
          </div>
        )}
      </div>

      {/* 2. ALL DEBTS */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-red-600">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">2. Todas as Dívidas do Período</h2>
        </div>
        
        {reportData.periodDebts.length > 0 ? (
          <div className="space-y-4">
            {reportData.periodDebts.map(debt => {
              const installments = getRelatedInstallments(debt, 'debt');
              
              return (
                <div key={debt.id} className="p-6 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-red-900">{debt.company}</h3>
                      <p className="text-red-700">Data: {formatDateForDisplay(debt.date)}</p>
                      <p className="text-red-700">Descrição: {debt.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-red-700">{safeCurrency(debt.totalValue)}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${debt.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                        {debt.isPaid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="mb-4">
                    <h4 className="font-bold text-red-900 mb-2">Métodos de Pagamento:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(debt.paymentMethods || []).map((method, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-red-100">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodBadge(method.type)}`}>
                              {method.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="font-bold text-red-700">{safeCurrency(method.amount)}</span>
                          </div>
                          {method.installments && method.installments > 1 && (
                            <p className="text-xs text-red-600 mt-1">
                              {method.installments}x de {safeCurrency(method.installmentValue || 0)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Related Installments */}
                  {(installments.checks.length > 0 || installments.boletos.length > 0) && (
                    <div className="border-t border-red-200 pt-4">
                      <h4 className="font-bold text-red-900 mb-3">Parcelas Relacionadas:</h4>
                      
                      {installments.checks.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-red-800 mb-2">Cheques ({installments.checks.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {installments.checks.map(check => (
                              <div key={check.id} className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-yellow-800">
                                    Parcela {check.installmentNumber}/{check.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-yellow-700">{safeCurrency(check.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-yellow-700">Venc: {formatDateForDisplay(check.dueDate)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(check.status)}`}>
                                    {check.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {installments.boletos.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-red-800 mb-2">Boletos ({installments.boletos.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {installments.boletos.map(boleto => (
                              <div key={boleto.id} className="p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-cyan-800">
                                    Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-cyan-700">{safeCurrency(boleto.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-cyan-700">Venc: {formatDateForDisplay(boleto.dueDate)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(boleto.status)}`}>
                                    {boleto.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="border-t border-green-200 pt-4 mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-green-600 font-semibold">Total</p>
                        <p className="text-lg font-bold text-green-800">{safeCurrency(sale.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-green-600 font-semibold">Recebido</p>
                        <p className="text-lg font-bold text-green-700">{safeCurrency(sale.receivedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-green-600 font-semibold">Pendente</p>
                        <p className="text-lg font-bold text-orange-600">{safeCurrency(sale.pendingAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="p-6 bg-green-100 rounded-xl border-2 border-green-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-900 mb-2">TOTAL DE TODAS AS VENDAS</h3>
                <p className="text-3xl font-black text-green-700">{safeCurrency(reportData.totals.sales)}</p>
                <p className="text-green-600 font-semibold">{reportData.periodSales.length} venda(s) no período</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-green-600 font-semibold">Nenhuma venda no período selecionado</p>
          </div>
        )}
      </div>

      {/* 3. ALL DEBTS */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-red-600">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">3. Todas as Dívidas do Período</h2>
        </div>
        
        {reportData.periodDebts.length > 0 ? (
          <div className="space-y-4">
            {reportData.periodDebts.map(debt => {
              const installments = getRelatedInstallments(debt, 'debt');
              
              return (
                <div key={debt.id} className="p-6 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-red-900">{debt.company}</h3>
                      <p className="text-red-700">Data: {formatDateForDisplay(debt.date)}</p>
                      <p className="text-red-700">Descrição: {debt.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-red-700">{safeCurrency(debt.totalValue)}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${debt.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                        {debt.isPaid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="mb-4">
                    <h4 className="font-bold text-red-900 mb-2">Métodos de Pagamento:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(debt.paymentMethods || []).map((method, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-red-100">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodBadge(method.type)}`}>
                              {method.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="font-bold text-red-700">{safeCurrency(method.amount)}</span>
                          </div>
                          {method.installments && method.installments > 1 && (
                            <p className="text-xs text-red-600 mt-1">
                              {method.installments}x de {safeCurrency(method.installmentValue || 0)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Related Installments */}
                  {(installments.checks.length > 0 || installments.boletos.length > 0) && (
                    <div className="border-t border-red-200 pt-4">
                      <h4 className="font-bold text-red-900 mb-3">Parcelas Relacionadas:</h4>
                      
                      {installments.checks.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-red-800 mb-2">Cheques ({installments.checks.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {installments.checks.map(check => (
                              <div key={check.id} className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-yellow-800">
                                    Parcela {check.installmentNumber}/{check.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-yellow-700">{safeCurrency(check.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-yellow-700">Venc: {formatDateForDisplay(check.dueDate)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(check.status)}`}>
                                    {check.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {installments.boletos.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-red-800 mb-2">Boletos ({installments.boletos.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {installments.boletos.map(boleto => (
                              <div key={boleto.id} className="p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-cyan-800">
                                    Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-cyan-700">{safeCurrency(boleto.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-cyan-700">Venc: {formatDateForDisplay(boleto.dueDate)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(boleto.status)}`}>
                                    {boleto.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="border-t border-red-200 pt-4 mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-red-600 font-semibold">Total</p>
                        <p className="text-lg font-bold text-red-800">{safeCurrency(debt.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-red-600 font-semibold">Pago</p>
                        <p className="text-lg font-bold text-green-700">{safeCurrency(debt.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-red-600 font-semibold">Pendente</p>
                        <p className="text-lg font-bold text-orange-600">{safeCurrency(debt.pendingAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="p-6 bg-red-100 rounded-xl border-2 border-red-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-900 mb-2">TOTAL DE TODAS AS DÍVIDAS</h3>
                <p className="text-3xl font-black text-red-700">{safeCurrency(reportData.totals.debts)}</p>
                <p className="text-red-600 font-semibold">{reportData.periodDebts.length} dívida(s) no período</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-red-300" />
            <p className="text-red-600 font-semibold">Nenhuma dívida no período selecionado</p>
          </div>
        )}
      </div>

      {/* 4. ALL RECEIVED VALUES */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-emerald-600">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">4. Todos os Valores Recebidos</h2>
        </div>
        
        {reportData.receivedValues.length > 0 ? (
          <div className="space-y-3">
            {reportData.receivedValues.map(item => (
              <div key={item.id} className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                        item.type === 'Venda Instantânea' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        item.type === 'Cheque Compensado' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-cyan-100 text-cyan-800 border-cyan-200'
                      }`}>
                        {item.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodBadge(item.paymentMethod)}`}>
                        {item.paymentMethod}
                      </span>
                    </div>
                    <h4 className="font-bold text-emerald-900">{item.details.client}</h4>
                    <p className="text-emerald-700 text-sm">{item.description}</p>
                    <p className="text-emerald-600 text-xs">Data: {formatDateForDisplay(item.date)}</p>
                    {item.details.installment && (
                      <p className="text-emerald-600 text-xs">Parcela: {item.details.installment}</p>
                    )}
                    {item.details.seller && (
                      <p className="text-emerald-600 text-xs">Vendedor: {item.details.seller}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-700">{safeCurrency(item.amount)}</p>
                    {item.reference && (
                      <p className="text-xs text-emerald-600">
                        Ref: {item.reference.client || item.reference.company || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="p-6 bg-emerald-100 rounded-xl border-2 border-emerald-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-emerald-900 mb-2">TOTAL DE VALORES RECEBIDOS</h3>
                <p className="text-3xl font-black text-emerald-700">{safeCurrency(reportData.totals.received)}</p>
                <p className="text-emerald-600 font-semibold">{reportData.receivedValues.length} recebimento(s) no período</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
            <p className="text-emerald-600 font-semibold">Nenhum valor recebido no período selecionado</p>
          </div>
        )}
      </div>

      {/* 5. ALL PAID VALUES */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-red-600">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">5. Todos os Valores Pagos</h2>
        </div>
        
        {reportData.paidValues.length > 0 ? (
          <div className="space-y-3">
            {reportData.paidValues.map(item => (
              <div key={item.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                        item.type === 'Pagamento de Dívida' ? 'bg-red-100 text-red-800 border-red-200' :
                        item.type === 'Pagamento de Salário' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        item.type === 'Cheque Próprio Pago' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        {item.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodBadge(item.paymentMethod)}`}>
                        {item.paymentMethod}
                      </span>
                    </div>
                    <h4 className="font-bold text-red-900">
                      {item.details.company || item.details.employeeName || item.details.client || item.details.bank}
                    </h4>
                    <p className="text-red-700 text-sm">{item.description}</p>
                    <p className="text-red-600 text-xs">Data: {formatDateForDisplay(item.date)}</p>
                    {item.details.installment && (
                      <p className="text-red-600 text-xs">Parcela: {item.details.installment}</p>
                    )}
                    {item.details.position && (
                      <p className="text-red-600 text-xs">Cargo: {item.details.position}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-700">{safeCurrency(item.amount)}</p>
                    {item.reference && (
                      <p className="text-xs text-red-600">
                        Ref: {item.reference.company || item.reference.name || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="p-6 bg-red-100 rounded-xl border-2 border-red-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-900 mb-2">TOTAL DE VALORES PAGOS</h3>
                <p className="text-3xl font-black text-red-700">{safeCurrency(reportData.totals.paid)}</p>
                <p className="text-red-600 font-semibold">{reportData.paidValues.length} pagamento(s) no período</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingDown className="w-16 h-16 mx-auto mb-4 text-red-300" />
            <p className="text-red-600 font-semibold">Nenhum valor pago no período selecionado</p>
          </div>
        )}
      </div>

      {/* 6. OUTSTANDING DEBTS */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-orange-600">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">6. Dívidas Pendentes (A Pagar)</h2>
        </div>
        
        {reportData.outstandingDebts.length > 0 ? (
          <div className="space-y-4">
            {reportData.outstandingDebts.map(debt => {
              const installments = getRelatedInstallments(debt, 'debt');
              const pendingChecks = installments.checks.filter(c => c.status === 'pendente');
              const pendingBoletos = installments.boletos.filter(b => b.status === 'pendente');
              
              return (
                <div key={debt.id} className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-orange-900">{debt.company}</h3>
                      <p className="text-orange-700">Data: {formatDateForDisplay(debt.date)}</p>
                      <p className="text-orange-700">Descrição: {debt.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-orange-700">{safeCurrency(debt.pendingAmount)}</p>
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200">
                        PENDENTE
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="mb-4">
                    <h4 className="font-bold text-orange-900 mb-2">Métodos de Pagamento:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(debt.paymentMethods || []).map((method, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-orange-100">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodBadge(method.type)}`}>
                              {method.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="font-bold text-orange-700">{safeCurrency(method.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Installments */}
                  {(pendingChecks.length > 0 || pendingBoletos.length > 0) && (
                    <div className="border-t border-orange-200 pt-4">
                      <h4 className="font-bold text-orange-900 mb-3">Parcelas Pendentes:</h4>
                      
                      {pendingChecks.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-orange-800 mb-2">Cheques Pendentes ({pendingChecks.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pendingChecks.map(check => (
                              <div key={check.id} className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-yellow-800">
                                    Parcela {check.installmentNumber}/{check.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-yellow-700">{safeCurrency(check.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-yellow-700">Venc: {formatDateForDisplay(check.dueDate)}</span>
                                  <span className="px-1 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                                    PENDENTE
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {pendingBoletos.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-orange-800 mb-2">Boletos Pendentes ({pendingBoletos.length}):</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pendingBoletos.map(boleto => (
                              <div key={boleto.id} className="p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-cyan-800">
                                    Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                                  </span>
                                  <span className="text-xs font-bold text-cyan-700">{safeCurrency(boleto.value)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-cyan-700">Venc: {formatDateForDisplay(boleto.dueDate)}</span>
                                  <span className="px-1 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                                    PENDENTE
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="p-6 bg-emerald-100 rounded-xl border-2 border-emerald-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-emerald-900 mb-2">TOTAL DE VALORES RECEBIDOS</h3>
                <p className="text-3xl font-black text-emerald-700">{safeCurrency(reportData.totals.received)}</p>
                <p className="text-emerald-600 font-semibold">{reportData.receivedValues.length} recebimento(s) no período</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
            <p className="text-emerald-600 font-semibold">Nenhum valor recebido no período selecionado</p>
          </div>
        )}
      </div>

      {/* 7. OUTSTANDING RECEIVABLES */}
      <div className="card modern-shadow-xl print:shadow-none">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-600">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">7. Valores a Receber (Pendentes)</h2>
        </div>
        
        {reportData.outstandingReceivables.length > 0 ? (
          <div className="space-y-3">
            {reportData.outstandingReceivables.map(item => (
              <div key={item.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                        item.type === 'Cheque Pendente' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        item.type === 'Boleto Pendente' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                        'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <h4 className="font-bold text-green-900">{item.client}</h4>
                    <p className="text-green-700 text-sm">{item.description}</p>
                    <p className="text-green-600 text-xs">Vencimento: {formatDateForDisplay(item.dueDate)}</p>
                    {item.details.installment && (
                      <p className="text-green-600 text-xs">Parcela: {item.details.installment}</p>
                    )}
                    {item.reference && (
                      <p className="text-green-600 text-xs">
                        Venda Original: {formatDateForDisplay(item.reference.date)} - {safeCurrency(item.reference.totalValue || 0)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-green-700">{safeCurrency(item.amount)}</p>
                    <span className="px-2 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200">
                      PENDENTE
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="p-6 bg-green-100 rounded-xl border-2 border-green-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-900 mb-2">TOTAL A RECEBER</h3>
                <p className="text-3xl font-black text-green-700">{safeCurrency(reportData.totals.outstandingReceivables)}</p>
                <p className="text-green-600 font-semibold">{reportData.outstandingReceivables.length} item(s) pendente(s)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <p className="text-green-600 font-semibold">Nenhum valor a receber pendente!</p>
            <p className="text-green-500 text-sm mt-2">Todos os recebimentos estão em dia</p>
          </div>
        )}
      </div>

      {/* Final Summary */}
      <div className="card bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 border-blue-300 modern-shadow-xl print:shadow-none">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-blue-900">Resumo Final do Período</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
            <div className="p-3 rounded-xl bg-green-600 w-fit mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-blue-900 mb-2">Vendas Totais</h4>
            <p className="text-2xl font-black text-green-600">{safeCurrency(reportData.totals.sales)}</p>
            <p className="text-blue-600 text-sm">{reportData.periodSales.length} venda(s)</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
            <div className="p-3 rounded-xl bg-emerald-600 w-fit mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-blue-900 mb-2">Valores Recebidos</h4>
            <p className="text-2xl font-black text-emerald-600">{safeCurrency(reportData.totals.received)}</p>
            <p className="text-blue-600 text-sm">{reportData.receivedValues.length} recebimento(s)</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
            <div className="p-3 rounded-xl bg-red-600 w-fit mx-auto mb-4">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-blue-900 mb-2">Valores Pagos</h4>
            <p className="text-2xl font-black text-red-600">{safeCurrency(reportData.totals.paid)}</p>
            <p className="text-blue-600 text-sm">{reportData.paidValues.length} pagamento(s)</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
            <div className="p-3 rounded-xl bg-purple-600 w-fit mx-auto mb-4">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-blue-900 mb-2">Resultado Final</h4>
            <p className={`text-2xl font-black ${reportData.totals.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {reportData.totals.netResult >= 0 ? '+' : ''}{safeCurrency(reportData.totals.netResult)}
            </p>
            <p className="text-blue-600 text-sm">Saldo: {safeCurrency(reportData.totals.cashBalance)}</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-blue-700 font-semibold text-lg">
            📊 Relatório completo com todas as transações, parcelas e valores do período
          </p>
          <p className="text-blue-600 text-sm mt-2">
            Sistema RevGold - Gestão Empresarial Profissional
          </p>
        </div>
      </div>
    </div>
  );
}