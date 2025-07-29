import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Star
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
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
  const activeEmployees = state.employees.filter(emp => emp.isActive).length;
  const totalPayroll = state.employees.filter(emp => emp.isActive).reduce((sum, emp) => sum + emp.salary, 0);

  // Today's data
  const today = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const todayReceivedAmount = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const todayDebts = state.debts.filter(debt => debt.date === today);
  const todayDebtsPaid = todayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
  const overdueChecks = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
  const dueToday = state.checks.filter(check => check.dueDate === today);

  // Monthly data for charts
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      fullMonth: date.toLocaleDateString('pt-BR', { month: 'long' }),
      year: date.getFullYear(),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    };
  }).reverse();

  const salesByMonth = last6Months.map(month => {
    const monthSales = state.sales.filter(sale => sale.date.startsWith(month.monthKey));
    const revenue = monthSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const count = monthSales.length;
    return {
      month: month.month,
      revenue,
      count,
      received: monthSales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
      pending: monthSales.reduce((sum, sale) => sum + sale.pendingAmount, 0)
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
    color: [
      '#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', 
      '#10b981', '#f59e0b', '#ef4444', '#84cc16'
    ][index % 8]
  }));

  // Status distribution
  const statusData = [
    { name: 'Pagas', value: state.sales.filter(s => s.status === 'pago').length, color: '#22c55e' },
    { name: 'Parciais', value: state.sales.filter(s => s.status === 'parcial').length, color: '#eab308' },
    { name: 'Pendentes', value: state.sales.filter(s => s.status === 'pendente').length, color: '#ef4444' }
  ];

  // Performance metrics
  const performanceData = [
    { name: 'Vendas', value: (state.sales.length / 100) * 100, color: '#22c55e' },
    { name: 'Recebimentos', value: (totalReceived / totalSales) * 100, color: '#16a34a' },
    { name: 'Funcionários', value: (activeEmployees / 20) * 100, color: '#15803d' },
    { name: 'Eficiência', value: 85, color: '#166534' }
  ];

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color, 
    prefix = '', 
    suffix = '',
    trend = 'up',
    delay = 0
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    color: string;
    prefix?: string;
    suffix?: string;
    trend?: 'up' | 'down';
    delay?: number;
  }) => (
    <div 
      className="card hover-lift transition-modern glow-effect group relative overflow-hidden transform-3d"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-modern"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-5 rounded-3xl bg-gradient-to-br ${color} modern-shadow-xl floating-animation group-hover:scale-125 transition-modern neon-glow`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold ${
              trend === 'up' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {change}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{title}</h3>
          <p className="text-4xl font-black text-slate-900 text-shadow-modern">
            {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-modern origin-left neon-glow"></div>
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
      className="card hover-lift transition-modern group relative overflow-hidden transform-3d"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/8 to-green-600/8 opacity-0 group-hover:opacity-100 transition-modern"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 modern-shadow-xl floating-animation neon-glow">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{title}</h3>
        </div>
        <div className="h-96">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="card bg-gradient-to-r from-green-600 to-emerald-700 text-white modern-shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3">Dashboard Financeiro</h1>
              <p className="text-green-100 text-lg font-medium">
                Visão completa do desempenho da RevGold
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                  <span className="text-green-100 text-sm font-medium">Sistema Online</span>
                </div>
                <div className="flex items-center gap-2">
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
              <div className="text-4xl font-bold text-white/40 mb-2">
                {new Date().getHours().toString().padStart(2, '0')}:
                {new Date().getMinutes().toString().padStart(2, '0')}
              </div>
              <div className="text-green-100 font-medium">
                Usuário: {state.user?.username}
              </div>
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
          color="from-green-100 to-green-200"
          trend="up"
          delay={0}
        />
        <MetricCard
          title="Valor Recebido Hoje"
          value={todayReceivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          change="+8.5%"
          icon={TrendingUp}
          color="from-blue-100 to-blue-200"
          prefix="R$ "
          trend="up"
          delay={100}
        />
        <MetricCard
          title="Dívidas Feitas Hoje"
          value={todayDebts.length}
          change="+3"
          icon={CreditCard}
          color="from-orange-100 to-orange-200"
          trend="up"
          delay={200}
        />
        <MetricCard
          title="Valor Pago Hoje"
          value={todayDebtsPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          change="-5%"
          icon={CheckCircle}
          color="from-purple-100 to-purple-200"
          prefix="R$ "
          trend="up"
          delay={300}
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Evolução de Vendas (6 meses)" icon={BarChart3} delay={400}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByMonth} key={animationKey}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
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
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
                  stroke="#22c55e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  animationDuration={2000}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stroke="#16a34a"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorReceived)"
                  animationDuration={2000}
                  animationDelay={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="space-y-6">
          <ChartCard title="Status das Vendas" icon={PieChart} delay={500}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart key={animationKey}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
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
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Métodos de Pagamento" icon={CreditCard} delay={600}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pieData} key={animationKey}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                angle={-45}
                textAnchor="end"
                height={80}
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
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  fontWeight: 600
                }}
                formatter={(value: any) => [
                  `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  'Valor'
                ]}
              />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
                animationDuration={1500}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Performance Geral" icon={Target} delay={700}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="90%" 
              data={performanceData}
              key={animationKey}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                fill="#8884d8"
                animationDuration={2000}
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </RadialBar>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  fontWeight: 600
                }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Performance']}
              />
              <Legend 
                iconSize={18} 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: '14px', fontWeight: 600 }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover-lift transition-modern group glow-effect">
          <div className="flex items-center gap-4">
            <div className="p-5 rounded-3xl bg-green-600 modern-shadow-xl floating-animation group-hover:scale-125 transition-modern neon-glow">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-green-900 text-xl">Total de Vendas</h3>
              <p className="text-green-700 font-black text-3xl">
                {state.sales.length}
              </p>
              <p className="text-green-600 text-base font-bold">
                R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-100 to-green-200 border-green-300 hover-lift transition-modern group glow-effect">
          <div className="flex items-center gap-4">
            <div className="p-5 rounded-3xl bg-green-700 modern-shadow-xl floating-animation group-hover:scale-125 transition-modern neon-glow">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-green-900 text-xl">Vencimentos Hoje</h3>
              <p className="text-green-700 font-black text-3xl">{dueToday.length}</p>
              <p className="text-green-600 text-base font-bold">
                R$ {dueToday.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover-lift transition-modern group glow-effect">
          <div className="flex items-center gap-4">
            <div className="p-5 rounded-3xl bg-red-600 modern-shadow-xl floating-animation group-hover:scale-125 transition-modern neon-glow">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-red-900 text-xl">Cheques Vencidos</h3>
              <p className="text-red-700 font-black text-3xl">{overdueChecks.length}</p>
              <p className="text-red-600 text-base font-bold">
                R$ {overdueChecks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-200 to-green-300 border-green-400 hover-lift transition-modern group glow-effect">
          <div className="flex items-center gap-4">
            <div className="p-5 rounded-3xl bg-green-800 modern-shadow-xl floating-animation group-hover:scale-125 transition-modern neon-glow">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-green-900 text-xl">Funcionários</h3>
              <p className="text-green-700 font-black text-3xl">
                {activeEmployees}
              </p>
              <p className="text-green-600 text-base font-bold">
                R$ {totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} folha
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card hover-lift transition-modern glow-effect">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 modern-shadow-xl floating-animation neon-glow">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Atividade Recente</h3>
        </div>
        
        <div className="space-y-4">
          {state.sales.slice(0, 5).map((sale, index) => (
            <div 
              key={sale.id} 
              className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-transparent rounded-2xl border-2 border-green-100 hover-lift transition-modern group glow-effect"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-green-600 modern-shadow-xl group-hover:scale-125 transition-modern neon-glow">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-lg">{sale.client}</p>
                  <p className="text-base text-slate-600 font-medium">
                    {new Date(sale.date).toLocaleDateString('pt-BR')} • 
                    {Array.isArray(sale.products) 
                      ? sale.products.map(p => p.name).join(', ')
                      : 'Produtos'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-green-600 text-xl">
                  R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  sale.status === 'pago' ? 'bg-green-100 text-green-700 border border-green-200' :
                  sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {sale.status === 'pago' ? 'Pago' :
                   sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
          
          {state.sales.length === 0 && (
            <div className="text-center py-16">
              <Star className="w-20 h-20 mx-auto text-green-300 mb-6 floating-animation" />
              <p className="text-slate-500 text-xl font-bold">Nenhuma venda registrada ainda</p>
              <p className="text-slate-400 text-lg">Comece registrando sua primeira venda!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}