import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Filter
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const { state } = useApp();
  const [profitAnalysisPeriod, setProfitAnalysisPeriod] = useState('30'); // Filtro apenas para análise de lucro

  // Calculate date range for profit analysis
  const getProfitDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(profitAnalysisPeriod));
    return { startDate, endDate };
  };

  const { startDate: profitStartDate, endDate: profitEndDate } = getProfitDateRange();

  // Filter data for profit analysis only
  const profitFilteredSales = useMemo(() => 
    state.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= profitStartDate && saleDate <= profitEndDate;
    }), [state.sales, profitStartDate, profitEndDate]
  );

  const profitFilteredDebts = useMemo(() => 
    state.debts.filter(debt => {
      const debtDate = new Date(debt.date);
      return debtDate >= profitStartDate && debtDate <= profitEndDate;
    }), [state.debts, profitStartDate, profitEndDate]
  );

  // Today's data (unchanged for other metrics)
  const today = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayDebts = state.debts.filter(debt => debt.date === today);
  const todayChecks = state.checks.filter(check => check.dueDate === today);
  const todayBoletos = state.boletos.filter(boleto => boleto.dueDate === today);

  // Calculate metrics for cards (using all data, not filtered)
  const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const totalExpenses = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const totalPaid = state.debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
  const netProfit = totalReceived - totalPaid;

  // Today's metrics
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const todayExpenses = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const todayProfit = todayRevenue - todayExpenses;

  // Generate daily data for profit analysis chart (filtered)
  const profitChartData = useMemo(() => {
    const days = [];
    const currentDate = new Date(profitStartDate);
    
    while (currentDate <= profitEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const daySales = profitFilteredSales.filter(sale => sale.date === dateStr);
      const dayDebts = profitFilteredDebts.filter(debt => debt.date === dateStr);
      
      const revenue = daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
      const expenses = dayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        month: currentDate.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue,
        expenses,
        profit: revenue - expenses
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [profitFilteredSales, profitFilteredDebts, profitStartDate, profitEndDate]);

  // Recent activity data (using all data, not filtered)
  const recentSales = state.sales
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentDebts = state.debts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Payment methods distribution (using all data)
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    state.sales.forEach(sale => {
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
  }, [state.sales]);

  // Status distribution (using all data)
  const statusData = useMemo(() => [
    { 
      name: 'Pagas', 
      value: state.sales.filter(s => s.status === 'pago').length, 
      color: '#22c55e' 
    },
    { 
      name: 'Parciais', 
      value: state.sales.filter(s => s.status === 'parcial').length, 
      color: '#f59e0b' 
    },
    { 
      name: 'Pendentes', 
      value: state.sales.filter(s => s.status === 'pendente').length, 
      color: '#ef4444' 
    }
  ], [state.sales]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl floating-animation">
          <Target className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard RevGold</h1>
          <p className="text-slate-600 text-lg">Visão geral do seu negócio</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-600">Vendas Totais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
            </div>
            <span className="text-xs font-medium text-green-600">{state.sales.length} vendas</span>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">
                R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-600">Valor Recebido</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-blue-600">
              {totalRevenue > 0 ? ((totalReceived / totalRevenue) * 100).toFixed(1) : 0}%
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
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-600">Gastos Totais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-red-600">{state.debts.length} gastos</span>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl transition-colors ${
              netProfit >= 0 ? 'bg-emerald-100 group-hover:bg-emerald-200' : 'bg-red-100 group-hover:bg-red-200'
            }`}>
              <Target className={`w-6 h-6 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R$ {Math.abs(netProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-600">
                {netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(Math.abs(netProfit / (totalReceived || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <span className={`text-xs font-medium ${
              netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {totalReceived > 0 ? ((netProfit / totalReceived) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="card modern-shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Resumo de Hoje</h2>
          <p className="text-slate-600">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <ShoppingCart className="w-8 h-8 mx-auto text-green-600 mb-3" />
            <p className="text-2xl font-bold text-green-600">
              R$ {todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-green-700 font-medium">Vendas Hoje ({todaySales.length})</p>
          </div>
          
          <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
            <CreditCard className="w-8 h-8 mx-auto text-red-600 mb-3" />
            <p className="text-2xl font-bold text-red-600">
              R$ {todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-red-700 font-medium">Gastos Hoje ({todayDebts.length})</p>
          </div>
          
          <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
            <Target className="w-8 h-8 mx-auto text-blue-600 mb-3" />
            <p className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {Math.abs(todayProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-blue-700 font-medium">
              {todayProfit >= 0 ? 'Lucro Hoje' : 'Prejuízo Hoje'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profit Analysis Chart with Filter */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Análise de Lucro</h3>
                <p className="text-slate-600">Receitas vs Gastos</p>
              </div>
            </div>
            
            {/* Filter for Profit Analysis Only */}
            <div className="filter-card bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Período</span>
              </div>
              <select
                value={profitAnalysisPeriod}
                onChange={(e) => setProfitAnalysisPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 font-medium text-sm border border-blue-200 focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="60">Últimos 60 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitChartData}>
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
                    name === 'expenses' ? 'Gastos' : 'Lucro'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#22c55e"
                  fill="rgba(34, 197, 94, 0.1)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#ef4444"
                  fill="rgba(239, 68, 68, 0.1)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
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
              <PieChart>
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
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Status */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-orange-100">
              <CheckCircle className="w-6 h-6 text-orange-600" />
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
                  <p className="text-sm text-slate-600">
                    {state.sales.length > 0 ? ((status.value / state.sales.length) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-green-100">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Atividade Recente</h3>
              <p className="text-slate-600">Últimas transações</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto modern-scrollbar">
            {recentSales.map((sale, index) => (
              <div key={`sale-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-green-800">{sale.client}</p>
                  <p className="text-sm text-green-600">
                    Venda • {new Date(sale.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    +R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            
            {recentDebts.map((debt, index) => (
              <div key={`debt-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-semibold text-red-800">{debt.company}</p>
                  <p className="text-sm text-red-600">
                    Gasto • {new Date(debt.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    -R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            
            {recentSales.length === 0 && recentDebts.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card modern-shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Alertas e Lembretes</h2>
          <p className="text-slate-600">Itens que precisam de atenção</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {todayChecks.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Cheques Vencendo</h3>
              </div>
              <p className="text-yellow-700">{todayChecks.length} cheque(s) vencem hoje</p>
            </div>
          )}
          
          {todayBoletos.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Boletos Vencendo</h3>
              </div>
              <p className="text-blue-700">{todayBoletos.length} boleto(s) vencem hoje</p>
            </div>
          )}
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Funcionários Ativos</h3>
            </div>
            <p className="text-green-700">{state.employees.filter(e => e.isActive).length} funcionário(s) ativo(s)</p>
          </div>
        </div>
      </div>
    </div>
  );
}