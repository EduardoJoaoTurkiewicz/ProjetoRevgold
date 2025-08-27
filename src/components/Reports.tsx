import React, { useState, useMemo } from 'react';
import { FileText, TrendingUp, Calendar, DollarSign, Filter, Eye, ArrowUpCircle, ArrowDownCircle, CreditCard, Receipt, Users, Building2, Clock, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportReportToPDF } from '../utils/pdfExport';

export default function Reports() {
  const { 
    sales, 
    debts, 
    checks, 
    boletos, 
    employees, 
    employeeCommissions,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    pixFees,
    cashBalance,
    cashTransactions
  } = useApp();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primeiro dia do mês atual
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'dinheiro': return 'bg-green-100 text-green-800 border-green-200';
      case 'pix': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cartao_credito': 
      case 'cartão de crédito': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cartao_debito':
      case 'cartão de débito': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cheque': 
      case 'cheque próprio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'boleto': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'transferencia': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Filtrar dados por período
  const filteredData = useMemo(() => {
    // Vendas do período
    const periodSales = sales.filter(sale => 
      sale.date >= startDate && sale.date <= endDate
    );

    // Valores efetivamente recebidos no período
    const receivedValues = [];
    
    // 1. Vendas com pagamento instantâneo no período
    periodSales.forEach(sale => {
      (sale.paymentMethods || []).forEach((method, methodIndex) => {
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
            (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
          receivedValues.push({
            id: `sale-${sale.id}-${methodIndex}`,
            date: sale.date,
            type: 'Venda',
            description: `Venda - ${sale.client}`,
            paymentMethod: method.type.replace('_', ' ').toUpperCase(),
            amount: method.amount,
            details: {
              saleId: sale.id,
              client: sale.client,
              products: sale.products,
              totalSaleValue: sale.totalValue,
              seller: sale.sellerId ? employees.find(e => e.id === sale.sellerId)?.name : 'N/A'
            }
          });
        }
      });
    });

    // 2. Cheques compensados no período
    checks.forEach(check => {
      if (check.dueDate >= startDate && check.dueDate <= endDate && check.status === 'compensado') {
        receivedValues.push({
          id: `check-${check.id}`,
          date: check.dueDate,
          type: 'Cheque',
          description: `Cheque compensado - ${check.client}`,
          paymentMethod: 'CHEQUE',
          amount: check.value,
          details: {
            checkId: check.id,
            client: check.client,
            dueDate: check.dueDate,
            installment: check.installmentNumber && check.totalInstallments ? 
              `${check.installmentNumber}/${check.totalInstallments}` : 'Único',
            usedFor: check.usedFor,
            isOwnCheck: check.isOwnCheck
          }
        });
      }
    });

    // 3. Boletos pagos no período
    boletos.forEach(boleto => {
      if (boleto.dueDate >= startDate && boleto.dueDate <= endDate && boleto.status === 'compensado') {
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        
        receivedValues.push({
          id: `boleto-${boleto.id}`,
          date: boleto.dueDate,
          type: 'Boleto',
          description: `Boleto pago - ${boleto.client}`,
          paymentMethod: 'BOLETO',
          amount: netReceived,
          details: {
            boletoId: boleto.id,
            client: boleto.client,
            originalValue: boleto.value,
            finalAmount: finalAmount,
            notaryCosts: notaryCosts,
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
            overdueAction: boleto.overdueAction
          }
        });
      }
    });

    // Dívidas feitas no período
    const periodDebts = debts.filter(debt => 
      debt.date >= startDate && debt.date <= endDate
    );

    // Valores efetivamente pagos no período
    const paidValues = [];

    // 1. Dívidas pagas no período
    periodDebts.forEach(debt => {
      if (debt.isPaid) {
        (debt.paymentMethods || []).forEach((method, methodIndex) => {
          if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            paidValues.push({
              id: `debt-${debt.id}-${methodIndex}`,
              date: debt.date,
              type: 'Dívida',
              description: `Pagamento - ${debt.company}`,
              paymentMethod: method.type.replace('_', ' ').toUpperCase(),
              amount: method.amount,
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

    // 2. Cheques próprios pagos no período
    checks.forEach(check => {
      if (check.isOwnCheck && check.dueDate >= startDate && check.dueDate <= endDate && check.status === 'compensado') {
        paidValues.push({
          id: `own-check-${check.id}`,
          date: check.dueDate,
          type: 'Cheque Próprio',
          description: `Cheque próprio pago - ${check.client}`,
          paymentMethod: 'CHEQUE PRÓPRIO',
          amount: check.value,
          details: {
            checkId: check.id,
            client: check.client,
            usedFor: check.usedFor,
            installment: check.installmentNumber && check.totalInstallments ? 
              `${check.installmentNumber}/${check.totalInstallments}` : 'Único'
          }
        });
      }
    });

    // 3. Pagamentos de funcionários no período
    employeePayments.forEach(payment => {
      if (payment.paymentDate >= startDate && payment.paymentDate <= endDate) {
        const employee = employees.find(e => e.id === payment.employeeId);
        paidValues.push({
          id: `employee-payment-${payment.id}`,
          date: payment.paymentDate,
          type: 'Salário',
          description: `Pagamento de salário - ${employee?.name || 'Funcionário'}`,
          paymentMethod: 'DINHEIRO',
          amount: payment.amount,
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

    // 4. Tarifas PIX no período
    pixFees.forEach(fee => {
      if (fee.date >= startDate && fee.date <= endDate) {
        paidValues.push({
          id: `pix-fee-${fee.id}`,
          date: fee.date,
          type: 'Tarifa PIX',
          description: `Tarifa PIX - ${fee.bank}`,
          paymentMethod: 'PIX',
          amount: fee.amount,
          details: {
            bank: fee.bank,
            transactionType: fee.transactionType,
            description: fee.description,
            relatedTransactionId: fee.relatedTransactionId
          }
        });
      }
    });

    // Calcular totais
    const totalSales = periodSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = receivedValues.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = periodDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalPaid = paidValues.reduce((sum, item) => sum + item.amount, 0);

    // Calcular saldo do caixa no final do período
    const endDateCashBalance = cashBalance?.currentBalance || 0;

    return {
      sales: periodSales,
      receivedValues: receivedValues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      debts: periodDebts,
      paidValues: paidValues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totals: {
        sales: totalSales,
        received: totalReceived,
        debts: totalDebts,
        paid: totalPaid,
        cashBalance: endDateCashBalance
      }
    };
  }, [sales, debts, checks, boletos, employees, employeePayments, pixFees, cashBalance, startDate, endDate]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 modern-shadow-xl">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-600 text-lg">Análise detalhada dos dados do negócio</p>
        </div>
        <button
          onClick={() => exportReportToPDF(filteredData, startDate, endDate)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg ml-auto"
        >
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
      </div>

      {/* Filtro de Período */}
      <div className="card modern-shadow-xl" id="report-content">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-blue-600">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Filtro de Período</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-4">Resumo do Período Selecionado</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-blue-600 font-semibold">Período</p>
              <p className="text-lg font-bold text-blue-800">
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
              </p>
            </div>
            <div>
              <p className="text-blue-600 font-semibold">Vendas</p>
              <p className="text-lg font-bold text-green-600">
                {filteredData.sales.length}
              </p>
            </div>
            <div>
              <p className="text-blue-600 font-semibold">Dívidas</p>
              <p className="text-lg font-bold text-red-600">
                {filteredData.debts.length}
              </p>
            </div>
            <div>
              <p className="text-blue-600 font-semibold">Saldo Final</p>
              <p className="text-lg font-bold text-blue-600">
                R$ {filteredData.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Observação Detalhada */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Observação Detalhada</h2>
            <p className="text-slate-600 text-lg">
              Período: {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {/* 1. VENDAS */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-600">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900">1. VENDAS</h3>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold">
                {filteredData.sales.length} venda(s)
              </span>
            </div>

            {filteredData.sales.length > 0 ? (
              <div className="space-y-4">
                {filteredData.sales.map(sale => (
                  <div key={sale.id} className="p-6 bg-green-50 rounded-2xl border border-green-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xl font-bold text-green-900 mb-3">{sale.client}</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Data:</strong> {new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                          {sale.deliveryDate && (
                            <p><strong>Data de Entrega:</strong> {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}</p>
                          )}
                          <p><strong>Produtos:</strong> {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}</p>
                          {sale.sellerId && (
                            <p><strong>Vendedor:</strong> {employees.find(e => e.id === sale.sellerId)?.name || 'N/A'}</p>
                          )}
                          <p><strong>Status:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                              sale.status === 'pago' ? 'bg-green-200 text-green-800' :
                              sale.status === 'parcial' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {sale.status.toUpperCase()}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="mb-4">
                          <h5 className="font-bold text-green-800 mb-2">Valores</h5>
                          <div className="space-y-1 text-sm">
                            <p><strong>Total:</strong> R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Recebido:</strong> R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Pendente:</strong> R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-bold text-green-800 mb-2">Formas de Pagamento</h5>
                          <div className="space-y-2">
                            {(sale.paymentMethods || []).map((method, index) => (
                              <div key={index} className="p-3 bg-white rounded-xl border border-green-100">
                                <div className="flex justify-between items-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(method.type)}`}>
                                    {method.type.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span className="font-bold text-green-600">
                                    R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {method.installments && method.installments > 1 && (
                                  <div className="text-xs text-green-600 mt-1 font-semibold">
                                    {method.installments}x de R$ {(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    {method.installmentInterval && ` (${method.installmentInterval} dias)`}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {sale.observations && (
                      <div className="mt-4 p-4 bg-white rounded-xl border border-green-100">
                        <h5 className="font-bold text-green-800 mb-2">Observações</h5>
                        <p className="text-sm text-green-700">{sale.observations}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border-2 border-green-300">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-green-900 mb-2">TOTAL DE VENDAS</h4>
                    <p className="text-4xl font-black text-green-700">
                      R$ {filteredData.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-green-50 rounded-2xl">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-300" />
                <p className="text-green-600 font-medium">Nenhuma venda no período selecionado</p>
              </div>
            )}
          </div>

          {/* 2. VALOR RECEBIDO */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-600">
                <ArrowUpCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-900">2. VALOR RECEBIDO</h3>
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                {filteredData.receivedValues.length} recebimento(s)
              </span>
            </div>

            {filteredData.receivedValues.length > 0 ? (
              <div className="space-y-4">
                {filteredData.receivedValues.map(item => (
                  <div key={item.id} className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            item.type === 'Venda' ? 'bg-green-100 text-green-800 border-green-200' :
                            item.type === 'Cheque' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {item.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(item.paymentMethod)}`}>
                            {item.paymentMethod}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-emerald-900">{item.description}</h4>
                        <p className="text-sm text-emerald-700">
                          Data: {new Date(item.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-emerald-600">
                          R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {item.type === 'Venda' && (
                        <>
                          <div>
                            <p><strong>Cliente:</strong> {item.details.client}</p>
                            <p><strong>Produtos:</strong> {item.details.products}</p>
                            <p><strong>Valor Total da Venda:</strong> R$ {item.details.totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p><strong>Vendedor:</strong> {item.details.seller}</p>
                            <p><strong>ID da Venda:</strong> <span className="font-mono text-xs">{item.details.saleId}</span></p>
                          </div>
                        </>
                      )}
                      
                      {item.type === 'Cheque' && (
                        <>
                          <div>
                            <p><strong>Cliente:</strong> {item.details.client}</p>
                            <p><strong>Parcela:</strong> {item.details.installment}</p>
                            <p><strong>Tipo:</strong> {item.details.isOwnCheck ? 'Cheque Próprio' : 'Cheque de Terceiros'}</p>
                          </div>
                          <div>
                            <p><strong>Usado em:</strong> {item.details.usedFor}</p>
                            <p><strong>ID do Cheque:</strong> <span className="font-mono text-xs">{item.details.checkId}</span></p>
                          </div>
                        </>
                      )}
                      
                      {item.type === 'Boleto' && (
                        <>
                          <div>
                            <p><strong>Cliente:</strong> {item.details.client}</p>
                            <p><strong>Parcela:</strong> {item.details.installment}</p>
                            <p><strong>Valor Original:</strong> R$ {item.details.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            {item.details.finalAmount !== item.details.originalValue && (
                              <p><strong>Valor Final:</strong> R$ {item.details.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            )}
                            {item.details.notaryCosts > 0 && (
                              <p><strong>Custos de Cartório:</strong> R$ {item.details.notaryCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            )}
                            {item.details.overdueAction && (
                              <p><strong>Situação:</strong> {item.details.overdueAction.replace('_', ' ')}</p>
                            )}
                            <p><strong>ID do Boleto:</strong> <span className="font-mono text-xs">{item.details.boletoId}</span></p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="p-6 bg-gradient-to-r from-emerald-100 to-green-100 rounded-2xl border-2 border-emerald-300">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-emerald-900 mb-2">TOTAL RECEBIDO</h4>
                    <p className="text-4xl font-black text-emerald-700">
                      R$ {filteredData.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-emerald-50 rounded-2xl">
                <ArrowUpCircle className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                <p className="text-emerald-600 font-medium">Nenhum valor recebido no período selecionado</p>
              </div>
            )}
          </div>

          {/* 3. DÍVIDAS FEITAS */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-600">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-red-900">3. DÍVIDAS FEITAS</h3>
              <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-bold">
                {filteredData.debts.length} dívida(s)
              </span>
            </div>

            {filteredData.debts.length > 0 ? (
              <div className="space-y-4">
                {filteredData.debts.map(debt => (
                  <div key={debt.id} className="p-6 bg-red-50 rounded-2xl border border-red-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xl font-bold text-red-900 mb-3">{debt.company}</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Data:</strong> {new Date(debt.date).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Descrição:</strong> {debt.description}</p>
                          <p><strong>Status:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                              debt.isPaid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {debt.isPaid ? 'PAGO' : 'PENDENTE'}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="mb-4">
                          <h5 className="font-bold text-red-800 mb-2">Valores</h5>
                          <div className="space-y-1 text-sm">
                            <p><strong>Total:</strong> R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Pago:</strong> R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Pendente:</strong> R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-bold text-red-800 mb-2">Como será/foi pago</h5>
                          <div className="space-y-2">
                            {(debt.paymentMethods || []).map((method, index) => (
                              <div key={index} className="p-2 bg-white rounded-lg border border-red-100">
                                <div className="flex justify-between items-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(method.type)}`}>
                                    {method.type.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span className="font-bold text-red-600">
                                    R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {method.installments && method.installments > 1 && (
                                  <div className="text-xs text-red-600 mt-1 font-semibold">
                                    {method.installments}x de R$ {(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(debt.paymentDescription || debt.debtPaymentDescription) && (
                      <div className="mt-4 p-4 bg-white rounded-xl border border-red-100">
                        <h5 className="font-bold text-red-800 mb-2">Descrições Adicionais</h5>
                        {debt.paymentDescription && (
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Pagamento:</strong> {debt.paymentDescription}
                          </p>
                        )}
                        {debt.debtPaymentDescription && (
                          <p className="text-sm text-red-700">
                            <strong>Dívida:</strong> {debt.debtPaymentDescription}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {debt.checksUsed && debt.checksUsed.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h5 className="font-bold text-blue-800 mb-2">Cheques Utilizados</h5>
                        <div className="space-y-2">
                          {debt.checksUsed.map(checkId => {
                            const check = checks.find(c => c.id === checkId);
                            return check ? (
                              <div key={checkId} className="text-sm text-blue-700">
                                <p><strong>{check.client}:</strong> R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                                   (Venc: {new Date(check.dueDate).toLocaleDateString('pt-BR')})</p>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="p-6 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl border-2 border-red-300">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-red-900 mb-2">TOTAL DE DÍVIDAS</h4>
                    <p className="text-4xl font-black text-red-700">
                      R$ {filteredData.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-red-50 rounded-2xl">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-red-300" />
                <p className="text-red-600 font-medium">Nenhuma dívida no período selecionado</p>
              </div>
            )}
          </div>

          {/* 4. TOTAL PAGO */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-600">
                <ArrowDownCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-orange-900">4. TOTAL PAGO</h3>
              <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-bold">
                {filteredData.paidValues.length} pagamento(s)
              </span>
            </div>

            {filteredData.paidValues.length > 0 ? (
              <div className="space-y-4">
                {filteredData.paidValues.map(item => (
                  <div key={item.id} className="p-6 bg-orange-50 rounded-2xl border border-orange-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            item.type === 'Dívida' ? 'bg-red-100 text-red-800 border-red-200' :
                            item.type === 'Cheque Próprio' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            item.type === 'Salário' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {item.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(item.paymentMethod)}`}>
                            {item.paymentMethod}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-orange-900">{item.description}</h4>
                        <p className="text-sm text-orange-700">
                          Data: {new Date(item.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-orange-600">
                          R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {item.type === 'Dívida' && (
                        <>
                          <div>
                            <p><strong>Empresa:</strong> {item.details.company}</p>
                            <p><strong>Descrição:</strong> {item.details.description}</p>
                            <p><strong>Valor Total da Dívida:</strong> R$ {item.details.totalDebtValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p><strong>Valor Pago:</strong> R$ {item.details.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Valor Pendente:</strong> R$ {item.details.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p><strong>ID da Dívida:</strong> <span className="font-mono text-xs">{item.details.debtId}</span></p>
                          </div>
                        </>
                      )}
                      
                      {item.type === 'Cheque Próprio' && (
                        <>
                          <div>
                            <p><strong>Cliente:</strong> {item.details.client}</p>
                            <p><strong>Parcela:</strong> {item.details.installment}</p>
                          </div>
                          <div>
                            <p><strong>Usado em:</strong> {item.details.usedFor}</p>
                            <p><strong>ID do Cheque:</strong> <span className="font-mono text-xs">{item.details.checkId}</span></p>
                          </div>
                        </>
                      )}
                      
                      {item.type === 'Salário' && (
                        <>
                          <div>
                            <p><strong>Funcionário:</strong> {item.details.employeeName}</p>
                            <p><strong>Cargo:</strong> {item.details.position}</p>
                          </div>
                          <div>
                            {item.details.observations && (
                              <p><strong>Observações:</strong> {item.details.observations}</p>
                            )}
                            {item.details.receipt && (
                              <p><strong>Recibo:</strong> ✓ Anexado</p>
                            )}
                            <p><strong>ID do Funcionário:</strong> <span className="font-mono text-xs">{item.details.employeeId}</span></p>
                          </div>
                        </>
                      )}
                      
                      {item.type === 'Tarifa PIX' && (
                        <>
                          <div>
                            <p><strong>Banco:</strong> {item.details.bank}</p>
                            <p><strong>Tipo:</strong> {item.details.transactionType.replace('_', ' ').toUpperCase()}</p>
                          </div>
                          <div>
                            <p><strong>Descrição:</strong> {item.details.description}</p>
                            {item.details.relatedTransactionId && (
                              <p><strong>Transação Relacionada:</strong> <span className="font-mono text-xs">{item.details.relatedTransactionId}</span></p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl border-2 border-orange-300">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-orange-900 mb-2">TOTAL PAGO</h4>
                    <p className="text-4xl font-black text-orange-700">
                      R$ {filteredData.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-orange-50 rounded-2xl">
                <ArrowDownCircle className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                <p className="text-orange-600 font-medium">Nenhum pagamento no período selecionado</p>
              </div>
            )}
          </div>

          {/* RESUMO FINAL */}
          <div className="p-8 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-3xl border-2 border-blue-300 modern-shadow-xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-blue-900 mb-4">RESUMO FINAL DO PERÍODO</h3>
              <p className="text-blue-700 font-semibold text-lg">
                {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Vendas Realizadas</h4>
                <p className="text-3xl font-black text-green-600">
                  R$ {filteredData.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-600 mt-1">{filteredData.sales.length} venda(s)</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Valores Recebidos</h4>
                <p className="text-3xl font-black text-emerald-600">
                  R$ {filteredData.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-600 mt-1">{filteredData.receivedValues.length} recebimento(s)</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Dívidas Feitas</h4>
                <p className="text-3xl font-black text-red-600">
                  R$ {filteredData.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-600 mt-1">{filteredData.debts.length} dívida(s)</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-2xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Valores Pagos</h4>
                <p className="text-3xl font-black text-orange-600">
                  R$ {filteredData.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-600 mt-1">{filteredData.paidValues.length} pagamento(s)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border-2 border-green-300">
                <h4 className="font-bold text-green-900 mb-2">RESULTADO LÍQUIDO</h4>
                <p className={`text-4xl font-black ${
                  (filteredData.totals.received - filteredData.totals.paid) >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {(filteredData.totals.received - filteredData.totals.paid) >= 0 ? '+' : ''}R$ {(filteredData.totals.received - filteredData.totals.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-600 mt-1">Recebido - Pago</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border-2 border-blue-300">
                <h4 className="font-bold text-blue-900 mb-2">SALDO FINAL DO CAIXA</h4>
                <p className="text-4xl font-black text-blue-700">
                  R$ {filteredData.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Em {new Date(endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relatórios Rápidos */}
      <div className="card modern-shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Rápidos</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Relatório de Vendas</h3>
              <p className="text-sm text-gray-600">Análise detalhada das vendas por período</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Gerar
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Relatório Financeiro</h3>
              <p className="text-sm text-gray-600">Resumo das movimentações financeiras</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Gerar
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Relatório de Funcionários</h3>
              <p className="text-sm text-gray-600">Dados sobre funcionários e folha de pagamento</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Gerar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}