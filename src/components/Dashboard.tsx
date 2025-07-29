import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight
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
  Legend
} from 'recharts';

export default function Dashboard() {
  const { state } = useApp();

  // Calculate metrics
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
  const activeEmployees = state.employees.filter(emp => emp.isActive).length;

  // Today's data
  const today = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const overdueChecks = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
  const dueToday = state.checks.filter(check => check.dueDate === today);

  // Monthly data for charts
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    };
  }).reverse();

  const salesByMonth = last6Months.map(month => {
    const monthSales = state.sales.filter(sale => sale.date.startsWith(month.monthKey));
    const revenue = monthSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const received = monthSales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    return {
      month: month.month,
      revenue,
      received,
      count: monthSales.length
    };
  });

  // Payment methods distribution
  const paymentMethodsData = state.sales.reduce((acc, sale) => {
    sale.paymentMethods.forEach(method => {
      const type = method.type.replace('_', ' ');
      acc[type] = (acc[type] || 0) + method.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(paymentMethodsData).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'][index % 6]
  }));

  // Status distribution
  const statusData = [
    { name: 'Pagas', value: state.sales.filter(s => s.status === 'pago').length, color: '#059669' },
    { name: 'Parciais', value: state.sales.filter(s => s.status === 'parcial').length, color: '#f59e0b' },
    { name: 'Pendentes', value: state.sales.filter(s => s.status === 'pendente').length, color: '#ef4444' }
  ];

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend = 'up',
    delay = 0,
    prefix = '',
    suffix = ''
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    trend?: 'up' | 'down';
    delay?: number;
    prefix?: string;
    suffix?: string;
  }) => (
    <div 
      className="metric-card group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 bg-gradient-primary rounded-2xl shadow-modern group-hover:shadow-modern-lg transition-all duration-300">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${
            trend === 'up' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {title}
        </h3>
        <p className="text-3xl font-black text-gray-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}
        </p>
      </div>
    </div>
  );

  const ChartCard = ({ 
    title, 
    children, 
    icon: Icon, 
    delay = 0 
  }: { 
    title: string; 
    children: React.ReactNode; 
    icon: any; 
    delay?: number;
  }) => (
    <div 
      className="chart-container animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-primary rounded-xl shadow-modern">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      <div className="h-80">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card bg-gradient-primary text-white animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-3">Dashboard Executivo</h1>
            <p className="text-green-100 text-lg font-medium opacity-90">
              Visão completa do desempenho da RevGold
            </p>
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-green-100 text-sm font-medium">Sistema Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-200" />
                <span className="text-green-100 text-sm font-medium">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-black text-white/80 mb-2">
              {new Date().getHours().toString().padStart(2, '0')}:
              {new Date().getMinutes().toString().padStart(2, '0')}
            </div>
            <div className="text-green-100 font-medium">
              Usuário: {state.user?.username}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Vendas Hoje"
          value={todaySales.length}
          change="+12%"
          icon={DollarSign}
          trend="up"
          delay={0}
        />
        <MetricCard
          title="Receita Total"
          value={totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          change="+8.5%"
          icon={TrendingUp}
          prefix="R$ "
          trend="up"
          delay={100}
        />
        <MetricCard
          title="Valor Recebido"
          value={totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          change="+15%"
          icon={CheckCircle}
          prefix="R$ "
          trend="up"
          delay={200}
        />
        <MetricCard
          title="Funcionários Ativos"
          value={activeEmployees}
          change="+2"
          icon={Users}
          trend="up"
          delay={300}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend Chart */}
        <ChartCard title="Evolução de Vendas (6 meses)" icon={BarChart3} delay={400}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesByMonth}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontWeight: 600
                }}
                formatter={(value: any, name: string) => [
                  `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  name === 'revenue' ? 'Receita Total' : 'Valor Recebido'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="received"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorReceived)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard title="Status das Vendas" icon={PieChart} delay={500}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontWeight: 600
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '14px', fontWeight: 600 }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-green-50 border-green-200 hover-lift animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-green-500 rounded-2xl shadow-modern">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Total de Vendas</h3>
              <p className="text-green-700 font-black text-2xl">
                {state.sales.length}
              </p>
              <p className="text-green-600 text-sm font-semibold">
                R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200 hover-lift animate-fade-in" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-blue-500 rounded-2xl shadow-modern">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Vencimentos Hoje</h3>
              <p className="text-blue-700 font-black text-2xl">{dueToday.length}</p>
              <p className="text-blue-600 text-sm font-semibold">
                R$ {dueToday.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200 hover-lift animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-red-500 rounded-2xl shadow-modern">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Cheques Vencidos</h3>
              <p className="text-red-700 font-black text-2xl">{overdueChecks.length}</p>
              <p className="text-red-600 text-sm font-semibold">
                R$ {overdueChecks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200 hover-lift animate-fade-in" style={{ animationDelay: '900ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-purple-500 rounded-2xl shadow-modern">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-lg">Funcionários</h3>
              <p className="text-purple-700 font-black text-2xl">
                {activeEmployees}
              </p>
              <p className="text-purple-600 text-sm font-semibold">
                Ativos no sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card animate-fade-in" style={{ animationDelay: '1000ms' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-primary rounded-xl shadow-modern">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Atividade Recente</h3>
        </div>
        
        <div className="space-y-4">
          {state.sales.slice(0, 5).map((sale, index) => (
            <div 
              key={sale.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 stagger-animation"
              style={{ animationDelay: `${1100 + index * 100}ms` }}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-modern">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{sale.client}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(sale.date).toLocaleDateString('pt-BR')} • 
                    {Array.isArray(sale.products) 
                      ? sale.products.map(p => p.name).join(', ')
                      : 'Produtos'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 text-lg">
                  R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className={`status-badge ${
                  sale.status === 'pago' ? 'success' :
                  sale.status === 'parcial' ? 'warning' : 'error'
                }`}>
                  {sale.status === 'pago' ? 'Pago' :
                   sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
          
          {state.sales.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-semibold">Nenhuma venda registrada ainda</p>
              <p className="text-gray-400">Comece registrando sua primeira venda!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}