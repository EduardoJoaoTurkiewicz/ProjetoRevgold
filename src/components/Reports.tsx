import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Receipt, 
  Download, 
  FileText,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Target,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShoppingCart,
  TrendingDown as ExpenseIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
  ComposedChart
} from 'recharts';

export const Reports: React.FC = () => {
  const { state } = useApp();
  const { sales, debts, checks, employees, boletos } = state;
  
  const [dateFilter, setDateFilter] = useState('30'); // 7, 15, 30 days
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Calculate date range based on filter
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateFilter));
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Today's detailed data
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => sale.date === today);
  const todayDebts = debts.filter(debt => debt.date === today);
  const todayEmployeePayments = state.employeePayments.filter(payment => payment.paymentDate === today);
  
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const todaySalesCount = todaySales.length;
  const todayDebtsPaidValue = todayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
  const todayDebtsCreated = todayDebts.length;
  const todayDebtsCreatedValue = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const todayEmployeePaymentsValue = todayEmployeePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const todayTotalPaid = todayDebtsPaidValue + todayEmployeePaymentsValue;

  // Filter data based on selected date range
  const filteredSales = useMemo(() => 
    sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    }), [sales, startDate, endDate]
  );

  const filteredDebts = useMemo(() => 
    debts.filter(debt => {
      const debtDate = new Date(debt.date);
      return debtDate >= startDate && debtDate <= endDate;
    }), [debts, startDate, endDate]
  );

  const filteredChecks = useMemo(() => 
    checks.filter(check => {
      const checkDate = new Date(check.dueDate);
      return checkDate >= startDate && checkDate <= endDate;
    }), [checks, startDate, endDate]
  );

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = filteredSales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    const totalPending = filteredSales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
    const totalExpenses = filteredDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalPaid = filteredDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const netProfit = totalReceived - totalPaid;
    const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;

    return {
      totalRevenue,
      totalReceived,
      totalPending,
      totalExpenses,
      totalPaid,
      netProfit,
      profitMargin,
      salesCount: filteredSales.length,
      debtsCount: filteredDebts.length,
      checksCount: filteredChecks.length
    };
  }, [filteredSales, filteredDebts, filteredChecks]);

  // Generate daily data for charts
  const dailyData = useMemo(() => {
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const daySales = filteredSales.filter(sale => sale.date === dateStr);
      const dayDebts = filteredDebts.filter(debt => debt.date === dateStr);
      const dayChecks = filteredChecks.filter(check => check.dueDate === dateStr);
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        month: currentDate.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: daySales.reduce((sum, sale) => sum + sale.totalValue, 0),
        received: daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
        expenses: dayDebts.reduce((sum, debt) => sum + debt.totalValue, 0),
        checksValue: dayChecks.reduce((sum, check) => sum + check.value, 0),
        salesCount: daySales.length,
        debtsCount: dayDebts.length,
        checksCount: dayChecks.length
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [filteredSales, filteredDebts, filteredChecks, startDate, endDate]);

  // Payment methods distribution
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    filteredSales.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        const type = method.type.replace('_', ' ');
        methods[type] = (methods[type] || 0) + method.amount;
      });
    });
    
    return Object.entries(methods).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: [
        '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4', 
        '#f59e0b', '#ef4444', '#84cc16', '#ec4899'
      ][index % 8]
    }));
  }, [filteredSales]);

  // Status distribution
  const statusData = useMemo(() => [
    { 
      name: 'Pagas', 
      value: filteredSales.filter(s => s.status === 'pago').length, 
      color: '#22c55e',
      amount: filteredSales.filter(s => s.status === 'pago').reduce((sum, s) => sum + s.totalValue, 0)
    },
    { 
      name: 'Parciais', 
      value: filteredSales.filter(s => s.status === 'parcial').length, 
      color: '#f59e0b',
      amount: filteredSales.filter(s => s.status === 'parcial').reduce((sum, s) => sum + s.totalValue, 0)
    },
    { 
      name: 'Pendentes', 
      value: filteredSales.filter(s => s.status === 'pendente').length, 
      color: '#ef4444',
      amount: filteredSales.filter(s => s.status === 'pendente').reduce((sum, s) => sum + s.totalValue, 0)
    }
  ], [filteredSales]);

  // Top clients
  const topClients = useMemo(() => {
    const clientsMap = {};
    filteredSales.forEach(sale => {
      if (!clientsMap[sale.client]) {
        clientsMap[sale.client] = { name: sale.client, total: 0, count: 0 };
      }
      clientsMap[sale.client].total += sale.totalValue;
      clientsMap[sale.client].count += 1;
    });
    
    return Object.values(clientsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredSales]);

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('reports-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.setFontSize(20);
      pdf.setTextColor(21, 128, 61);
      pdf.text('RevGold - Relatório Financeiro Detalhado', 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`, 20, 30);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 40);
      pdf.text(`Usuário: ${state.user?.username}`, 20, 50);
      
      pdf.addImage(imgData, 'PNG', 0, 60, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `RevGold_Relatorio_${dateFilter}dias_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      alert('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Filters */}
      <div className="card bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm floating-animation">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Relatórios Avançados</h1>
              <p className="text-green-100 text-lg">
                Análise detalhada dos últimos {dateFilter} dias
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="filter-card bg-white/20 border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Período</span>
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-slate-800 font-medium text-sm border-0 focus:ring-2 focus:ring-green-500/50"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="60">Últimos 60 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
            
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/30"
            >
              <Download className="w-5 h-5" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Today's Detailed Metrics */}
      <div className="card modern-shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Relatório Detalhado de Hoje</h2>
              <p className="text-slate-600">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">
                  R$ {todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">Vendas de Hoje</p>
              </div>
            </div>
          </div>

          <div className="metric-card bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">{todaySalesCount}</p>
                <p className="text-sm text-slate-600">Valor Recebido Hoje</p>
              </div>
            </div>
          </div>

          <div className="metric-card bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-100">
                <ExpenseIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">
                  R$ {todayDebtsCreatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">Dívidas Feitas Hoje</p>
              </div>
            </div>
          </div>

          <div className="metric-card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">
                  R$ {todayTotalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">Valor Pago Hoje</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Sales Details */}
        {todaySales.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Vendas Realizadas Hoje</h3>
            <div className="space-y-3">
              {todaySales.map((sale, index) => (
                <div key={sale.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-green-900">{sale.client}</p>
                      <p className="text-sm text-green-700">
                        {Array.isArray(sale.products) 
                          ? sale.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
                          : sale.products}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                          {sale.paymentMethods.map(m => m.type.replace('_', ' ')).join(', ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          sale.status === 'pago' ? 'bg-emerald-200 text-emerald-800' :
                          sale.status === 'parcial' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {sale.status === 'pago' ? 'Pago' :
                           sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">
                        R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-700">
                        Recebido: R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Expenses Details */}
        {(todayDebts.length > 0 || todayEmployeePayments.length > 0) && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Gastos Realizados Hoje</h3>
            <div className="space-y-3">
              {todayDebts.map((debt, index) => (
                <div key={debt.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-red-900">{debt.company}</p>
                      <p className="text-sm text-red-700">{debt.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-bold">
                          {debt.paymentMethods.map(m => m.type.replace('_', ' ')).join(', ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          debt.isPaid ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {debt.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-lg">
                        R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-red-700">
                        Pago: R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {todayEmployeePayments.map((payment, index) => {
                const employee = state.employees.find(e => e.id === payment.employeeId);
                return (
                  <div key={payment.id} className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-purple-900">{employee?.name || 'Funcionário'}</p>
                        <p className="text-sm text-purple-700">Pagamento de salário</p>
                        <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full font-bold mt-2 inline-block">
                          Pago
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 text-lg">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-purple-700">Funcionário</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {todaySales.length === 0 && todayDebts.length === 0 && todayEmployeePayments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg font-medium">Nenhuma atividade registrada hoje</p>
            <p className="text-slate-400">As transações do dia aparecerão aqui</p>
          </div>
        )}
      </div>

      <div id="reports-content">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">
                  R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">Vendas Totais</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                ></div>
              </div>
              <span className="text-xs font-medium text-green-600">
                {metrics.salesCount} vendas
              </span>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">
                  R$ {metrics.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">Valor Recebido</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.totalRevenue > 0 ? (metrics.totalReceived / metrics.totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-blue-600">
                {metrics.totalRevenue > 0 ? ((metrics.totalReceived / metrics.totalRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-100 group-hover:bg-red-200 transition-colors">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">
                  R$ {metrics.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">Dívidas Criadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.totalExpenses > 0 ? (metrics.totalPaid / metrics.totalExpenses) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-red-600">
                {metrics.debtsCount} dívidas
              </span>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl transition-colors ${
                metrics.netProfit >= 0 ? 'bg-emerald-100 group-hover:bg-emerald-200' : 'bg-red-100 group-hover:bg-red-200'
              }`}>
                <Target className={`w-6 h-6 ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  R$ {Math.abs(metrics.netProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">
                  {metrics.netProfit >= 0 ? 'Valor Pago' : 'Valor Pago'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metrics.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(Math.abs(metrics.profitMargin), 100)}%` }}
                ></div>
              </div>
              <span className={`text-xs font-medium ${
                metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {metrics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trend Chart */}
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-100">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Evolução Financeira</h3>
                <p className="text-slate-600">Receitas vs Gastos por dia</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight={500}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight={500}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      fontWeight: 500
                    }}
                    formatter={(value, name) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      name === 'revenue' ? 'Receita' : 
                      name === 'received' ? 'Recebido' : 'Gastos'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill="rgba(34, 197, 94, 0.1)"
                    stroke="#22c55e"
                    strokeWidth={3}
                  />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="received"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Distribution */}
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-purple-100">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Métodos de Pagamento</h3>
                <p className="text-slate-600">Distribuição por tipo</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      fontWeight: 500
                    }}
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor'
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ fontSize: '14px', fontWeight: 500 }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Status and Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Status */}
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-orange-100">
                <PieChart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Status das Vendas</h3>
                <p className="text-slate-600">Distribuição por situação</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {statusData.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <div>
                      <p className="font-semibold text-slate-800">{status.name}</p>
                      <p className="text-sm text-slate-600">{status.value} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">
                      R$ {status.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-600">
                      {((status.value / filteredSales.length) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clients */}
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Top 5 Clientes</h3>
                <p className="text-slate-600">Maiores compradores</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{client.name}</p>
                      <p className="text-sm text-slate-600">{client.count} compras</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-slate-600">
                      Média: R$ {(client.total / client.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              
              {topClients.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum cliente encontrado no período selecionado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sales */}
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-100">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Vendas Recentes</h3>
                <p className="text-slate-600">Últimas transações</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto modern-scrollbar">
              {filteredSales.slice(0, 10).map((sale, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800">{sale.client}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.status === 'pago' ? 'bg-green-100 text-green-700' :
                      sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sale.status === 'pago' ? 'Pago' :
                       sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
              
              {filteredSales.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma venda encontrada no período</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Gastos Recentes</h3>
                <p className="text-slate-600">Últimas despesas</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto modern-scrollbar">
              {filteredDebts.slice(0, 10).map((debt, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800">{debt.company}</p>
                    <p className="text-sm text-slate-600">
                      {debt.description} • {new Date(debt.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      debt.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {debt.isPaid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
              
              {filteredDebts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma despesa encontrada no período</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="card bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Resumo do Período ({dateFilter} dias)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {metrics.salesCount}
                </p>
                <p className="text-slate-600 font-medium">Vendas Realizadas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {metrics.checksCount}
                </p>
                <p className="text-slate-600 font-medium">Cheques Emitidos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 mb-1">
                  {metrics.debtsCount}
                </p>
                <p className="text-slate-600 font-medium">Despesas Registradas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600 mb-1">
                  {employees.filter(e => e.isActive).length}
                </p>
                <p className="text-slate-600 font-medium">Funcionários Ativos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};