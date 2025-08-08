import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Eye,
  Sparkles,
  Globe,
  Shield,
  Award,
  Layers,
  Cpu,
  Database
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
  ComposedChart,
  ReferenceLine
} from 'recharts';

export default function Dashboard() {
  const { state } = useApp();
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [animationPhase, setAnimationPhase] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  
  // Dados de hoje
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const todaySalesCount = todaySales.length;

  const todayDebts = state.debts.filter(debt => debt.date === today);
  const todayDebtsPaid = todayDebts.filter(debt => debt.isPaid);
  const todayDebtsCreated = todayDebts.length;
  const todayDebtsPaidValue = todayDebtsPaid.reduce((sum, debt) => sum + debt.paidAmount, 0);
  const todayDebtsCreatedValue = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);

  const todayEmployeePayments = state.employeePayments.filter(payment => payment.paymentDate === today);
  const todayEmployeePaymentsValue = todayEmployeePayments.reduce((sum, payment) => sum + payment.amount, 0);

  const todayTotalExpenses = todayDebtsPaidValue + todayEmployeePaymentsValue;
  const todayTotalPaid = todayDebtsPaidValue + todayEmployeePaymentsValue;

  // Dados dos últimos 30 dias para gráficos
  const last30Days = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = state.sales.filter(sale => sale.date === dateStr);
      const dayDebts = state.debts.filter(debt => debt.date === dateStr);
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: daySales.reduce((sum, sale) => sum + sale.totalValue, 0),
        received: daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
        expenses: dayDebts.reduce((sum, debt) => sum + debt.totalValue, 0),
        profit: daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0) - dayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0),
        salesCount: daySales.length,
        debtsCount: dayDebts.length
      });
    }
    return days;
  }, [state.sales, state.debts]);

  // Filtro de data para gráficos
  const [dateFilter, setDateFilter] = useState('30');
  const [filteredDays, setFilteredDays] = useState(last30Days);

  // Atualizar dados filtrados quando o filtro muda
  useEffect(() => {
    const days = parseInt(dateFilter);
    const filtered = last30Days.slice(-days);
    setFilteredDays(filtered);
  }, [dateFilter, last30Days]);

  // Dados para gráfico de lucro consolidado
  const profitData = useMemo(() => {
    return filteredDays.map(day => ({
      ...day,
      totalReceived: day.received,
      totalPaid: day.expenses,
      profit: day.received - day.expenses,
      accumulated: filteredDays.slice(0, filteredDays.indexOf(day) + 1)
        .reduce((sum, d) => sum + (d.received - d.expenses), 0)
    }));
  }, [filteredDays]);

  // Dados para gráfico de pizza - métodos de pagamento
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    state.sales.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        const type = method.type.replace('_', ' ');
        methods[type] = (methods[type] || 0) + method.amount;
      });
    });
    
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#84cc16', '#ec4899'];
    return Object.entries(methods).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[index % colors.length]
    }));
  }, [state.sales]);

  // Dados para gráfico radial - performance
  const performanceData = useMemo(() => {
    const totalSales = state.sales.length;
    const paidSales = state.sales.filter(s => s.status === 'pago').length;
    const partialSales = state.sales.filter(s => s.status === 'parcial').length;
    const pendingSales = state.sales.filter(s => s.status === 'pendente').length;

    return [
      { name: 'Pagas', value: totalSales > 0 ? (paidSales / totalSales) * 100 : 0, fill: '#10b981' },
      { name: 'Parciais', value: totalSales > 0 ? (partialSales / totalSales) * 100 : 0, fill: '#f59e0b' },
      { name: 'Pendentes', value: totalSales > 0 ? (pendingSales / totalSales) * 100 : 0, fill: '#ef4444' }
    ];
  }, [state.sales]);

  // Top clientes
  const topClients = useMemo(() => {
    const clientsMap = {};
    state.sales.forEach(sale => {
      if (!clientsMap[sale.client]) {
        clientsMap[sale.client] = { name: sale.client, total: 0, count: 0 };
      }
      clientsMap[sale.client].total += sale.totalValue;
      clientsMap[sale.client].count += 1;
    });
    
    return Object.values(clientsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [state.sales]);

  // Animação cíclica
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      id: 'revenue',
      title: 'Vendas de Hoje',
      value: `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${todaySalesCount} venda(s)`,
      icon: DollarSign,
      color: 'emerald',
      gradient: 'from-emerald-400 via-green-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/50',
      trend: '+12.5%',
      trendUp: true
    },
    {
      id: 'expenses',
      title: 'Dívidas Feitas Hoje',
      value: `R$ ${todayDebtsCreatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${todayDebtsCreated} dívida(s)`,
      icon: TrendingDown,
      color: 'red',
      gradient: 'from-red-400 via-rose-500 to-red-600',
      shadowColor: 'shadow-red-500/50',
      trend: '-8.3%',
      trendUp: false
    },
    {
      id: 'profit',
      title: 'Valor Recebido Hoje',
      value: `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `Recebimentos do dia`,
      icon: Target,
      color: 'blue',
      gradient: 'from-blue-400 via-cyan-500 to-blue-600',
      shadowColor: 'shadow-blue-500/50',
      trend: '+24.7%',
      trendUp: true
    },
    {
      id: 'performance',
      title: 'Valor Pago Hoje',
      value: `R$ ${todayTotalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `Pagamentos realizados`,
      icon: Activity,
      color: 'purple',
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      shadowColor: 'shadow-purple-500/50',
      trend: '+5.2%',
      trendUp: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-green-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 p-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Date Filter */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/30">
              <label className="block text-white font-bold mb-2">Filtrar Período dos Gráficos</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/90 text-slate-800 font-medium border-0 focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="60">Últimos 60 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
          </div>

          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                <Sparkles className="w-16 h-16 text-white relative z-10 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Star className="w-4 h-4 text-yellow-900" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-cyan-400 mb-4 animate-pulse">
            Dashboard RevGold
          </h1>
          
          <p className="text-2xl text-emerald-200 font-bold mb-2">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
          
          <div className="flex items-center justify-center space-x-4 mt-6">
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 animate-ping"></div>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isActive = activeMetric === stat.id;
            const isHovered = hoveredCard === stat.id;
            
            return (
              <div
                key={stat.id}
                className={`relative group cursor-pointer transition-all duration-700 transform ${
                  isActive ? 'scale-110 z-20' : 'hover:scale-105'
                } ${isHovered ? 'z-10' : ''}`}
                onClick={() => setActiveMetric(stat.id)}
                onMouseEnter={() => setHoveredCard(stat.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Card Background with 3D Effect */}
                <div className={`relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl ${stat.shadowColor} transition-all duration-700 group-hover:shadow-3xl min-h-[200px] flex flex-col justify-between`}>
                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  
                  {/* 3D Icon Container */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-2xl ${stat.shadowColor} transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                      <Icon className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <Zap className="w-3 h-3 text-yellow-900" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white/90 group-hover:text-white transition-colors duration-300">
                        {stat.title}
                      </h3>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        stat.trendUp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {stat.trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {stat.trend}
                      </div>
                    </div>
                    
                    <p className="text-3xl font-black text-white mb-2 group-hover:text-4xl transition-all duration-300">
                      {stat.value}
                    </p>
                    
                    <p className="text-white/70 font-medium group-hover:text-white/90 transition-colors duration-300">
                      {stat.subtitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 shadow-lg`}
                        style={{ width: `${60 + (index * 10)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Revenue Trend Chart */}
          <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-emerald-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/50">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Evolução Financeira</h3>
                <p className="text-emerald-200">Últimos 30 dias</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredDays}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                    fontWeight={600}
                    tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                    fontWeight={600}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(20px)'
                    }}
                    formatter={(value, name) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      name === 'revenue' ? 'Receita' : 
                      name === 'received' ? 'Recebido' : 
                      name === 'profit' ? 'Lucro' : 'Gastos'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill="url(#revenueGradient)"
                    stroke="#10b981"
                    strokeWidth={4}
                    fillOpacity={0.6}
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="#ef4444" 
                    radius={[8, 8, 0, 0]}
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3b82f6"
                    strokeWidth={5}
                    dot={{ 
                      fill: '#3b82f6', 
                      strokeWidth: 3, 
                      r: 8,
                      style: {
                        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))'
                      }
                    }}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                    }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Profit Analysis Chart */}
          <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-purple-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/50">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Análise de Lucro</h3>
                <p className="text-purple-200">Recebimentos vs Pagamentos</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={profitData}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                    fontWeight={600}
                    tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                    fontWeight={600}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(20px)'
                    }}
                    formatter={(value, name) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      name === 'totalReceived' ? 'Total Recebido' : 
                      name === 'totalPaid' ? 'Total Pago' : 
                      name === 'profit' ? 'Lucro do Dia' : 'Lucro Acumulado'
                    ]}
                  />
                  <Bar 
                    dataKey="totalReceived" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(34, 197, 94, 0.3))'
                    }}
                  />
                  <Bar 
                    dataKey="totalPaid" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    fill={(entry) => entry > 0 ? "url(#profitGradient)" : "url(#lossGradient)"}
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={0.4}
                  />
                  <Line
                    type="monotone"
                    dataKey="accumulated"
                    stroke="#f59e0b"
                    strokeWidth={4}
                    dot={{ 
                      fill: '#f59e0b', 
                      strokeWidth: 3, 
                      r: 6,
                      style: {
                        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.5))'
                      }
                    }}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
                    }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.5)" strokeDasharray="5 5" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary Box */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-500/20 rounded-xl border border-green-400/30">
                <p className="text-green-300 text-sm font-bold">Total Recebido</p>
                <p className="text-green-100 text-lg font-black">
                  R$ {profitData.reduce((sum, day) => sum + day.totalReceived, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center p-4 bg-red-500/20 rounded-xl border border-red-400/30">
                <p className="text-red-300 text-sm font-bold">Total Pago</p>
                <p className="text-red-100 text-lg font-black">
                  R$ {profitData.reduce((sum, day) => sum + day.totalPaid, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-500/20 rounded-xl border border-purple-400/30">
                <p className="text-purple-300 text-sm font-bold">Lucro Total</p>
                <p className={`text-lg font-black ${
                  (profitData.reduce((sum, day) => sum + day.totalReceived, 0) - profitData.reduce((sum, day) => sum + day.totalPaid, 0)) >= 0 
                    ? 'text-green-100' : 'text-red-100'
                }`}>
                  R$ {(profitData.reduce((sum, day) => sum + day.totalReceived, 0) - profitData.reduce((sum, day) => sum + day.totalPaid, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Radial Chart - Updated */}
          <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/50">
                <PieChart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Status das Vendas</h3>
                <p className="text-blue-200">Distribuição por situação</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={performanceData}>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <RadialBar
                    minAngle={15}
                    label={{ position: 'insideStart', fill: '#fff', fontWeight: 'bold', fontSize: 14 }}
                    background={{ fill: 'rgba(255,255,255,0.1)' }}
                    clockWise
                    dataKey="value"
                    cornerRadius={15}
                    style={{ filter: 'url(#glow)' }}
                  />
                  <Legend 
                    iconSize={18}
                    wrapperStyle={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}
                    layout="vertical"
                    verticalAlign="bottom"
                    align="center"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(20px)'
                    }}
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Percentual']}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods - Enhanced 3D */}
          <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-purple-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/50">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Métodos de Pagamento</h3>
                <p className="text-purple-200">Distribuição por tipo</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <defs>
                    <filter id="shadow3d">
                      <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={130}
                    paddingAngle={8}
                    dataKey="value"
                    style={{ filter: 'url(#shadow3d)' }}
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(20px)'
                    }}
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor'
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ fontSize: '14px', fontWeight: 600, color: 'white' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Section - Third Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Clients - Enhanced */}
          <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-orange-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/50">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Top 5 Clientes</h3>
                <p className="text-orange-200">Maiores compradores</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div key={index} className="group relative bg-gradient-to-r from-white/10 to-transparent backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                          {index + 1}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Award className="w-3 h-3 text-yellow-900" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg group-hover:text-emerald-300 transition-colors duration-300">
                          {client.name}
                        </p>
                        <p className="text-white/70 font-medium">{client.count} compras</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-400 text-xl">
                        R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/70 text-sm font-medium">
                        Média: R$ {(client.total / client.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                </div>
              ))}
              
              {topClients.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-white/30 mb-4" />
                  <p className="text-white/70 text-lg">Nenhum cliente encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's Activity Summary - Enhanced */}
          <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/50">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Resumo de Hoje</h3>
                <p className="text-cyan-200">Atividades do dia</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-green-500/20 rounded-2xl border border-green-400/30" style={{ filter: 'drop-shadow(0 4px 8px rgba(34, 197, 94, 0.2))' }}>
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-green-300" />
                <p className="text-4xl font-black text-green-100 mb-2">
                  {todaySalesCount}
                </p>
                <p className="text-green-300 font-bold">Vendas Realizadas</p>
                <p className="text-green-200 text-sm mt-2">
                  R$ {todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="text-center p-6 bg-red-500/20 rounded-2xl border border-red-400/30" style={{ filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.2))' }}>
                <TrendingDown className="w-12 h-12 mx-auto mb-4 text-red-300" />
                <p className="text-4xl font-black text-red-100 mb-2">
                  {todayDebtsCreated}
                </p>
                <p className="text-red-300 font-bold">Dívidas Criadas</p>
                <p className="text-red-200 text-sm mt-2">
                  R$ {todayDebtsCreatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="text-center p-6 bg-blue-500/20 rounded-2xl border border-blue-400/30" style={{ filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))' }}>
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                <p className="text-4xl font-black text-blue-100 mb-2">
                  R$ {todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-blue-300 font-bold">Valor Recebido</p>
              </div>
              
              <div className="text-center p-6 bg-purple-500/20 rounded-2xl border border-purple-400/30" style={{ filter: 'drop-shadow(0 4px 8px rgba(147, 51, 234, 0.2))' }}>
                <Activity className="w-12 h-12 mx-auto mb-4 text-purple-300" />
                <p className="text-4xl font-black text-purple-100 mb-2">
                  R$ {todayTotalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-purple-300 font-bold">Valor Pago</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-400/30">
              <div className="text-center">
                <p className="text-emerald-300 font-bold mb-2">Saldo do Dia</p>
                <p className={`text-3xl font-black ${
                  (todayRevenue - todayTotalPaid) >= 0 ? 'text-emerald-100' : 'text-red-100'
                }`}>
                  R$ {(todayRevenue - todayTotalPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-emerald-200 text-sm mt-1">
                  {(todayRevenue - todayTotalPaid) >= 0 ? 'Lucro' : 'Prejuízo'} de hoje
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity - Detailed */}
        <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-cyan-500/20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/50">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Atividade de Hoje</h3>
              <p className="text-cyan-200">Transações realizadas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Sales */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                Vendas de Hoje
              </h4>
              {todaySales.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {todaySales.map((sale, index) => (
                    <div key={sale.id} className="group bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/30 hover:border-emerald-400/60 transition-all duration-500 hover:scale-105" style={{ filter: 'drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2))' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-emerald-300 text-lg">{sale.client}</p>
                          <p className="text-white/80 text-sm">
                            {Array.isArray(sale.products) 
                              ? sale.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
                              : sale.products}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              sale.status === 'pago' ? 'bg-emerald-500/30 text-emerald-300' :
                              sale.status === 'parcial' ? 'bg-yellow-500/30 text-yellow-300' :
                              'bg-red-500/30 text-red-300'
                            }`}>
                              {sale.status === 'pago' ? 'Pago' :
                               sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-400 text-xl">
                            R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-white/70 text-sm">
                            Recebido: R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-white/30 mb-4" />
                  <p className="text-white/70">Nenhuma venda hoje</p>
                </div>
              )}
            </div>

            {/* Today's Expenses */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-red-400" />
                Gastos de Hoje
              </h4>
              {(todayDebtsPaid.length > 0 || todayEmployeePayments.length > 0) ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {todayDebtsPaid.map((debt, index) => (
                    <div key={debt.id} className="group bg-gradient-to-r from-red-500/20 to-rose-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-400/30 hover:border-red-400/60 transition-all duration-500 hover:scale-105" style={{ filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.2))' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-red-300 text-lg">{debt.company}</p>
                          <p className="text-white/80 text-sm">{debt.description}</p>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-300 mt-2 inline-block">
                            Pago
                          </span>
                        </div>
                        <p className="font-black text-red-400 text-xl">
                          R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {todayEmployeePayments.map((payment, index) => {
                    const employee = state.employees.find(e => e.id === payment.employeeId);
                    return (
                      <div key={payment.id} className="group bg-gradient-to-r from-purple-500/20 to-violet-500/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30 hover:border-purple-400/60 transition-all duration-500 hover:scale-105" style={{ filter: 'drop-shadow(0 2px 4px rgba(147, 51, 234, 0.2))' }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-purple-300 text-lg">{employee?.name || 'Funcionário'}</p>
                            <p className="text-white/80 text-sm">{employee?.position || 'Cargo'}</p>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-300 mt-2 inline-block">
                              Pago
                            </span>
                          </div>
                          <p className="font-black text-purple-400 text-xl">
                            R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingDown className="w-16 h-16 mx-auto text-white/30 mb-4" />
                  <p className="text-white/70">Nenhum gasto hoje</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-emerald-500/20">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-black text-white mb-4">Resumo Geral do Sistema</h3>
            <p className="text-emerald-200 text-lg">Estatísticas completas da plataforma</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-500" style={{ filter: 'drop-shadow(0 4px 8px rgba(34, 197, 94, 0.3))' }}>
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-black text-emerald-400 mb-2 group-hover:text-5xl transition-all duration-300">
                {state.sales.length}
              </p>
              <p className="text-white/80 font-bold">Total Vendas</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/50 group-hover:scale-110 transition-transform duration-500" style={{ filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))' }}>
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-black text-red-400 mb-2 group-hover:text-5xl transition-all duration-300">
                {state.debts.length}
              </p>
              <p className="text-white/80 font-bold">Total Dívidas</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/50 group-hover:scale-110 transition-transform duration-500" style={{ filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))' }}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-black text-blue-400 mb-2 group-hover:text-5xl transition-all duration-300">
                {state.checks.length}
              </p>
              <p className="text-white/80 font-bold">Total Cheques</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/50 group-hover:scale-110 transition-transform duration-500" style={{ filter: 'drop-shadow(0 4px 8px rgba(147, 51, 234, 0.3))' }}>
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-black text-purple-400 mb-2 group-hover:text-5xl transition-all duration-300">
                {state.employees.filter(e => e.isActive).length}
              </p>
              <p className="text-white/80 font-bold">Funcionários Ativos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}