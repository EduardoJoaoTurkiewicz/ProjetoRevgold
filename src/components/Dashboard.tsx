import React, { useState, useEffect, Suspense } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Users, Calendar, Clock, AlertTriangle, CheckCircle, CreditCard, Receipt, Activity, Target, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load Three.js components to avoid initial loading issues
const DataVisualization3D = React.lazy(() => 
  Promise.all([
    import('@react-three/fiber'),
    import('@react-three/drei')
  ]).then(([fiber, drei]) => ({
    default: ({ data }: { data: any[] }) => {
      const { Canvas } = fiber;
      const { OrbitControls, Text, Box } = drei;
      
      return (
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls enableZoom={false} enablePan={false} />
          
          {data.map((item, index) => (
            <group key={index} position={[index * 2 - 4, 0, 0]}>
              <Box
                args={[1, Math.max(item.value / 1000, 0.5), 1]}
                position={[0, Math.max(item.value / 2000, 0.25), 0]}
              >
                <meshStandardMaterial color={`hsl(${120 + index * 60}, 70%, 50%)`} />
              </Box>
              <Text
                position={[0, -2, 0]}
                fontSize={0.5}
                color="#374151"
                anchorX="center"
                anchorY="middle"
              >
                {item.name}
              </Text>
            </group>
          ))}
        </Canvas>
      );
    }
  })).catch(() => ({
    default: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando visualização 3D...</p>
        </div>
      </div>
    )
  }))
);

const PieChart3D = React.lazy(() => 
  Promise.all([
    import('@react-three/fiber'),
    import('@react-three/drei')
  ]).then(([fiber, drei]) => ({
    default: ({ data }: { data: any[] }) => {
      const { Canvas } = fiber;
      const { OrbitControls, Sphere } = drei;
      
      // Prevent NaN values by ensuring total is not zero
      const total = data.reduce((sum, item) => sum + item.value, 0);
      
      // If total is zero, don't render any spheres to avoid NaN errors
      if (total === 0) {
        return (
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        );
      }
      
      return (
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls enableZoom={false} enablePan={false} />
          
          {data.map((item, index) => {
            const angle = (item.value / total) * Math.PI * 2;
            const startAngle = data.slice(0, index).reduce((sum, prev) => sum + ((prev.value || 0) / total) * Math.PI * 2, 0);
            
            // Skip rendering if angle is NaN or zero
            if (isNaN(angle) || angle === 0) return null;
            
            return (
              <group key={index} rotation={[0, 0, startAngle]}>
                <Sphere args={[2, 32, 16, 0, Math.max(angle, 0.01)]} position={[0, 0, 0]}>
                  <meshStandardMaterial color={item.fill} />
                </Sphere>
              </group>
            );
          })}
        </Canvas>
      );
    }
  })).catch(() => ({
    default: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando gráfico 3D...</p>
        </div>
      </div>
    )
  }))
);

