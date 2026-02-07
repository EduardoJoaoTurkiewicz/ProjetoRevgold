import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Building2,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  Activity,
  User,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { fmtBRL, fmtDate, fmtDateTime, nowBR, formatNumber } from '../../utils/format';
import { DetailedTransactionTable } from './DetailedTransactionTable';
import '../../styles/print.css';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

interface ComprehensiveReportProps {
  filters: {
    startDate: string;
    endDate: string;
    categories?: string[];
    methods?: string[];
    status?: string;
    reportType?: string;
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
    cashBalance,
    loading 
  } = useAppContext();

  // Calculate comprehensive report data
  const reportData = useMemo(() => {
    // Filter sales by period
    const periodSales = sales.filter(sale => 
      sale.date >= filters.startDate && sale.date <= filters.endDate
    );

    // Calculate received values
    const receivedValues = [];
    
    // Sales with instant payment
    periodSales.forEach(sale => {
      if (!sale.paymentMethods || !Array.isArray(sale.paymentMethods)) {
        return; // Skip sales without valid payment methods
      }
      
      (sale.paymentMethods || []).forEach((method, methodIndex) => {
        if (!method || typeof method !== 'object') {
          return; // Skip invalid payment methods
        }
        
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
            (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
          receivedValues.push({
            id: `sale-${sale.id}-${methodIndex}`,
            date: sale.date,
            type: 'Venda',
            description: `Venda - ${sale.client}`,
            paymentMethod: method.type.replace('_', ' ').toUpperCase(),
            amount: Number(method.amount) || 0,
            details: {
              saleId: sale.id,
              client: sale.client,
              products: sale.products,
              totalSaleValue: Number(sale.totalValue) || 0,
              seller: sale.sellerId ? employees.find(e => e.id === sale.sellerId)?.name : 'N/A'
            }
          });
        }
      });
    });

    // Checks compensated in period
    checks.forEach(check => {
      if (!check || typeof check !== 'object') {
        return; // Skip invalid checks
      }
      
      if (check.dueDate >= filters.startDate && check.dueDate <= filters.endDate && check.status === 'compensado') {
        receivedValues.push({
          id: `check-${check.id}`,
          date: check.dueDate,
          type: 'Cheque',
          description: `Cheque compensado - ${check.client}`,
          paymentMethod: 'CHEQUE',
          amount: Number(check.value) || 0,
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
      if (!boleto || typeof boleto !== 'object') {
        return; // Skip invalid boletos
      }
      
      if (boleto.dueDate >= filters.startDate && boleto.dueDate <= filters.endDate && boleto.status === 'compensado') {
        const finalAmount = Number(boleto.finalAmount) || Number(boleto.value) || 0;
        const notaryCosts = Number(boleto.notaryCosts) || 0;
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
            originalValue: Number(boleto.value) || 0,
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
      if (!debt || typeof debt !== 'object') {
        return; // Skip invalid debts
      }
      
      if (debt.isPaid) {
        if (!debt.paymentMethods || !Array.isArray(debt.paymentMethods)) {
          return; // Skip debts without valid payment methods
        }
        
        (debt.paymentMethods || []).forEach((method, methodIndex) => {
          if (!method || typeof method !== 'object') {
            return; // Skip invalid payment methods
          }
          
          if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            paidValues.push({
              id: `debt-${debt.id}-${methodIndex}`,
              date: debt.date,
              type: 'Dívida',
              description: `Pagamento - ${debt.company}`,
              paymentMethod: method.type.replace('_', ' ').toUpperCase(),
              amount: Number(method.amount) || 0,
              details: {
                debtId: debt.id,
                company: debt.company,
                description: debt.description,
                totalDebtValue: Number(debt.totalValue) || 0,
                paidAmount: Number(debt.paidAmount) || 0,
                pendingAmount: Number(debt.pendingAmount) || 0
              }
            });
          }
        });
      }
    });

    // Own checks paid in period
    checks.forEach(check => {
      if (check.isOwnCheck && check.dueDate >= filters.startDate && check.dueDate <= filters.endDate && check.status === 'compensado') {
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

    // Employee payments in period
    employeePayments.forEach(payment => {
      if (!payment || typeof payment !== 'object') {
        return; // Skip invalid payments
      }
      
      if (payment.paymentDate >= filters.startDate && payment.paymentDate <= filters.endDate) {
        const employee = employees.find(e => e.id === payment.employeeId);
        paidValues.push({
          id: `employee-payment-${payment.id}`,
          date: payment.paymentDate,
          type: 'Salário',
          description: `Pagamento de salário - ${employee?.name || 'Funcionário'}`,
          paymentMethod: 'DINHEIRO',
          amount: Number(payment.amount) || 0,
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
      if (!fee || typeof fee !== 'object') {
        return; // Skip invalid fees
      }
      
      if (fee.date >= filters.startDate && fee.date <= filters.endDate) {
        paidValues.push({
          id: `pix-fee-${fee.id}`,
          date: fee.date,
          type: 'Tarifa PIX',
          description: `Tarifa PIX - ${fee.bank}`,
          paymentMethod: 'PIX',
          amount: Number(fee.amount) || 0,
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
    const totalSales = periodSales.reduce((sum, sale) => sum + (Number(sale.totalValue) || 0), 0);
    const totalReceived = receivedValues.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDebts = periodDebts.reduce((sum, debt) => sum + (Number(debt.totalValue) || 0), 0);
    const totalPaid = paidValues.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

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
        cashBalance: Number(cashBalance?.currentBalance) || 0
      }
    };
  }, [sales, debts, checks, boletos, employees, employeePayments, pixFees, cashBalance, filters]);

  // Calculate additional metrics
  const metrics = useMemo(() => {
    const netResult = reportData.totals.received - reportData.totals.paid;
    const periodDays = Math.ceil(
      (new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    // Group by categories
    const categoryTotals = {};
    [...reportData.receivedValues, ...reportData.paidValues].forEach(item => {
      const category = item.type || 'Outros';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { entrada: 0, saida: 0 };
      }
      
      if (reportData.receivedValues.includes(item)) {
        categoryTotals[category].entrada += item.amount;
      } else {
        categoryTotals[category].saida += item.amount;
      }
    });
    
    // Group by payment methods
    const methodTotals = {};
    [...reportData.receivedValues, ...reportData.paidValues].forEach(item => {
      const method = item.paymentMethod || 'Não especificado';
      if (!methodTotals[method]) {
        methodTotals[method] = 0;
      }
      methodTotals[method] += item.amount;
    });
    
    // Group by date for daily breakdown
    const dailyTotals = {};
    [...reportData.receivedValues, ...reportData.paidValues].forEach(item => {
      const date = item.date;
      if (!dailyTotals[date]) {
        dailyTotals[date] = { entrada: 0, saida: 0 };
      }
      
      if (reportData.receivedValues.includes(item)) {
        dailyTotals[date].entrada += item.amount;
      } else {
        dailyTotals[date].saida += item.amount;
      }
    });
    
    return {
      netResult,
      periodDays,
      categoryTotals: Object.entries(categoryTotals)
        .map(([name, values]: [string, any]) => ({
          name,
          entrada: values.entrada,
          saida: values.saida,
          total: values.entrada - values.saida
        }))
        .sort((a, b) => Math.abs(b.total) - Math.abs(a.total)),
      methodTotals: Object.entries(methodTotals)
        .map(([name, value]: [string, any]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      dailyTotals: Object.entries(dailyTotals)
        .map(([date, values]: [string, any]) => ({
          date,
          entrada: values.entrada,
          saida: values.saida,
          saldo: values.entrada - values.saida
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  }, [reportData, filters]);

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

  // Payment methods data for pie chart
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    
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
      percentage: ((value / Object.values(methods).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    })).filter(item => item.value > 0);
  }, [sales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 print-container">
      {/* Print Header */}
      <div className="print-card company-header avoid-break-inside">
        <div>
          <h1 className="report-title">Relatório Financeiro Completo Montreal Tintas</h1>
          <p className="report-subtitle">
            Período: {fmtDate(filters.startDate)} até {fmtDate(filters.endDate)}
          </p>
          <div className="subtle" style={{ marginTop: '12px' }}>
            <div>Gerado em: {nowBR()}</div>
            <div>Usuário: Sistema Montreal Tintas</div>
            <div>Período: {metrics.periodDays} dias</div>
          </div>
        </div>
        <img
          src="/image-removebg-preview_(8).png"
          alt="Montreal Tintas Logo"
          className="company-logo"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Executive Summary */}
      <div className="section-spacing avoid-break-inside">
        <h2 className="section-title">SUMÁRIO EXECUTIVO</h2>
        
        <div className="print-grid-4">
          <div className="metric-card">
            <div className="metric-label">Vendas Realizadas</div>
            <div className="metric-value metric-green">{fmtBRL(reportData.totals.sales)}</div>
            <div className="subtle">{reportData.sales.length} venda(s)</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Valores Recebidos</div>
            <div className="metric-value metric-green">{fmtBRL(reportData.totals.received)}</div>
            <div className="subtle">{reportData.receivedValues.length} recebimento(s)</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Dívidas Feitas</div>
            <div className="metric-value metric-red">{fmtBRL(reportData.totals.debts)}</div>
            <div className="subtle">{reportData.debts.length} dívida(s)</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Valores Pagos</div>
            <div className="metric-value metric-red">{fmtBRL(reportData.totals.paid)}</div>
            <div className="subtle">{reportData.paidValues.length} pagamento(s)</div>
          </div>
        </div>

        <div className="print-grid-2" style={{ marginTop: '20px' }}>
          <div className="metric-card bg-green-light">
            <div className="metric-label">Resultado Líquido</div>
            <div className={`metric-value ${metrics.netResult >= 0 ? 'metric-green' : 'metric-red'}`}>
              {metrics.netResult >= 0 ? '+' : ''}{fmtBRL(metrics.netResult)}
            </div>
            <div className="subtle">Recebido - Pago</div>
          </div>
          
          <div className="metric-card bg-blue-light">
            <div className="metric-label">Saldo Final do Caixa</div>
            <div className="metric-value metric-blue">{fmtBRL(reportData.totals.cashBalance)}</div>
            <div className="subtle">Em {fmtDate(filters.endDate)}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        {/* Financial Flow Chart */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-blue-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Fluxo Financeiro (30 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={flowChartData}>
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
              <Area type="monotone" dataKey="vendas" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Vendas" />
              <Area type="monotone" dataKey="dividas" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Dívidas" />
              <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
            </div>
          )}
        </div>
      </div>

      {/* Top Categories */}
      <div className="section-spacing avoid-break-inside">
        <h2 className="section-title">TOP 5 CATEGORIAS</h2>
        
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Entradas</th>
              <th style={{ textAlign: 'right' }}>Saídas</th>
              <th style={{ textAlign: 'right' }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {metrics.categoryTotals.slice(0, 5).map((category, index) => (
              <tr key={category.name}>
                <td style={{ fontWeight: '600' }}>{category.name}</td>
                <td style={{ textAlign: 'right' }} className="text-green">
                  {fmtBRL(category.entrada)}
                </td>
                <td style={{ textAlign: 'right' }} className="text-red">
                  {fmtBRL(category.saida)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '700' }} 
                    className={category.total >= 0 ? 'text-green' : 'text-red'}>
                  {category.total >= 0 ? '+' : ''}{fmtBRL(category.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Payment Methods */}
      <div className="section-spacing avoid-break-inside">
        <h2 className="section-title">TOP 5 MÉTODOS DE PAGAMENTO</h2>
        
        <table>
          <thead>
            <tr>
              <th>Método de Pagamento</th>
              <th style={{ textAlign: 'right' }}>Valor Total</th>
              <th style={{ textAlign: 'right' }}>% do Total</th>
            </tr>
          </thead>
          <tbody>
            {metrics.methodTotals.slice(0, 5).map((method, index) => {
              const percentage = (method.value / (reportData.totals.received + reportData.totals.paid)) * 100;
              return (
                <tr key={method.name}>
                  <td>
                    <span className="payment-badge">
                      {method.name}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>
                    {fmtBRL(method.value)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {formatNumber(percentage, 1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Daily Evolution */}
      <div className="section-spacing">
        <h2 className="section-title">EVOLUÇÃO DIÁRIA</h2>
        
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th style={{ textAlign: 'right' }}>Entradas</th>
              <th style={{ textAlign: 'right' }}>Saídas</th>
              <th style={{ textAlign: 'right' }}>Saldo do Dia</th>
            </tr>
          </thead>
          <tbody>
            {metrics.dailyTotals.map((day) => (
              <tr key={day.date}>
                <td style={{ fontWeight: '600' }}>{fmtDate(day.date)}</td>
                <td style={{ textAlign: 'right' }} className="text-green">
                  {fmtBRL(day.entrada)}
                </td>
                <td style={{ textAlign: 'right' }} className="text-red">
                  {fmtBRL(day.saida)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '700' }} 
                    className={day.saldo >= 0 ? 'text-green' : 'text-red'}>
                  {day.saldo >= 0 ? '+' : ''}{fmtBRL(day.saldo)}
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td style={{ fontWeight: '800' }}>TOTAL DO PERÍODO</td>
              <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                {fmtBRL(reportData.totals.received)}
              </td>
              <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-red">
                {fmtBRL(reportData.totals.paid)}
              </td>
              <td style={{ textAlign: 'right', fontWeight: '800' }} 
                  className={metrics.netResult >= 0 ? 'text-green' : 'text-red'}>
                {metrics.netResult >= 0 ? '+' : ''}{fmtBRL(metrics.netResult)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detailed Transaction Table */}
      <DetailedTransactionTable 
        receivedValues={reportData.receivedValues}
        paidValues={reportData.paidValues}
      />

      {/* Sales Realized */}
      {reportData.sales.length > 0 && (
        <div className="section-spacing">
          <h2 className="section-title">1. VENDAS REALIZADAS</h2>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Produtos</th>
                <th>Vendedor</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Recebido</th>
                <th style={{ textAlign: 'right' }}>Pendente</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.sales.map((sale) => (
                <tr key={sale.id} className="avoid-break-inside">
                  <td>{fmtDate(sale.date)}</td>
                  <td style={{ fontWeight: '600' }}>{sale.client}</td>
                  <td style={{ maxWidth: '200px', fontSize: '11px' }}>
                    {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                  </td>
                  <td style={{ fontSize: '11px' }}>
                    {sale.sellerId ? employees.find(e => e.id === sale.sellerId)?.name || 'Vendedor' : 'Sem vendedor'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>
                    {fmtBRL(sale.totalValue)}
                  </td>
                  <td style={{ textAlign: 'right' }} className="text-green">
                    {fmtBRL(sale.receivedAmount)}
                  </td>
                  <td style={{ textAlign: 'right' }} className="text-orange">
                    {fmtBRL(sale.pendingAmount)}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      sale.status === 'pago' ? 'status-paid' :
                      sale.status === 'parcial' ? 'status-partial' :
                      'status-pending'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: '700' }}>
                  TOTAL DE VENDAS:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }}>
                  {fmtBRL(reportData.totals.sales)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                  {fmtBRL(reportData.sales.reduce((sum, s) => sum + s.receivedAmount, 0))}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-orange">
                  {fmtBRL(reportData.sales.reduce((sum, s) => sum + s.pendingAmount, 0))}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Debts Made */}
      {reportData.debts.length > 0 && (
        <div className="section-spacing">
          <h2 className="section-title">2. DÍVIDAS FEITAS</h2>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Empresa</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Pago</th>
                <th style={{ textAlign: 'right' }}>Pendente</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.debts.map((debt) => (
                <tr key={debt.id} className="avoid-break-inside">
                  <td>{fmtDate(debt.date)}</td>
                  <td style={{ fontWeight: '600' }}>{debt.company}</td>
                  <td style={{ maxWidth: '250px', fontSize: '11px' }}>
                    {debt.description}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>
                    {fmtBRL(debt.totalValue)}
                  </td>
                  <td style={{ textAlign: 'right' }} className="text-green">
                    {fmtBRL(debt.paidAmount)}
                  </td>
                  <td style={{ textAlign: 'right' }} className="text-orange">
                    {fmtBRL(debt.pendingAmount)}
                  </td>
                  <td>
                    <span className={`status-badge ${debt.isPaid ? 'status-paid' : 'status-pending'}`}>
                      {debt.isPaid ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: '700' }}>
                  TOTAL DE DÍVIDAS:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }}>
                  {fmtBRL(reportData.totals.debts)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                  {fmtBRL(reportData.debts.reduce((sum, d) => sum + d.paidAmount, 0))}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-orange">
                  {fmtBRL(reportData.debts.reduce((sum, d) => sum + d.pendingAmount, 0))}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Final Summary */}
      <div className="section-spacing page-break">
        <h2 className="section-title">RESUMO FINAL DO PERÍODO</h2>
        
        <div className="print-card bg-blue-light">
          <div className="print-grid-2">
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#1e40af' }}>
                Movimentação Financeira
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Vendas Realizadas:</span>
                  <span style={{ fontWeight: '700' }}>{fmtBRL(reportData.totals.sales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valores Recebidos:</span>
                  <span style={{ fontWeight: '700' }} className="text-green">
                    {fmtBRL(reportData.totals.received)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dívidas Feitas:</span>
                  <span style={{ fontWeight: '700' }}>{fmtBRL(reportData.totals.debts)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valores Pagos:</span>
                  <span style={{ fontWeight: '700' }} className="text-red">
                    {fmtBRL(reportData.totals.paid)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#1e40af' }}>
                Resultado do Período
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Resultado Líquido:</span>
                  <span style={{ fontWeight: '800', fontSize: '18px' }} 
                        className={metrics.netResult >= 0 ? 'text-green' : 'text-red'}>
                    {metrics.netResult >= 0 ? '+' : ''}{fmtBRL(metrics.netResult)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Saldo Final do Caixa:</span>
                  <span style={{ fontWeight: '800', fontSize: '18px' }} className="text-blue">
                    {fmtBRL(reportData.totals.cashBalance)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Período Analisado:</span>
                  <span style={{ fontWeight: '700' }}>{metrics.periodDays} dias</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total de Transações:</span>
                  <span style={{ fontWeight: '700' }}>
                    {reportData.receivedValues.length + reportData.paidValues.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="report-footer">
        <div>Sistema Montreal Tintas - Gestão Empresarial Profissional</div>
        <div>Relatório gerado em {nowBR()}</div>
        <div>Este documento contém informações confidenciais da empresa</div>
      </div>
    </div>
  );
}