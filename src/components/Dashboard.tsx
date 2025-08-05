import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowDownRight,
  Filter,
  TrendingDown as ExpenseIcon,
  Receipt,
  ShoppingCart
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

export default function Dashboard() {
  const { state } = useApp();
  const [timeFilter, setTimeFilter] = useState('30'); // 7, 15, 30, 60, 90 days

  // Calculate date range based on filter
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeFilter));
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Today's metrics
  const today = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayDebts = state.debts.filter(debt => debt.date === today);
  
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const todaySalesCount = todaySales.length;
  const todayExpenses = todayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
  const todayExpensesCount = todayDebts.length;

  // Filter data based on selected time range
  const filteredSales = useMemo(() => 
    state.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    }), [state.sales, startDate, endDate]
  );

  const filteredDebts = useMemo(() => 
    state.debts.filter(debt => {
      const debtDate = new Date(debt.date);
      return debtDate >= startDate && debtDate <= endDate;
    }), [state.debts, startDate, endDate]
  );

  // Calculate general metrics
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
  const activeEmployees = state.employees.filter(emp => emp.isActive).length;

  // Generate daily data for 3D chart
  const dailyData = useMemo(() => {
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const daySales = filteredSales.filter(sale => sale.date === dateStr);
      const dayDebts = filteredDebts.filter(debt => debt.date === dateStr);
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        month: currentDate.toLocaleDateString('pt-BR', { month: 'short' }),
        fullDate: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        received: daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
        expenses: dayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0),
        profit: daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0) - dayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [filteredSales, filteredDebts, startDate, endDate]);

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
    suffix = '',
    bgColor = 'from-green-50 to-emerald-50',
    borderColor = 'border-green-200',
    iconColor = 'from-green-500 to-emerald-600',
    textColor = 'text-green-900',
    valueColor = 'text-green-700'
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    trend?: 'up' | 'down';
    delay?: number;
    prefix?: string;
    suffix?: string;
    bgColor?: string;
    borderColor?: string;
    iconColor?: string;
    textColor?: string;
    valueColor?: string;
  }) => (
    <div 
      className={`revgold-card bg-gradient-to-br ${bgColor} ${borderColor} revgold-hover-lift revgold-animate-fade-in group shadow-lg`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`p-5 bg-gradient-to-br ${iconColor} rounded-3xl shadow-lg revgold-animate-floating`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-bold backdrop-blur-sm border ${
            trend === 'up' 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : 'bg-red-100 text-red-700 border-red-200'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className={`font-black ${textColor} text-lg mb-2`}>
          {title}
        </h3>
        <p className={`${valueColor} font-black text-3xl mb-1`}>
          {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: prefix === 'R$ ' ? 2 : 0 }) : value}{suffix}
        </p>
      </div>
    </div>
  );

  const ChartCard = ({ 
    title, 
    children, 
    icon: Icon, 
    delay = 0,
    actions
  }: { 
    title: string; 
    children: React.ReactNode; 
    icon: any; 
    delay?: number;
    actions?: React.ReactNode;
  }) => (
    <div 
      className="revgold-chart-container revgold-animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="revgold-chart-header">
          <div className="revgold-chart-icon revgold-animate-floating">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="revgold-chart-title">{title}</h3>
          </div>
        </div>
        {actions}
      </div>
      <div className="h-96">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 text-white revgold-animate-fade-in shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #059669 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #059669 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="relative p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl revgold-animate-floating">
                <img 
                  src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                  alt="RevGold Logo" 
                  className="w-20 h-20 object-contain"
                />
              </div>
              <div>
                <div className="flex items-center space-x-6 mb-4">
                  <img 
                    src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                    alt="RevGold Logo" 
                    className="w-16 h-16 object-contain"
                  />
                  <h1 className="text-6xl font-black text-white">Dashboard</h1>
                </div>
                <p className="text-green-200 text-2xl font-bold opacity-90">
                  Visão completa do desempenho empresarial
                </p>
                <div className="flex items-center space-x-8 mt-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-400 rounded-full revgold-animate-pulse-glow shadow-lg"></div>
                    <span className="text-green-200 text-base font-bold uppercase tracking-wide">Sistema Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-6 h-6 text-green-300" />
                    <span className="text-green-100 text-base font-bold">
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
            </div>
            
            <div className="text-right">
              <div className="text-5xl font-black text-green-300 mb-3 revgold-animate-floating">
                {new Date().getHours().toString().padStart(2, '0')}:
                {new Date().getMinutes().toString().padStart(2, '0')}
              </div>
              <div className="text-green-100 font-bold text-xl">
                Usuário: {state.user?.username}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Metrics */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg revgold-animate-floating">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800">Métricas de Hoje</h2>
            <p className="text-slate-600 text-lg font-semibold">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Valor Recebido Hoje"
            value={todayRevenue}
            icon={DollarSign}
            prefix="R$ "
            delay={0}
            bgColor="from-green-50 to-emerald-50"
            borderColor="border-green-200"
            iconColor="from-green-500 to-emerald-600"
            textColor="text-green-900"
            valueColor="text-green-700"
          />
          <MetricCard
            title="Vendas Feitas Hoje"
            value={todaySalesCount}
            icon={ShoppingCart}
            delay={100}
            bgColor="from-blue-50 to-sky-50"
            borderColor="border-blue-200"
            iconColor="from-blue-500 to-sky-600"
            textColor="text-blue-900"
            valueColor="text-blue-700"
          />
          <MetricCard
            title="Valor Gasto Hoje"
            value={todayExpenses}
            icon={ExpenseIcon}
            prefix="R$ "
            delay={200}
            bgColor="from-red-50 to-rose-50"
            borderColor="border-red-200"
            iconColor="from-red-500 to-rose-600"
            textColor="text-red-900"
            valueColor="text-red-700"
          />
          <MetricCard
            title="Gastos Feitos Hoje"
            value={todayExpensesCount}
            icon={Receipt}
            delay={300}
            bgColor="from-orange-50 to-amber-50"
            borderColor="border-orange-200"
            iconColor="from-orange-500 to-amber-600"
            textColor="text-orange-900"
            valueColor="text-orange-700"
          />
        </div>
      </div>

      {/* 3D Financial Chart with Filter */}
      <ChartCard 
        title="Fluxo Financeiro (Recebido vs Gasto)" 
        icon={BarChart3} 
        delay={400}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Período:</span>
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
            <XAxis 
              dataKey="fullDate" 
              stroke="#64748b"
              fontSize={12}
              fontWeight={600}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              fontWeight={600}
              tick={{ fill: '#64748b' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }}
              formatter={(value: any, name: string) => [
                `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                name === 'received' ? 'Valor Recebido' : 
                name === 'expenses' ? 'Valor Gasto' : 'Lucro'
              ]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="received"
              fill="url(#colorReceived)"
              stroke="#059669"
              strokeWidth={4}
              filter="url(#shadow)"
              dot={{ fill: '#059669', strokeWidth: 3, r: 6, filter: 'url(#shadow)' }}
              activeDot={{ r: 8, stroke: '#059669', strokeWidth: 3, fill: '#ffffff', filter: 'url(#shadow)' }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              fill="url(#colorExpenses)"
              stroke="#ef4444"
              strokeWidth={4}
              filter="url(#shadow)"
              dot={{ fill: '#ef4444', strokeWidth: 3, r: 6, filter: 'url(#shadow)' }}
              activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 3, fill: '#ffffff', filter: 'url(#shadow)' }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#8b5cf6"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#ffffff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          title="Receita Total"
          value={totalSales}
          change="+8.5%"
          icon={TrendingUp}
          prefix="R$ "
          trend="up"
          delay={500}
        />
        <MetricCard
          title="Valor Recebido"
          value={totalReceived}
          change="+15%"
          icon={CheckCircle}
          prefix="R$ "
          trend="up"
          delay={600}
        />
        <MetricCard
          title="Funcionários Ativos"
          value={activeEmployees}
          change="+2"
          icon={Users}
          trend="up"
          delay={700}
        />
        <MetricCard
          title="Total de Vendas"
          value={state.sales.length}
          change="+12%"
          icon={DollarSign}
          trend="up"
          delay={800}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend Chart */}
        <ChartCard title="Evolução de Vendas (6 meses)" icon={BarChart3} delay={900}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesByMonth}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E6C547" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#E6C547" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                stroke="#475569"
                fontSize={12}
                fontWeight={700}
              />
              <YAxis 
                stroke="#475569"
                fontSize={12}
                fontWeight={700}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontWeight: 700
                }}
                formatter={(value: any, name: string) => [
                  `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  name === 'revenue' ? 'Receita Total' : 'Valor Recebido'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="received"
                stroke="#E6C547"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorReceived)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard title="Status das Vendas" icon={PieChart} delay={1000}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
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
                  borderRadius: '16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontWeight: 700
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={40}
                wrapperStyle={{ fontSize: '14px', fontWeight: 700 }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="revgold-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 revgold-hover-lift revgold-animate-fade-in shadow-lg" style={{ animationDelay: '1100ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-lg revgold-animate-floating">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-green-900 text-lg mb-1">Total de Vendas</h3>
              <p className="text-green-700 font-black text-3xl mb-1">
                {state.sales.length}
              </p>
              <p className="text-green-600 text-sm font-bold">
                R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="revgold-card bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 revgold-hover-lift revgold-animate-fade-in shadow-lg" style={{ animationDelay: '1200ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-5 bg-gradient-to-br from-blue-500 to-sky-600 rounded-3xl shadow-lg revgold-animate-floating">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-blue-900 text-lg mb-1">Vencimentos Hoje</h3>
              <p className="text-blue-700 font-black text-3xl mb-1">{dueToday.length}</p>
              <p className="text-blue-600 text-sm font-bold">
                R$ {dueToday.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="revgold-card bg-gradient-to-br from-red-50 to-rose-50 border-red-200 revgold-hover-lift revgold-animate-fade-in shadow-lg" style={{ animationDelay: '1300ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-5 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl shadow-lg revgold-animate-floating">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-red-900 text-lg mb-1">Cheques Vencidos</h3>
              <p className="text-red-700 font-black text-3xl mb-1">{overdueChecks.length}</p>
              <p className="text-red-600 text-sm font-bold">
                R$ {overdueChecks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="revgold-card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 revgold-hover-lift revgold-animate-fade-in shadow-lg" style={{ animationDelay: '1400ms' }}>
          <div className="flex items-center space-x-4">
            <div className="p-5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl shadow-lg revgold-animate-floating">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-purple-900 text-lg mb-1">Funcionários</h3>
              <p className="text-purple-700 font-black text-3xl mb-1">
                {activeEmployees}
              </p>
              <p className="text-purple-600 text-sm font-bold">
                Ativos no sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="revgold-card revgold-animate-fade-in" style={{ animationDelay: '1500ms' }}>
        <div className="revgold-chart-header">
          <div className="revgold-chart-icon revgold-animate-floating">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="revgold-chart-title">Atividade Recente</h3>
        </div>
        
        <div className="space-y-6">
          {state.sales.slice(0, 5).map((sale, index) => (
            <div 
              key={sale.id} 
              className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50/30 to-emerald-50/20 rounded-2xl hover:from-green-50/50 hover:to-emerald-50/30 transition-all duration-300 revgold-animate-fade-in revgold-hover-lift shadow-sm"
              style={{ animationDelay: `${1600 + index * 100}ms` }}
            >
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg revgold-animate-floating">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-lg">{sale.client}</p>
                  <p className="text-sm text-slate-600 font-semibold">
                    {new Date(sale.date).toLocaleDateString('pt-BR')} • 
                    {Array.isArray(sale.products) 
                      ? sale.products.map(p => p.name).join(', ')
                      : 'Produtos'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-green-600 text-xl mb-1">
                  R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className={`revgold-badge text-xs ${
                  sale.status === 'pago' ? 'revgold-badge-success' :
                  sale.status === 'parcial' ? 'revgold-badge-warning' : 'revgold-badge-error'
                }`}>
                  {sale.status === 'pago' ? 'Pago' :
                   sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
          
          {state.sales.length === 0 && (
            <div className="text-center py-16">
              <Target className="w-20 h-20 mx-auto text-slate-300 mb-6 revgold-animate-floating" />
              <p className="text-slate-500 text-xl font-bold mb-2">Nenhuma venda registrada ainda</p>
              <p className="text-slate-400 font-medium">Comece registrando sua primeira venda!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}