export function Dashboard() {
  const { state } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState('sales');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate metrics
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);

  // Calculate today's expenses
  const today = new Date().toISOString().split('T')[0];
  const todayExpenses = state.debts
    .filter(debt => debt.date === today)
    .reduce((sum, debt) => sum + debt.totalValue, 0) +
    (state.employeePayments || [])
    .filter(payment => payment.paymentDate === today)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Today's items
  const todayChecks = state.checks.filter(check => check.dueDate === today);
  const todayBoletos = state.boletos.filter(boleto => boleto.dueDate === today);
  const todayInstallments = state.installments.filter(installment => installment.dueDate === today);

  // Overdue items
  const overdueChecks = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
  const overdueBoletos = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
  const overdueInstallments = state.installments.filter(installment => installment.dueDate < today && !installment.isPaid);

  // Employee payments due today
  const employeesPaymentDueToday = state.employees.filter(employee => {
    if (!employee.isActive) return false;
    const paymentDay = employee.paymentDay;
    return currentTime.getDate() === paymentDay;
  });

  // Advanced chart data
  const salesTrendData = state.sales
    .slice(-30)
    .reduce((acc, sale) => {
      const date = sale.date;
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.value += sale.totalValue;
        existing.count += 1;
      } else {
        acc.push({
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: sale.totalValue,
          count: 1,
          received: sale.receivedAmount,
          pending: sale.pendingAmount
        });
      }
      return acc;
    }, [] as any[]);

  // 3D Chart data
  const chart3DData = [
    { name: 'Vendas', value: totalSales },
    { name: 'Recebido', value: totalReceived },
    { name: 'Pendente', value: totalPending },
    { name: 'Dívidas', value: totalDebts }
  ];

  // Radial chart data
  const radialData = [
    { name: 'Recebido', value: totalReceived, fill: '#10b981' },
    { name: 'Pendente', value: totalPending, fill: '#f59e0b' },
    { name: 'Dívidas', value: totalDebts, fill: '#ef4444' }
  ];

  // Performance metrics
  const performanceData = [
    { name: 'Jan', vendas: 4000, recebido: 2400, meta: 3000 },
    { name: 'Fev', vendas: 3000, recebido: 1398, meta: 3000 },
    { name: 'Mar', vendas: 2000, recebido: 9800, meta: 3000 },
    { name: 'Abr', vendas: 2780, recebido: 3908, meta: 3000 },
    { name: 'Mai', vendas: 1890, recebido: 4800, meta: 3000 },
    { name: 'Jun', vendas: 2390, recebido: 3800, meta: 3000 },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Professional Header */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="card bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200"
      >
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="flex items-center gap-6 mb-6 lg:mb-0">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-xl">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="w-16 h-16 object-contain filter brightness-0 invert"
                />
              </div>
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent"
              >
                {getGreeting()}, {state.user?.username}!
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-slate-600 text-lg font-medium"
              >
                Dashboard Executivo - RevGold System
              </motion.p>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-right bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center text-emerald-700 mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="text-lg font-bold">
                {currentTime.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center text-slate-600">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-lg font-bold">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            title: 'Total em Vendas',
            value: totalSales,
            count: state.sales.length,
            icon: DollarSign,
            color: 'emerald',
            trend: '+12.5%',
            trendUp: true
          },
          {
            title: 'Recebido',
            value: totalReceived,
            percentage: ((totalReceived / totalSales) * 100 || 0).toFixed(1),
            icon: TrendingUp,
            color: 'green',
            trend: '+8.2%',
            trendUp: true
          },
          {
            title: 'Pendente',
            value: totalPending,
            percentage: ((totalPending / totalSales) * 100 || 0).toFixed(1),
            icon: Clock,
            color: 'amber',
            trend: '-3.1%',
            trendUp: false
          },
          {
            title: 'Gastos Hoje',
            value: todayExpenses,
            count: 'hoje',
            icon: TrendingDown,
            color: 'red',
            trend: '+5.7%',
            trendUp: true
          },
          {
            title: 'Total em Dívidas',
            value: totalDebts,
            count: state.debts.length,
            icon: CreditCard,
            color: 'purple',
            trend: '-2.3%',
            trendUp: false
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 }}
            className={`card bg-gradient-to-br from-white to-${metric.color}-50 border-${metric.color}-200 hover:shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600 shadow-lg`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${
                metric.trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trendUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {metric.trend}
              </div>
            </div>
            
            <div>
              <p className="text-slate-600 text-sm font-bold uppercase tracking-wider mb-2">
                {metric.title}
              </p>
              <p className="text-3xl font-black text-slate-800 mb-2">
                R$ {metric.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-slate-500 text-sm font-medium">
                {metric.percentage ? `${metric.percentage}% do total` : 
                 typeof metric.count === 'number' ? `${metric.count} registros` : metric.count}
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((metric.value / Math.max(totalSales, totalDebts)) * 100, 100)}%` }}
                transition={{ duration: 1.5, delay: index * 0.2 }}
                className={`h-full bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-600 rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3D Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 3D Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="card bg-gradient-to-br from-white to-blue-50 border-blue-200"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Visualização 3D - Métricas</h3>
              <p className="text-slate-600">Análise tridimensional dos dados financeiros</p>
            </div>
          </div>
          
          <div className="h-80 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-blue-100">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando visualização...</p>
                </div>
              </div>
            }>
              <DataVisualization3D data={chart3DData} />
            </Suspense>
          </div>
        </motion.div>

        {/* 3D Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="card bg-gradient-to-br from-white to-purple-50 border-purple-200"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Distribuição 3D</h3>
              <p className="text-slate-600">Proporção visual dos valores</p>
            </div>
          </div>
          
          <div className="h-80 bg-gradient-to-br from-slate-50 to-purple-50 rounded-xl border border-purple-100">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando gráfico...</p>
                </div>
              </div>
            }>
              <PieChart3D data={radialData} />
            </Suspense>
          </div>
          
          <div className="grid grid-cols-1 gap-3 mt-6">
            {radialData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="text-slate-800 font-bold">
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Advanced Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="card bg-gradient-to-br from-white to-emerald-50 border-emerald-200"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Análise de Tendências</h3>
            <p className="text-slate-600">Performance detalhada de vendas e recebimentos</p>
          </div>
        </div>
        
        {salesTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={salesTrendData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorValue)"
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="received" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorReceived)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-50 to-emerald-50 rounded-xl border border-emerald-100">
            <div className="text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
              <p className="text-xl font-bold text-slate-600">Aguardando dados de vendas</p>
              <p className="text-slate-500">Os gráficos aparecerão quando houver vendas registradas</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="card bg-gradient-to-br from-white to-indigo-50 border-indigo-200"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Performance vs Metas</h3>
            <p className="text-slate-600">Comparativo mensal de resultados</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
            />
            <Bar dataKey="vendas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recebido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="meta" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Cheques', count: state.checks.length, pending: state.checks.filter(c => c.status === 'pendente').length, icon: Receipt, color: 'purple' },
          { title: 'Boletos', count: state.boletos.length, pending: state.boletos.filter(b => b.status === 'pendente').length, icon: Receipt, color: 'indigo' },
          { title: 'Funcionários', count: state.employees.filter(e => e.isActive).length, pending: 0, icon: Users, color: 'teal' },
          { title: 'Parcelas', count: state.installments.length, pending: state.installments.filter(i => !i.isPaid).length, icon: Calendar, color: 'amber' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 + 1 }}
            className={`card bg-gradient-to-br from-white to-${stat.color}-50 border-${stat.color}-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-bold uppercase tracking-wider mb-2">
                  {stat.title}
                </p>
                <p className="text-2xl font-black text-slate-800 mb-1">{stat.count}</p>
                <p className="text-slate-500 text-sm font-medium">
                  {stat.pending > 0 ? `${stat.pending} pendentes` : 'ativos'}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {(todayChecks.length === 0 && todayBoletos.length === 0 && todayInstallments.length === 0 && 
          overdueChecks.length === 0 && overdueBoletos.length === 0 && overdueInstallments.length === 0 &&
          employeesPaymentDueToday.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
          >
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <motion.div 
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="p-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl mx-auto mb-6 w-fit"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Sistema em Perfeita Ordem!</h3>
                <p className="text-slate-600 text-lg">
                  Todos os processos financeiros estão atualizados. Excelente gestão!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}