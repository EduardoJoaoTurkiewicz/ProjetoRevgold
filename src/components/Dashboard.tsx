import React, { useState, useEffect, Suspense } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Users, Calendar, Clock, AlertTriangle, CheckCircle, CreditCard, Receipt, Minus, Activity, Target, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar } from 'recharts';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';

// 3D Components
function AnimatedBox({ position, color, scale = 1 }: { position: [number, number, number], color: string, scale?: number }) {
  const meshRef = React.useRef<any>();
  
  React.useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <Box ref={meshRef} position={position} scale={[scale, scale, scale]}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </Box>
  );
}

function FloatingSphere({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = React.useRef<any>();
  
  React.useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.3, 32, 32]}>
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
    </Sphere>
  );
}

function Scene3D({ data }: { data: any }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
      
      <AnimatedBox position={[-2, 0, 0]} color="#10b981" scale={data.sales / 10000} />
      <AnimatedBox position={[0, 0, 0]} color="#3b82f6" scale={data.received / 10000} />
      <AnimatedBox position={[2, 0, 0]} color="#f59e0b" scale={data.pending / 10000} />
      
      <FloatingSphere position={[-3, 2, 0]} color="#ef4444" />
      <FloatingSphere position={[3, 2, 0]} color="#8b5cf6" />
      
      <Text
        position={[0, -2, 0]}
        fontSize={0.5}
        color="#064e3b"
        anchorX="center"
        anchorY="middle"
      >
        RevGold Analytics
      </Text>
      
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

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
    state.employeePayments
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
      scale: 1.05,
      y: -10,
      transition: { duration: 0.3 }
    }
  };

  const sceneData = {
    sales: totalSales,
    received: totalReceived,
    pending: totalPending,
    debts: totalDebts
  };

  return (
    <div className="space-y-8 pb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 min-h-screen">
      {/* Futuristic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-slate-800/90 to-emerald-900/90 backdrop-blur-xl"></div>
        <div className="relative card bg-transparent border-emerald-400/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-3xl blur-lg opacity-75"></div>
                <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-900 shadow-2xl">
                  <img 
                    src="/image.png" 
                    alt="RevGold Logo" 
                    className="w-20 h-20 object-contain filter drop-shadow-2xl"
                  />
                </div>
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-5xl font-black mb-3 bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent"
                >
                  {getGreeting()}, {state.user?.username}!
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-emerald-200 text-xl font-medium"
                >
                  Centro de Comando Financeiro RevGold
                </motion.p>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-right"
            >
              <div className="flex items-center text-emerald-300 mb-3">
                <Calendar className="w-6 h-6 mr-3" />
                <span className="text-xl font-bold">
                  {currentTime.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center text-emerald-300">
                <Clock className="w-6 h-6 mr-3" />
                <span className="text-xl font-bold">
                  {currentTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 3D Interactive Scene */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="card bg-gradient-to-br from-slate-900/90 to-emerald-900/90 border-emerald-400/30 h-96"
      >
        <div className="h-full w-full">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
            </div>
          }>
            <Canvas camera={{ position: [0, 0, 8] }}>
              <Scene3D data={sceneData} />
            </Canvas>
          </Suspense>
        </div>
      </motion.div>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            title: 'Total em Vendas',
            value: totalSales,
            count: state.sales.length,
            icon: DollarSign,
            color: 'from-emerald-600 to-emerald-800',
            textColor: 'text-emerald-300',
            bgColor: 'from-emerald-900/20 to-emerald-800/20'
          },
          {
            title: 'Recebido',
            value: totalReceived,
            percentage: ((totalReceived / totalSales) * 100 || 0).toFixed(1),
            icon: TrendingUp,
            color: 'from-green-600 to-green-800',
            textColor: 'text-green-300',
            bgColor: 'from-green-900/20 to-green-800/20'
          },
          {
            title: 'Pendente',
            value: totalPending,
            percentage: ((totalPending / totalSales) * 100 || 0).toFixed(1),
            icon: Clock,
            color: 'from-amber-600 to-orange-700',
            textColor: 'text-amber-300',
            bgColor: 'from-amber-900/20 to-orange-800/20'
          },
          {
            title: 'Gasto Hoje',
            value: todayExpenses,
            count: 'gastos de hoje',
            icon: Minus,
            color: 'from-red-600 to-red-800',
            textColor: 'text-red-300',
            bgColor: 'from-red-900/20 to-red-800/20'
          },
          {
            title: 'Total em Dívidas',
            value: totalDebts,
            count: state.debts.length,
            icon: CreditCard,
            color: 'from-purple-600 to-purple-800',
            textColor: 'text-purple-300',
            bgColor: 'from-purple-900/20 to-purple-800/20'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${metric.bgColor} border border-white/10 backdrop-blur-xl`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className={`${metric.textColor} text-sm font-bold uppercase tracking-wider mb-2`}>
                    {metric.title}
                  </p>
                  <p className="text-4xl font-black text-white mb-2">
                    R$ {metric.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`${metric.textColor} text-sm font-medium`}>
                    {metric.percentage ? `${metric.percentage}% do total` : 
                     typeof metric.count === 'number' ? `${metric.count} registros` : metric.count}
                  </p>
                </div>
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${metric.color} shadow-2xl`}
                >
                  <metric.icon className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              
              {/* Mini sparkline */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((metric.value / Math.max(totalSales, totalDebts)) * 100, 100)}%` }}
                  transition={{ duration: 1.5, delay: index * 0.2 }}
                  className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advanced Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="xl:col-span-2 card bg-gradient-to-br from-slate-900/90 to-emerald-900/90 border-emerald-400/30"
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              whileHover={{ rotate: 360 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-2xl"
            >
              <Activity className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white">Análise de Performance</h3>
              <p className="text-emerald-300">Tendências de vendas e recebimentos</p>
            </div>
          </div>
          
          {salesTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #10b981', 
                    borderRadius: '12px',
                    color: '#fff'
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
            <div className="flex items-center justify-center h-80 text-emerald-400">
              <div className="text-center">
                <Activity className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-bold">Aguardando dados de vendas</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Radial Progress Chart */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="card bg-gradient-to-br from-slate-900/90 to-purple-900/90 border-purple-400/30"
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              whileHover={{ rotate: 360 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-2xl"
            >
              <Target className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white">Status Financeiro</h3>
              <p className="text-purple-300">Distribuição de valores</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
              <RadialBar 
                dataKey="value" 
                cornerRadius={10} 
                fill="#8884d8"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #8b5cf6', 
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          
          <div className="space-y-3 mt-6">
            {radialData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-white font-medium">{item.name}</span>
                </div>
                <span className="text-white font-bold">
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="card bg-gradient-to-br from-slate-900/90 to-blue-900/90 border-blue-400/30"
      >
        <div className="flex items-center gap-4 mb-8">
          <motion.div 
            whileHover={{ rotate: 360 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl"
          >
            <BarChart3 className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-white">Performance Mensal</h3>
            <p className="text-blue-300">Comparativo de vendas vs metas</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #3b82f6', 
                borderRadius: '12px',
                color: '#fff'
              }}
            />
            <Bar dataKey="vendas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recebido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="meta" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quick Stats with Animations */}
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
            className={`card bg-gradient-to-br from-${stat.color}-900/20 to-${stat.color}-800/20 border-${stat.color}-400/30`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-${stat.color}-300 text-sm font-bold uppercase tracking-wider mb-2`}>
                  {stat.title}
                </p>
                <p className="text-3xl font-black text-white mb-1">{stat.count}</p>
                <p className={`text-${stat.color}-400 text-sm font-medium`}>
                  {stat.pending > 0 ? `${stat.pending} pendentes` : 'ativos'}
                </p>
              </div>
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
                className={`p-4 rounded-2xl bg-gradient-to-br from-${stat.color}-600 to-${stat.color}-800 shadow-2xl`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </motion.div>
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="card bg-gradient-to-br from-emerald-900/90 to-green-900/90 border-emerald-400/30"
          >
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="p-6 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-2xl mx-auto mb-6 w-fit"
                >
                  <CheckCircle className="w-16 h-16 text-white" />
                </motion.div>
                <h3 className="text-3xl font-black text-white mb-4">Sistema em Perfeita Ordem!</h3>
                <p className="text-emerald-300 text-xl">
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