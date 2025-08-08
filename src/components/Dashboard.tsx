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
  Filter,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp as GrowthIcon
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
  ComposedChart,
  RadialBarChart,
  RadialBar,
  Legend
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

  // Performance metrics for radial charts
  const performanceData = useMemo(() => {
    const totalSalesTarget = 100; // Meta de vendas
    const currentSales = state.sales.length;
    const salesPerformance = Math.min((currentSales / totalSalesTarget) * 100, 100);
    
    const revenueTarget = 50000; // Meta de receita
    const revenuePerformance = Math.min((totalReceived / revenueTarget) * 100, 100);
    
    const profitTarget = 20000; // Meta de lucro
    const profitPerformance = netProfit > 0 ? Math.min((netProfit / profitTarget) * 100, 100) : 0;
    
    return [
      { name: 'Vendas', value: salesPerformance, fill: '#22c55e' },
      { name: 'Receita', value: revenuePerformance, fill: '#3b82f6' },
      { name: 'Lucro', value: profitPerformance, fill: '#8b5cf6' }
    ];
  }, [state.sales.length, totalReceived, netProfit]);

  // Top clients data
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

  return (
    <div className="space-y-8">
      {/* Header with 3D Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-500/20 to-green-700/20 blur-3xl"></div>
        <div className="relative flex items-center gap-6 p-8 bg-white/90 backdrop-blur-xl rounded-3xl border border-green-200/50 shadow-2xl" 
             style={{ 
               boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.1)' 
             }}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl blur-lg opacity-50 animate-pulse"></div>
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-2xl transform hover:scale-110 transition-all duration-500"
                 style={{ 
                   boxShadow: '0 20px 40px -12px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                 }}>
              <Target className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Dashboard RevGold
            </h1>
            <p className="text-xl text-slate-600 font-semibold">Visão geral avançada do seu negócio</p>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics Cards with 3D Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-green-200/50 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.1)' 
               }}>
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-2xl blur-md opacity-50"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 10px 20px rgba(34, 197, 94, 0.3)' 
                     }}>
                  <DollarSign className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-800 mb-1 group-hover:text-green-700 transition-colors duration-300">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600 font-bold">Vendas Totais</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000 shadow-lg" 
                     style={{ width: '100%', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}></div>
              </div>
              <span className="text-sm font-bold text-green-600">{state.sales.length} vendas</span>
            </div>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-sky-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-blue-200/50 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)' 
               }}>
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-md opacity-50"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 10px 20px rgba(59, 130, 246, 0.3)' 
                     }}>
                  <CheckCircle className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-800 mb-1 group-hover:text-blue-700 transition-colors duration-300">
                  R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600 font-bold">Valor Recebido</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-sky-500 h-3 rounded-full transition-all duration-1000 shadow-lg" 
                     style={{ 
                       width: `${totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0}%`,
                       boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                     }}></div>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {totalRevenue > 0 ? ((totalReceived / totalRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-red-200/50 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(239, 68, 68, 0.1)' 
               }}>
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-2xl blur-md opacity-50"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 10px 20px rgba(239, 68, 68, 0.3)' 
                     }}>
                  <TrendingDown className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-800 mb-1 group-hover:text-red-700 transition-colors duration-300">
                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600 font-bold">Gastos Totais</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-rose-500 h-3 rounded-full transition-all duration-1000 shadow-lg" 
                     style={{ 
                       width: `${totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0}%`,
                       boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                     }}></div>
              </div>
              <span className="text-sm font-bold text-red-600">{state.debts.length} gastos</span>
            </div>
          </div>
        </div>

        <div className="group relative">
          <div className={`absolute inset-0 ${netProfit >= 0 ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-rose-500'} rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500`}></div>
          <div className={`relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border ${netProfit >= 0 ? 'border-emerald-200/50' : 'border-red-200/50'} shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500`}
               style={{ 
                 boxShadow: `0 25px 50px -12px ${netProfit >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}, 0 0 0 1px ${netProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` 
               }}>
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <div className={`absolute inset-0 ${netProfit >= 0 ? 'bg-emerald-400' : 'bg-red-400'} rounded-2xl blur-md opacity-50`}></div>
                <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600'} shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                     style={{ 
                       boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 10px 20px ${netProfit >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` 
                     }}>
                  <Target className={`w-8 h-8 text-white drop-shadow-lg`} />
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-black mb-1 transition-colors duration-300 ${netProfit >= 0 ? 'text-emerald-600 group-hover:text-emerald-700' : 'text-red-600 group-hover:text-red-700'}`}>
                  R$ {Math.abs(netProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600 font-bold">
                  {netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-1000 shadow-lg ${netProfit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                     style={{ 
                       width: `${Math.min(Math.abs(netProfit / (totalReceived || 1)) * 100, 100)}%`,
                       boxShadow: `0 0 10px ${netProfit >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                     }}></div>
              </div>
              <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalReceived > 0 ? ((netProfit / totalReceived) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary with Enhanced 3D Design */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-green-500/10 to-emerald-600/10 blur-3xl"></div>
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-green-200/50 shadow-2xl p-8"
             style={{ 
               boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.15), 0 0 0 1px rgba(34, 197, 94, 0.1)' 
             }}>
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-xl"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 15px 30px rgba(59, 130, 246, 0.3)' 
                     }}>
                  <Calendar className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">
                  Resumo de Hoje
                </h2>
                <p className="text-lg text-slate-600 font-semibold">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
              <div className="relative text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500"
                   style={{ 
                     boxShadow: '0 20px 40px -12px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                   }}>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-50"></div>
                  <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl"
                       style={{ 
                         boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 10px 20px rgba(34, 197, 94, 0.4)' 
                       }}>
                    <ShoppingCart className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-3xl font-black text-green-600 mb-2 group-hover:text-green-700 transition-colors duration-300">
                  R$ {todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-700 font-bold">Vendas Hoje ({todaySales.length})</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
              <div className="relative text-center p-8 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500"
                   style={{ 
                     boxShadow: '0 20px 40px -12px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                   }}>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-red-400 rounded-full blur-md opacity-50"></div>
                  <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl"
                       style={{ 
                         boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 10px 20px rgba(239, 68, 68, 0.4)' 
                       }}>
                    <CreditCard className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-3xl font-black text-red-600 mb-2 group-hover:text-red-700 transition-colors duration-300">
                  R$ {todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-red-700 font-bold">Gastos Hoje ({todayDebts.length})</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className={`absolute inset-0 ${todayProfit >= 0 ? 'bg-gradient-to-br from-blue-400 to-sky-500' : 'bg-gradient-to-br from-red-400 to-rose-500'} rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500`}></div>
              <div className={`relative text-center p-8 bg-gradient-to-br ${todayProfit >= 0 ? 'from-blue-50 to-sky-50' : 'from-red-50 to-rose-50'} rounded-2xl border-2 ${todayProfit >= 0 ? 'border-blue-200' : 'border-red-200'} shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500`}
                   style={{ 
                     boxShadow: `0 20px 40px -12px ${todayProfit >= 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(239, 68, 68, 0.25)'}, inset 0 1px 0 rgba(255, 255, 255, 0.5)` 
                   }}>
                <div className="relative mb-6">
                  <div className={`absolute inset-0 ${todayProfit >= 0 ? 'bg-blue-400' : 'bg-red-400'} rounded-full blur-md opacity-50`}></div>
                  <div className={`relative w-16 h-16 mx-auto bg-gradient-to-br ${todayProfit >= 0 ? 'from-blue-500 to-sky-600' : 'from-red-500 to-rose-600'} rounded-full flex items-center justify-center shadow-xl`}
                       style={{ 
                         boxShadow: `inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 10px 20px ${todayProfit >= 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}` 
                       }}>
                    <Target className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <p className={`text-3xl font-black mb-2 transition-colors duration-300 ${todayProfit >= 0 ? 'text-blue-600 group-hover:text-blue-700' : 'text-red-600 group-hover:text-red-700'}`}>
                  R$ {Math.abs(todayProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm font-bold ${todayProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {todayProfit >= 0 ? 'Lucro Hoje' : 'Prejuízo Hoje'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Charts Section with 3D Effects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profit Analysis Chart with Filter */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 blur-3xl"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-blue-200/50 shadow-2xl p-8"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)' 
               }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl"
                       style={{ 
                         boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 15px 30px rgba(59, 130, 246, 0.4)' 
                       }}>
                    <TrendingUp className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                    Análise de Lucro
                  </h3>
                  <p className="text-slate-600 font-semibold">Receitas vs Gastos</p>
                </div>
              </div>
              
              {/* Filter for Profit Analysis Only */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-lg"></div>
                <div className="relative bg-blue-50/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-4 shadow-xl"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 10px 20px rgba(59, 130, 246, 0.15)' 
                     }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">Período</span>
                  </div>
                  <select
                    value={profitAnalysisPeriod}
                    onChange={(e) => setProfitAnalysisPeriod(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white/90 text-slate-800 font-semibold text-sm border-2 border-blue-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 shadow-lg"
                    style={{ 
                      boxShadow: 'inset 0 2px 4px rgba(59, 130, 246, 0.1)' 
                    }}
                  >
                    <option value="7">Últimos 7 dias</option>
                    <option value="15">Últimos 15 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="60">Últimos 60 dias</option>
                    <option value="90">Últimos 90 dias</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="h-96 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent rounded-2xl"></div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={profitChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight={600}
                    tick={{ fill: '#475569' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight={600}
                    tick={{ fill: '#475569' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      fontWeight: 600,
                      backdropFilter: 'blur(20px)'
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
                    fill="url(#revenueGradient)"
                    stroke="#22c55e"
                    strokeWidth={4}
                    filter="url(#shadow)"
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="url(#expensesGradient)" 
                    radius={[8, 8, 0, 0]}
                    style={{ filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    dot={{ fill: '#3b82f6', strokeWidth: 3, r: 6, filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))' }}
                    activeDot={{ r: 8, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 3, filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5))' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Enhanced Payment Methods Distribution */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 blur-3xl"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-purple-200/50 shadow-2xl p-8"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.1)' 
               }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-xl"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 15px 30px rgba(139, 92, 246, 0.4)' 
                     }}>
                  <CreditCard className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-1 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                  Métodos de Pagamento
                </h3>
                <p className="text-slate-600 font-semibold">Distribuição por tipo</p>
              </div>
            </div>
            
            <div className="h-96 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-50/50 to-transparent rounded-2xl"></div>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <defs>
                    <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={140}
                    paddingAngle={3}
                    dataKey="value"
                    filter="url(#pieShadow)"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{ filter: `drop-shadow(0 4px 8px ${entry.color}40)` }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
                    wrapperStyle={{ fontSize: '14px', fontWeight: 600 }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics with Radial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Overview */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-green-600/10 blur-3xl"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-200/50 shadow-2xl p-8"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.1)' 
               }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 15px 30px rgba(16, 185, 129, 0.4)' 
                     }}>
                  <Activity className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-1 bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                  Performance Geral
                </h3>
                <p className="text-slate-600 font-semibold">Metas vs Realizado</p>
              </div>
            </div>
            
            <div className="h-96 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/50 to-transparent rounded-2xl"></div>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={performanceData}>
                  <defs>
                    <filter id="radialShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#10b981" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <RadialBar 
                    dataKey="value" 
                    cornerRadius={10} 
                    filter="url(#radialShadow)"
                    style={{ filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3))' }}
                  />
                  <Legend 
                    iconSize={18} 
                    wrapperStyle={{ fontSize: '14px', fontWeight: 600 }}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      fontWeight: 600,
                      backdropFilter: 'blur(20px)'
                    }}
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Performance']}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Clients with Enhanced Design */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-amber-600/10 blur-3xl"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-orange-200/50 shadow-2xl p-8"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(251, 146, 60, 0.25), 0 0 0 1px rgba(251, 146, 60, 0.1)' 
               }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 15px 30px rgba(251, 146, 60, 0.4)' 
                     }}>
                  <Users className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-1 bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">
                  Top 5 Clientes
                </h3>
                <p className="text-slate-600 font-semibold">Maiores compradores</p>
              </div>
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {topClients.map((client, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-500"
                       style={{ 
                         boxShadow: '0 10px 20px -5px rgba(251, 146, 60, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                       }}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl blur-md opacity-50"></div>
                        <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl"
                             style={{ 
                               boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 8px 16px rgba(251, 146, 60, 0.3)' 
                             }}>
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg group-hover:text-orange-700 transition-colors duration-300">{client.name}</p>
                        <p className="text-sm text-orange-600 font-bold">{client.count} compras</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-orange-600 text-xl group-hover:text-orange-700 transition-colors duration-300">
                        R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-orange-500 font-semibold">
                        Média: R$ {(client.total / client.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {topClients.length === 0 && (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-30"></div>
                    <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl">
                      <Users className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-slate-500 text-lg font-semibold">Nenhum cliente encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-600/10 via-gray-500/10 to-slate-600/10 blur-3xl"></div>
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8"
             style={{ 
               boxShadow: '0 25px 50px -12px rgba(71, 85, 105, 0.25), 0 0 0 1px rgba(71, 85, 105, 0.1)' 
             }}>
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-slate-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-600 to-gray-700 shadow-xl"
                     style={{ 
                       boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 15px 30px rgba(71, 85, 105, 0.4)' 
                     }}>
                  <Zap className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 bg-gradient-to-r from-slate-700 to-gray-600 bg-clip-text text-transparent">
                  Alertas e Lembretes
                </h2>
                <p className="text-slate-600 font-semibold">Itens que precisam de atenção</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {todayChecks.length > 0 && (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
                <div className="relative p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500"
                     style={{ 
                       boxShadow: '0 20px 40px -12px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                     }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-400 rounded-xl blur-md opacity-50"></div>
                      <div className="relative p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg"
                           style={{ 
                             boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 16px rgba(245, 158, 11, 0.3)' 
                           }}>
                        <AlertTriangle className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <h3 className="font-black text-yellow-800 text-lg group-hover:text-yellow-900 transition-colors duration-300">
                      Cheques Vencendo
                    </h3>
                  </div>
                  <p className="text-yellow-700 font-bold text-xl">{todayChecks.length} cheque(s) vencem hoje</p>
                </div>
              </div>
            )}
            
            {todayBoletos.length > 0 && (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-sky-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
                <div className="relative p-6 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border-2 border-blue-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500"
                     style={{ 
                       boxShadow: '0 20px 40px -12px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                     }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-50"></div>
                      <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-lg"
                           style={{ 
                             boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 16px rgba(59, 130, 246, 0.3)' 
                           }}>
                        <Calendar className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <h3 className="font-black text-blue-800 text-lg group-hover:text-blue-900 transition-colors duration-300">
                      Boletos Vencendo
                    </h3>
                  </div>
                  <p className="text-blue-700 font-bold text-xl">{todayBoletos.length} boleto(s) vencem hoje</p>
                </div>
              </div>
            )}
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
              <div className="relative p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500"
                   style={{ 
                     boxShadow: '0 20px 40px -12px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                   }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-xl blur-md opacity-50"></div>
                    <div className="relative p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg"
                         style={{ 
                           boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 16px rgba(34, 197, 94, 0.3)' 
                         }}>
                      <Users className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <h3 className="font-black text-green-800 text-lg group-hover:text-green-900 transition-colors duration-300">
                    Funcionários Ativos
                  </h3>
                </div>
                <p className="text-green-700 font-bold text-xl">{state.employees.filter(e => e.isActive).length} funcionário(s) ativo(s)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}