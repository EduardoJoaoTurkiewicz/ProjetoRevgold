import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Users,
  CreditCard,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown as TrendingDownIcon,
  Briefcase,
  Receipt,
  FileText,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const { state } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Trigger animation refresh every 5 seconds
  useEffect(() => {
    const animationTimer = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(animationTimer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  
  // Calculate today's metrics
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const todayReceived = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const todayPending = todaySales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
  
  const todayChecks = state.checks.filter(check => check.dueDate === today);
  const overdueChecks = state.checks.filter(check => 
    check.dueDate < today && check.status === 'pendente'
  );
  
  const todayInstallments = state.installments.filter(installment => 
    installment.dueDate === today && !installment.isPaid
  );
  const overdueInstallments = state.installments.filter(installment => 
    installment.dueDate < today && !installment.isPaid
  );

  // Today's expenses including employee payments
  const todayDebts = state.debts.filter(debt => debt.date === today);
  const todayEmployeePaymentsDue = state.employees.filter(employee => {
    if (!employee.isActive) return false;
    const todayDate = new Date();
    return todayDate.getDate() === employee.paymentDay;
  });
  const todayEmployeePaymentsMade = state.employeePayments?.filter(payment => 
    payment.paymentDate === today
  ) || [];
  
  const todayExpenses = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0) +
                       todayEmployeePaymentsDue.reduce((sum, emp) => sum + emp.salary, 0) +
                       todayEmployeePaymentsMade.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate monthly metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySales = state.sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const monthlyReceived = monthlySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);

  // Payment method distribution for pie chart
  const paymentMethodStats = state.sales.reduce((acc, sale) => {
    sale.paymentMethods.forEach(method => {
      const key = method.type.replace('_', ' ');
      acc[key] = (acc[key] || 0) + method.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  // Weekly sales data for line chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const weeklyData = last7Days.map(date => {
    const daySales = state.sales.filter(sale => sale.date === date);
    const dayRevenue = daySales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const dayReceived = daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      vendas: dayRevenue,
      recebido: dayReceived,
      pendente: dayRevenue - dayReceived
    };
  });

  // Monthly comparison data for bar chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date;
  });

  const monthlyComparisonData = last6Months.map(date => {
    const monthSales = state.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
    });
    const monthDebts = state.debts.filter(debt => {
      const debtDate = new Date(debt.date);
      return debtDate.getMonth() === date.getMonth() && debtDate.getFullYear() === date.getFullYear();
    });
    
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      vendas: monthSales.reduce((sum, sale) => sum + sale.totalValue, 0),
      gastos: monthDebts.reduce((sum, debt) => sum + debt.totalValue, 0),
      lucro: monthSales.reduce((sum, sale) => sum + sale.totalValue, 0) - monthDebts.reduce((sum, debt) => sum + debt.totalValue, 0)
    };
  });

  // Pie chart data
  const pieChartData = Object.entries(paymentMethodStats).map(([method, amount]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1),
    value: amount,
    percentage: ((amount / Object.values(paymentMethodStats).reduce((sum, val) => sum + val, 0)) * 100).toFixed(1)
  }));

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // Advanced metrics calculations
  const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalExpenses = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
  
  // Cash flow data
  const cashFlowData = last7Days.map(date => {
    const daySales = state.sales.filter(sale => sale.date === date);
    const dayDebts = state.debts.filter(debt => debt.date === date);
    const dayRevenue = daySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    const dayExpenses = dayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      entrada: dayRevenue,
      saida: dayExpenses,
      saldo: dayRevenue - dayExpenses
    };
  });

  // Performance indicators
  const performanceData = [
    {
      name: 'Vendas',
      value: (todayRevenue / (monthlyRevenue || 1)) * 100,
      fill: '#10b981'
    },
    {
      name: 'Recebimentos',
      value: (todayReceived / (monthlyReceived || 1)) * 100,
      fill: '#3b82f6'
    },
    {
      name: 'Cheques',
      value: (state.checks.filter(c => c.status === 'compensado').length / (state.checks.length || 1)) * 100,
      fill: '#8b5cf6'
    }
  ];

  // Client distribution
  const clientStats = state.sales.reduce((acc, sale) => {
    acc[sale.client] = (acc[sale.client] || 0) + sale.totalValue;
    return acc;
  }, {} as Record<string, number>);

  // Product distribution
  const productStats = state.sales.reduce((acc, sale) => {
    if (Array.isArray(sale.products)) {
      sale.products.forEach(product => {
        if (product.name) {
          if (!acc[product.name]) {
            acc[product.name] = { quantity: 0, value: 0 };
          }
          acc[product.name].quantity += product.quantity || 1;
          acc[product.name].value += product.totalPrice || 0;
        }
      });
    } else {
      // Fallback for old format
      const products = sale.products.split(',').map(p => p.trim());
      products.forEach(product => {
        if (product) {
          if (!acc[product]) {
            acc[product] = { quantity: 0, value: 0 };
          }
          acc[product].quantity += 1;
          acc[product].value += sale.totalValue / products.length;
        }
      });
    }
    return acc;
  }, {} as Record<string, { quantity: number; value: number }>);

  const topProducts = Object.entries(productStats)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(([product, data]) => ({
      name: product,
      quantity: data.quantity,
      value: data.value
    }));

  const metrics = [
    {
      title: 'Faturamento Hoje',
      value: `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Briefcase,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      count: todaySales.length,
      gradient: 'from-emerald-600 to-emerald-700',
      trend: todayRevenue > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Recebimentos Hoje',
      value: `R$ ${todayReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      percentage: todayRevenue > 0 ? ((todayReceived / todayRevenue) * 100).toFixed(1) : '0',
      gradient: 'from-blue-600 to-blue-700',
      trend: todayReceived > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Gastos Hoje',
      value: `R$ ${todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      count: todayDebts.length + todayEmployeePaymentsDue.length + todayEmployeePaymentsMade.length,
      gradient: 'from-red-500 to-red-600',
      trend: todayDebts.length > 0 ? 'down' : 'up'
    },
    {
      title: 'Saldo Líquido',
      value: `R$ ${(todayReceived - todayExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Target,
      color: todayReceived - todayExpenses >= 0 ? 'text-emerald-600' : 'text-red-600',
      bgColor: todayReceived - todayExpenses >= 0 ? 'bg-emerald-100' : 'bg-red-100',
      count: todaySales.length,
      gradient: todayReceived - todayExpenses >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
      trend: todayReceived - todayExpenses >= 0 ? 'up' : 'down'
    }
  ];


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-300 mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              Central de Comando
            </h1>
            <p className="text-slate-200 text-xl mb-4">
              Sistema Integrado de Gestão Empresarial
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-slate-300">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span>
                  {currentTime.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-mono text-lg">
                  {currentTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-right">
                <p className="text-slate-300 text-sm mb-1">Lucro Mensal</p>
                <p className="text-3xl font-bold text-white">
                  R$ {(monthlyRevenue - state.debts.filter(debt => {
                    const debtDate = new Date(debt.date);
                    return debtDate.getMonth() === currentMonth && debtDate.getFullYear() === currentYear;
                  }).reduce((sum, debt) => sum + debt.totalValue, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right mt-2">
                <p className="text-slate-300 text-sm">Meta: R$ 500.000,00</p>
                <div className="w-32 bg-white/20 rounded-full h-2 mt-1">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${Math.min(100, ((monthlyRevenue - state.debts.filter(debt => {
                        const debtDate = new Date(debt.date);
                        return debtDate.getMonth() === currentMonth && debtDate.getFullYear() === currentYear;
                      }).reduce((sum, debt) => sum + debt.totalValue, 0)) / 500000) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Vendas Mês</p>
              <p className="text-2xl font-bold text-slate-900">{monthlySales.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Cheques Ativos</p>
              <p className="text-2xl font-bold text-slate-900">{state.checks.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Boletos</p>
              <p className="text-2xl font-bold text-slate-900">{state.boletos.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-100">
              <Receipt className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Funcionários</p>
              <p className="text-2xl font-bold text-slate-900">{state.employees.filter(e => e.isActive).length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
                {currentTime.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <Clock className="w-5 h-5 ml-6 mr-2" />
              <span>
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 relative overflow-hidden hover-lift"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-xl`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="text-right">
                    {metric.trend && (
                      <div className={`flex items-center text-xs font-bold ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {metric.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
                         metric.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                        {metric.trend === 'up' ? 'Positivo' : 
                         metric.trend === 'down' ? 'Atenção' : 'Neutro'}
                      </div>
                    )}
                    {metric.count !== undefined && (
                      <div className="text-sm text-slate-500 font-bold">{metric.count} item(s)</div>
                    )}
                    {metric.percentage && (
                      <div className="text-sm text-slate-500 font-bold">{metric.percentage}%</div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600 mb-2">{metric.title}</p>
                  <motion.p 
                    key={`${metric.title}-${animationKey}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-2xl xl:text-3xl font-bold text-slate-900"
                  >
                    {metric.value}
                  </motion.p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50 opacity-50" />
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Cash Flow Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-slate-900">Fluxo de Caixa Semanal</h3>
              <p className="text-slate-600 font-medium">Análise detalhada dos últimos 7 dias</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={cashFlowData} key={`cashflow-${animationKey}`}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#475569"
                fontSize={13}
                fontWeight="600"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#475569"
                fontSize={13}
                fontWeight="600"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontWeight: '600' }} />
              <Bar
                dataKey="entrada"
                fill="#059669"
                name="Entradas"
                radius={[6, 6, 0, 0]}
                animationDuration={2000}
              />
              <Bar
                dataKey="saida"
                fill="#ef4444"
                name="Saídas"
                radius={[6, 6, 0, 0]}
                animationDuration={2000}
                animationDelay={300}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#1e40af"
                strokeWidth={4}
                name="Saldo"
                animationDuration={2000}
                animationDelay={600}
                dot={{ fill: '#1e40af', strokeWidth: 3, r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Performance Indicators */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-slate-900">KPIs Empresariais</h3>
              <p className="text-slate-600 font-medium">Indicadores chave de performance</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="80%" 
              data={performanceData}
              key={`radial-${animationKey}`}
            >
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 14, fontWeight: 'bold' }}
                background
                clockWise
                dataKey="value"
                cornerRadius={15}
                fill="#8884d8"
                animationDuration={2000}
              />
              <Legend 
                iconSize={12}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontWeight: '600' }}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 600 }}>
                    {value}
                  </span>
                )}
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Performance']}
                contentStyle={{ fontWeight: '600' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* New Advanced Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Sales Funnel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-slate-900">Funil de Vendas</h3>
              <p className="text-slate-600 font-medium">Conversão por etapa do processo</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <FunnelChart key={`funnel-${animationKey}`}>
              <Tooltip 
                formatter={(value, name) => [`${value}`, name]}
                contentStyle={{ fontWeight: '600' }}
              />
              <Funnel
                dataKey="value"
                data={[
                  { name: 'Leads Gerados', value: state.sales.length + 50, fill: '#3b82f6' },
                  { name: 'Propostas Enviadas', value: state.sales.length + 20, fill: '#6366f1' },
                  { name: 'Negociações', value: state.sales.length + 10, fill: '#8b5cf6' },
                  { name: 'Vendas Fechadas', value: state.sales.length, fill: '#059669' }
                ]}
                animationDuration={2000}
              >
                <LabelList position="center" fill="#fff" stroke="none" fontSize={14} fontWeight="bold" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Scatter Plot - Revenue vs Time */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 shadow-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-slate-900">Dispersão de Vendas</h3>
              <p className="text-slate-600 font-medium">Valor vs Frequência de vendas</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart key={`scatter-${animationKey}`}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Dia do Mês"
                stroke="#475569"
                fontSize={13}
                fontWeight="600"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Valor"
                stroke="#475569"
                fontSize={13}
                fontWeight="600"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => [
                  name === 'Valor' ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
                  name
                ]}
                contentStyle={{ fontWeight: '600' }}
              />
              <Scatter
                name="Vendas"
                data={state.sales.map(sale => ({
                  x: new Date(sale.date).getDate(),
                  y: sale.totalValue
                }))}
                fill="#059669"
                animationDuration={2000}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Payment Methods Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 shadow-xl">
              <PieChart className="w-8 h-8 text-white" />
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-slate-900">Métodos de Pagamento</h3>
              <p className="text-slate-600 font-medium">Distribuição por modalidade</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <RechartsPieChart key={`pie-${animationKey}`}>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={50}
                paddingAngle={8}
                dataKey="value"
                animationBegin={0}
                animationDuration={2000}
              >
                {pieChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={3}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={40}
                wrapperStyle={{ fontWeight: '600' }}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 600 }}>
                    {value}
                  </span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Clients */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-700 shadow-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-slate-900">Produtos Mais Vendidos</h3>
              <p className="text-slate-600 font-medium">Ranking por volume de vendas</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {topProducts.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl hover:from-slate-100 hover:to-slate-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                    index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700' :
                    'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{product.name}</p>
                    <p className="text-sm text-slate-600 font-medium">{product.quantity} unidades vendidas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-lg">
                    R$ {product.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">Faturamento</p>
                </div>
              </motion.div>
            ))}
            
            {topProducts.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Nenhum produto vendido ainda.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bar Chart - Monthly Comparison */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-red-600 shadow-xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div className="ml-6">
            <h3 className="text-2xl font-bold text-slate-900">Análise Comparativa Mensal</h3>
            <p className="text-slate-600 font-medium">Performance financeira dos últimos 6 meses</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={monthlyComparisonData} key={`bar-${animationKey}`}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#475569"
              fontSize={14}
              fontWeight="600"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#475569"
              fontSize={14}
              fontWeight="600"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontWeight: '600' }} />
            <Bar 
              dataKey="vendas" 
              fill="#059669" 
              name="Vendas"
              radius={[6, 6, 0, 0]}
              animationDuration={2000}
            />
            <Bar 
              dataKey="gastos" 
              fill="#ef4444" 
              name="Gastos"
              radius={[6, 6, 0, 0]}
              animationDuration={2000}
              animationDelay={300}
            />
            <Bar 
              dataKey="lucro" 
              fill="#1e40af" 
              name="Lucro"
              radius={[6, 6, 0, 0]}
              animationDuration={2000}
              animationDelay={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>


      {/* Today's Expenses */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-xl">
            <TrendingDownIcon className="w-8 h-8 text-white" />
          </div>
          <div className="ml-6">
            <h3 className="text-2xl font-bold text-slate-900">Despesas do Dia</h3>
            <p className="text-slate-600 font-medium">
              {(() => {
                const totalItems = todayDebts.length + todayEmployeePaymentsDue.length + todayEmployeePaymentsMade.length;
                
                return `${totalItems} item(s) - Total: R$ ${todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              })()}
            </p>
          </div>
        </div>
        
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {(() => {
            const allExpenses = [
              ...todayDebts.map(debt => ({
                type: 'debt',
                description: debt.description,
                company: debt.company,
                amount: debt.totalValue,
                details: `Dívida - ${debt.company}`,
                status: debt.isPaid ? 'Pago' : 'Pendente',
                paymentDescription: debt.debtPaymentDescription
              })),
              ...todayEmployeePaymentsDue.map(employee => ({
                type: 'employee_due',
                description: `Pagamento - ${employee.name}`,
                company: employee.position,
                amount: employee.salary,
                details: `Salário - ${employee.position}`,
                status: 'Devido',
                paymentDescription: `Pagamento de salário devido no dia ${employee.paymentDay}`
              })),
              ...todayEmployeePaymentsMade.map(payment => {
                const employee = state.employees.find(e => e.id === payment.employeeId);
                return {
                  type: 'employee_paid',
                  description: `Pagamento - ${employee?.name || 'Funcionário'}`,
                  company: employee?.position || 'N/A',
                  amount: payment.amount,
                  details: `Salário pago - ${employee?.position || 'N/A'}`,
                  status: payment.isPaid ? 'Pago' : 'Pendente',
                  paymentDescription: payment.observations || 'Pagamento de salário realizado'
                };
              })
            ];
            
            return allExpenses.length > 0 ? (
              allExpenses.map((expense, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shadow-lg ${
                        expense.type === 'debt' ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        {expense.type === 'debt' ? (
                          <TrendingDownIcon className="w-6 h-6 text-red-600" />
                        ) : (
                          <Users className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-red-900 text-lg">{expense.description}</h4>
                        <p className="text-sm text-red-700 font-medium">{expense.details}</p>
                        <p className="text-xs text-red-600 mt-1 font-medium">{expense.company}</p>
                        {expense.paymentDescription && (
                          <p className="text-xs text-red-500 mt-2 italic font-medium">
                            Como será pago: {expense.paymentDescription}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-900 text-lg">
                        R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        expense.status === 'Pago' ? 'bg-green-100 text-green-700' : 
                        expense.status === 'Devido' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                <p className="text-lg font-medium">Nenhuma despesa registrada para hoje!</p>
              </div>
            );
          })()}
        </div>
      </motion.div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-3 text-blue-600" />
            Vencimentos Hoje
          </h3>
          
          <div className="space-y-4">
            {todayChecks.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-lg"
              >
                <h4 className="font-bold text-blue-900 mb-2 text-lg">Cheques ({todayChecks.length})</h4>
                <p className="text-sm text-blue-700 font-medium">
                  Total: R$ {todayChecks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {todayInstallments.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 shadow-lg"
              >
                <h4 className="font-bold text-emerald-900 mb-2 text-lg">Parcelas ({todayInstallments.length})</h4>
                <p className="text-sm text-emerald-700 font-medium">
                  Total: R$ {todayInstallments.reduce((sum, inst) => sum + inst.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {todayChecks.length === 0 && todayInstallments.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                <p className="font-medium text-lg">Nenhum vencimento hoje!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Overdue Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
            Itens Vencidos
          </h3>
          
          <div className="space-y-4">
            {overdueChecks.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200 shadow-lg"
              >
                <h4 className="font-bold text-red-900 mb-2 text-lg">Cheques ({overdueChecks.length})</h4>
                <p className="text-sm text-red-700 font-medium">
                  Total: R$ {overdueChecks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {overdueInstallments.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 shadow-lg"
              >
                <h4 className="font-bold text-orange-900 mb-2 text-lg">Parcelas ({overdueInstallments.length})</h4>
                <p className="text-sm text-orange-700 font-medium">
                  Total: R$ {overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {overdueChecks.length === 0 && overdueInstallments.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                <p className="font-medium text-lg">Nenhum item vencido!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Target className="w-6 h-6 mr-3 text-purple-600" />
            Resumo Mensal
          </h3>
          
          <div className="space-y-6">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl shadow-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-purple-700">Vendas</span>
                <span className="text-2xl font-bold text-purple-900">{monthlySales.length}</span>
              </div>
              <div className="text-sm text-purple-600 font-medium">
                R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl shadow-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-emerald-700">Recebido</span>
                <span className="text-2xl font-bold text-emerald-900">
                  {monthlyRevenue > 0 ? ((monthlyReceived / monthlyRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="text-sm text-emerald-600 font-medium">
                R$ {monthlyReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl shadow-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700">Cheques Ativos</span>
                <span className="text-2xl font-bold text-slate-900">{state.checks.length}</span>
              </div>
              <div className="text-sm text-slate-600 font-medium">
                R$ {state.checks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.6 }}
        className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
      >
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Activity className="w-6 h-6 mr-3 text-emerald-600" />
          Atividade Recente
        </h3>
        
        {state.sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Data</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.sales.slice(-5).reverse().map((sale, index) => (
                  <motion.tr 
                    key={sale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold">{sale.client}</td>
                    <td className="py-4 px-6 text-sm font-bold text-emerald-600">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        sale.status === 'pago' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        sale.status === 'parcial' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {sale.status === 'pago' ? 'Pago' :
                         sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12 font-medium text-lg">Nenhuma atividade recente.</p>
        )}
      </motion.div>
    </div>
  );
}