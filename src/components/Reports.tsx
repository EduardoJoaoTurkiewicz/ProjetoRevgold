import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Receipt,
  CreditCard
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { ExportButtons } from './reports/ExportButtons';
import { ReceivablesReport } from './reports/ReceivablesReport';
import { PayablesReport } from './reports/PayablesReport';
import { ComprehensiveReport } from './reports/ComprehensiveReport';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function Reports() {
  const { 
    sales, 
    debts, 
    checks, 
    boletos, 
    employees, 
    employeePayments,
    pixFees,
    cashBalance,
    loading 
  } = useAppContext();

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    categories: [] as string[],
    methods: [] as string[],
    status: 'all',
    reportType: 'comprehensive' as 'summary' | 'comprehensive'
  });

  // Dados para gráfico de métodos de pagamento
  const paymentMethodsData = useMemo(() => {
    const methods: Record<string, number> = {};
    
    sales.forEach(sale => {
      (sale.paymentMethods || []).forEach(method => {
        const methodName = method.type.replace('_', ' ').toUpperCase();
        if (!methods[methodName]) {
          methods[methodName] = 0;
        }
        methods[methodName] += method.amount;
      });
    });
    
    return Object.entries(methods).map(([name, value]) => ({
      name,
      value,
      percentage: Object.values(methods).reduce((a, b) => a + b, 0) > 0 
        ? ((value / Object.values(methods).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
        : '0'
    })).filter(item => item.value > 0);
  }, [sales]);

  // Calculate report data based on filters
  const reportData = useMemo(() => {
    // Filter sales by period
    const periodSales = sales.filter(sale => 
      sale.date >= filters.startDate && sale.date <= filters.endDate
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

    // Checks compensated in period
    checks.forEach(check => {
      if (check.dueDate >= filters.startDate && check.dueDate <= filters.endDate && check.status === 'compensado') {
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

    // Boletos paid in period
    boletos.forEach(boleto => {
      if (boleto.dueDate >= filters.startDate && boleto.dueDate <= filters.endDate && boleto.status === 'compensado') {
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

    // Period debts
    const periodDebts = debts.filter(debt => 
      debt.date >= filters.startDate && debt.date <= filters.endDate
    );

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

    // Employee payments in period
    employeePayments.forEach(payment => {
      if (payment.paymentDate >= filters.startDate && payment.paymentDate <= filters.endDate) {
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
          details: {
            bank: fee.bank,
            transactionType: fee.transactionType,
            description: fee.description,
            relatedTransactionId: fee.relatedTransactionId
          }
        });
      }
    });

    // Calculate totals
    const totalSales = periodSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = receivedValues.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = periodDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalPaid = paidValues.reduce((sum, item) => sum + item.amount, 0);

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
        cashBalance: cashBalance?.currentBalance || 0
      }
    };
  }, [sales, debts, checks, boletos, employees, employeePayments, pixFees, cashBalance, filters]);

  // Chart data for financial flow
  const flowChartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Sales for this day
      const daySales = sales.filter(sale => sale.date === dateStr);
      const salesValue = daySales.reduce((sum, sale) => sum + sale.totalValue, 0);
      
      // Debts for this day
      const dayDebts = debts.filter(debt => debt.date === dateStr);
      const debtsValue = dayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
      
      last30Days.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: salesValue,
        dividas: debtsValue,
        lucro: salesValue - debtsValue
      });
    }
    
    return last30Days;
  }, [sales, debts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Relatórios Financeiros</h1>
            <p className="text-slate-600 text-lg">Análise completa do desempenho financeiro</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">Filtros do Relatório</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Data Inicial</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="form-label">Data Final</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="form-label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Tipo de Relatório</label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value as 'summary' | 'comprehensive' }))}
              className="input-field"
            >
              <option value="comprehensive">Completo (Recomendado)</option>
              <option value="summary">Resumo</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <ExportButtons filters={filters} data={reportData} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Vendas</h3>
              <p className="text-3xl font-black text-green-700">
                R$ {reportData.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                {reportData.sales.length} venda(s)
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-600">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-lg">Recebido</h3>
              <p className="text-3xl font-black text-emerald-700">
                R$ {reportData.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-emerald-600 font-semibold">
                Entradas efetivas
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Pago</h3>
              <p className="text-3xl font-black text-red-700">
                R$ {reportData.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-red-600 font-semibold">
                Saídas efetivas
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Resultado</h3>
              <p className={`text-3xl font-black ${
                (reportData.totals.received - reportData.totals.paid) >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {(reportData.totals.received - reportData.totals.paid) >= 0 ? '+' : ''}R$ {(reportData.totals.received - reportData.totals.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                Recebido - Pago
              </p>
            </div>
          </div>
        </div>
      </div>






      {/* Report Content */}
      {filters.reportType === 'comprehensive' ? (
        <ComprehensiveReport filters={filters} />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Financial Flow Chart */}
            <div className="card modern-shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-600">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Fluxo Financeiro (30 dias)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={flowChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      name === 'vendas' ? 'Vendas' : name === 'dividas' ? 'Dívidas' : 'Lucro'
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="vendas" fill="#10b981" name="Vendas" />
                  <Bar dataKey="dividas" fill="#ef4444" name="Dívidas" />
            {/* Payment Methods Distribution */}
            <div className="card modern-shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-purple-600">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Métodos de Pagamento</h3>
              </div>
              {paymentMethodsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={paymentMethodsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 font-medium">Nenhum dado de pagamento disponível</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Dados aparecerão aqui conforme as vendas forem registradas
                  </p>
                </div>
              )}
            </div>
          </div>
                  <Line dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro" />
          {/* Valores a Receber */}
          <ReceivablesReport />
                </BarChart>
          {/* Valores a Pagar */}
          <PayablesReport />
              </ResponsiveContainer>
          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Received Values */}
            <div className="card modern-shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Valores Recebidos</h3>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto modern-scrollbar">
                {reportData.receivedValues.slice(0, 10).map(item => (
                  <div key={item.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.type === 'Venda' ? 'bg-blue-100 text-blue-800' :
                            item.type === 'Cheque' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-cyan-100 text-cyan-800'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <h4 className="font-bold text-green-900">{item.details.client}</h4>
                        <p className="text-sm text-green-700">{item.description}</p>
                        <p className="text-xs text-green-600">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-green-700">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
            {/* Paid Values */}
            <div className="card modern-shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-600">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Valores Pagos</h3>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto modern-scrollbar">
                {reportData.paidValues.slice(0, 10).map(item => (
                  <div key={item.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.type === 'Dívida' ? 'bg-red-100 text-red-800' :
                            item.type === 'Salário' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <h4 className="font-bold text-red-900">
                          {item.details.company || item.details.employeeName || item.details.bank}
                        </h4>
                        <p className="text-sm text-red-700">{item.description}</p>
                        <p className="text-xs text-red-600">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-red-700">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}