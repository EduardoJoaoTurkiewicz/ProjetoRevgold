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
  TrendingDown as TrendingDownIcon
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap
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
      title: 'Vendas Hoje',
      value: `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      count: todaySales.length,
      gradient: 'from-emerald-500 to-emerald-600',
      trend: todayRevenue > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Recebido Hoje',
      value: `R$ ${todayReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      percentage: todayRevenue > 0 ? ((todayReceived / todayRevenue) * 100).toFixed(1) : '0',
      gradient: 'from-blue-500 to-blue-600',
      trend: todayReceived > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Pendente Hoje',
      value: `R$ ${todayPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      count: todaySales.filter(s => s.status !== 'pago').length,
      gradient: 'from-orange-500 to-orange-600',
      trend: todayPending > 0 ? 'down' : 'up'
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      percentage: `${profitMargin.toFixed(1)}%`,
      gradient: 'from-purple-500 to-purple-600',
      trend: netProfit > 0 ? 'up' : 'down'
    }
  ];

  // Add new metrics for today's expenses and due items
  const additionalMetrics = [
    {
      title: 'Gastos Hoje',
      value: `R$ ${todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      count: todayDebts.length + todayEmployeePaymentsDue.length + todayEmployeePaymentsMade.length,
      gradient: 'from-red-500 to-red-600',
      trend: todayExpenses > 0 ? 'down' : 'up'
    },
    {
      title: 'Dívidas Vencendo Hoje',
      value: `${todayChecks.length + todayInstallments.length}`,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      count: todayChecks.length + todayInstallments.length,
      gradient: 'from-orange-500 to-orange-600',
      trend: (todayChecks.length + todayInstallments.length) > 0 ? 'down' : 'up'
    }
  ];

  const allMetrics = [...metrics, ...additionalMetrics];

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
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-red-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-red-500/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl font-bold mb-2"
              >
                Dashboard RevGold
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-emerald-100 text-lg mb-4"
              >
                Gestão Financeira Completa com Analytics Avançados
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex items-center text-emerald-100"
              >
                <Calendar className="w-5 h-5 mr-2" />
                <span>
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
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="hidden md:block"
            >
              <img 
                src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                alt="RevGold Logo" 
                className="h-32 w-auto opacity-95 drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {allMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="card relative overflow-hidden hover-lift"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-2xl`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="text-right">
                    {metric.trend && (
                      <div className={`flex items-center text-xs font-medium ${
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
                      <div className="text-sm text-gray-500 font-medium">{metric.count} item(s)</div>
                    )}
                    {metric.percentage && (
                      <div className="text-sm text-gray-500 font-medium">{metric.percentage}%</div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <motion.p 
                    key={`${metric.title}-${animationKey}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-xl xl:text-2xl font-bold text-gray-900"
                  >
                    {metric.value}
                  </motion.p>
                </div>
              </div>
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
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">Fluxo de Caixa</h3>
              <p className="text-sm text-gray-600">Entradas vs Saídas dos últimos 7 dias</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={cashFlowData} key={`cashflow-${animationKey}`}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="entrada"
                fill="#10b981"
                name="Entradas"
                radius={[4, 4, 0, 0]}
                animationDuration={2000}
              />
              <Bar
                dataKey="saida"
                fill="#ef4444"
                name="Saídas"
                radius={[4, 4, 0, 0]}
                animationDuration={2000}
                animationDelay={300}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Saldo"
                animationDuration={2000}
                animationDelay={600}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Performance Indicators */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">Indicadores de Performance</h3>
              <p className="text-sm text-gray-600">Métricas de desempenho em tempo real</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
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
                label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                background
                clockWise
                dataKey="value"
                cornerRadius={10}
                fill="#8884d8"
                animationDuration={2000}
              />
              <Legend 
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Performance']}
              />
            </RadialBarChart>
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
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">Métodos de Pagamento</h3>
              <p className="text-sm text-gray-600">Distribuição por tipo de pagamento</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart key={`pie-${animationKey}`}>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={40}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={2000}
              >
                {pieChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 500 }}>
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
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">Top Produtos Vendidos</h3>
              <p className="text-sm text-gray-600">Produtos mais vendidos por quantidade</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.quantity} vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    R$ {product.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {topProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
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
        className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
      >
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-red-500 shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-gray-900">Comparativo Mensal</h3>
            <p className="text-sm text-gray-600">Vendas, gastos e lucro dos últimos 6 meses</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyComparisonData} key={`bar-${animationKey}`}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="vendas" 
              fill="#10b981" 
              name="Vendas"
              radius={[4, 4, 0, 0]}
              animationDuration={2000}
            />
            <Bar 
              dataKey="gastos" 
              fill="#ef4444" 
              name="Gastos"
              radius={[4, 4, 0, 0]}
              animationDuration={2000}
              animationDelay={300}
            />
            <Bar 
              dataKey="lucro" 
              fill="#3b82f6" 
              name="Lucro"
              radius={[4, 4, 0, 0]}
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
        className="card"
      >
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
            <TrendingDownIcon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-gray-900">Gastos de Hoje</h3>
            <p className="text-sm text-gray-600">
              {(() => {
                const totalItems = todayDebts.length + todayEmployeePaymentsDue.length + todayEmployeePaymentsMade.length;
                
                return `${totalItems} item(s) - Total: R$ ${todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              })()}
            </p>
          </div>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
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
                  className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        expense.type === 'debt' ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        {expense.type === 'debt' ? (
                          <TrendingDownIcon className="w-4 h-4 text-red-600" />
                        ) : (
                          <Users className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-red-900">{expense.description}</h4>
                        <p className="text-sm text-red-700">{expense.details}</p>
                        <p className="text-xs text-red-600 mt-1">{expense.company}</p>
                        {expense.paymentDescription && (
                          <p className="text-xs text-red-500 mt-1 italic">
                            Como será pago: {expense.paymentDescription}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-900">
                        R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
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
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Nenhum gasto registrado para hoje!</p>
              </div>
            );
          })()}
        </div>
      </motion.div>
      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Vencimentos Hoje
          </h3>
          
          <div className="space-y-3">
            {todayChecks.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200"
              >
                <h4 className="font-medium text-blue-900 mb-2">Cheques ({todayChecks.length})</h4>
                <p className="text-sm text-blue-700">
                  Total: R$ {todayChecks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {todayInstallments.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200"
              >
                <h4 className="font-medium text-green-900 mb-2">Parcelas ({todayInstallments.length})</h4>
                <p className="text-sm text-green-700">
                  Total: R$ {todayInstallments.reduce((sum, inst) => sum + inst.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {todayChecks.length === 0 && todayInstallments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Nenhum vencimento hoje!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Overdue Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Itens Vencidos
          </h3>
          
          <div className="space-y-3">
            {overdueChecks.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200"
              >
                <h4 className="font-medium text-red-900 mb-2">Cheques ({overdueChecks.length})</h4>
                <p className="text-sm text-red-700">
                  Total: R$ {overdueChecks.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {overdueInstallments.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200"
              >
                <h4 className="font-medium text-orange-900 mb-2">Parcelas ({overdueInstallments.length})</h4>
                <p className="text-sm text-orange-700">
                  Total: R$ {overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
            
            {overdueChecks.length === 0 && overdueInstallments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Nenhum item vencido!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            Resumo Mensal
          </h3>
          
          <div className="space-y-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-purple-700">Vendas</span>
                <span className="text-lg font-bold text-purple-900">{monthlySales.length}</span>
              </div>
              <div className="text-sm text-purple-600">
                R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">Recebido</span>
                <span className="text-lg font-bold text-green-900">
                  {monthlyRevenue > 0 ? ((monthlyReceived / monthlyRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="text-sm text-green-600">
                R$ {monthlyReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Cheques Ativos</span>
                <span className="text-lg font-bold text-gray-900">{state.checks.length}</span>
              </div>
              <div className="text-sm text-gray-600">
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
        className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-emerald-600" />
          Atividade Recente
        </h3>
        
        {state.sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.sales.slice(-5).reverse().map((sale, index) => (
                  <motion.tr 
                    key={sale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{sale.client}</td>
                    <td className="py-3 px-4 text-sm font-semibold">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sale.status === 'pago' ? 'bg-green-100 text-green-700' :
                        sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
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
          <p className="text-gray-500 text-center py-8">Nenhuma atividade recente.</p>
        )}
      </motion.div>
    </div>
  );
}