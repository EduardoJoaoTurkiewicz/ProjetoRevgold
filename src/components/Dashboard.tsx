import React, { useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  BarChart3, 
  Users, 
  Calendar,
  Receipt,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
  Target,
  TrendingDown,
  Activity,
  PieChart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import * as THREE from 'three';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

// 3D Animated Chart Component
function AnimatedBar({ position, height, color, delay = 0 }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime + delay) * 0.1;
      meshRef.current.scale.y = Math.max(0.1, height + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.1);
    }
  });

  return (
    <Box
      ref={meshRef}
      position={position}
      scale={[0.8, height, 0.8]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
}

// 3D Sales Chart
function Sales3DChart({ data }) {
  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 60 }} style={{ height: '300px' }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {data.map((item, index) => (
        <AnimatedBar
          key={index}
          position={[index * 2 - data.length, 0, 0]}
          height={item.value / 10000}
          color={COLORS[index % COLORS.length]}
          delay={index * 0.2}
        />
      ))}
      
      <Text
        position={[0, 4, 0]}
        fontSize={0.5}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        Vendas 3D
      </Text>
      
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
    </Canvas>
  );
}

// 3D Floating Sphere for metrics
function FloatingSphere({ position, color, scale = 1 }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere
      ref={meshRef}
      position={position}
      scale={scale}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </Sphere>
  );
}

// 3D Metrics Visualization
function Metrics3D({ metrics }) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }} style={{ height: '200px' }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />
      
      <FloatingSphere position={[-3, 0, 0]} color="#10b981" scale={0.8} />
      <FloatingSphere position={[-1, 0, 0]} color="#3b82f6" scale={0.6} />
      <FloatingSphere position={[1, 0, 0]} color="#f59e0b" scale={0.7} />
      <FloatingSphere position={[3, 0, 0]} color="#8b5cf6" scale={0.5} />
      
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
    </Canvas>
  );
}

export default function Dashboard() {
  const { state } = useApp();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Calcular métricas do dia atual
  const todayMetrics = useMemo(() => {
    // Vendas de hoje
    const todaySales = state.sales.filter(sale => sale.date === today);
    const salesToday = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);
    
    // Valor recebido hoje (vendas pagas hoje)
    const receivedToday = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    
    // Dívidas criadas hoje
    const todayDebts = state.debts.filter(debt => debt.date === today);
    const debtsToday = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    
    // Valor pago hoje (dívidas pagas hoje)
    const paidToday = todayDebts.filter(debt => debt.isPaid).reduce((sum, debt) => sum + debt.paidAmount, 0);
    
    return {
      salesToday,
      receivedToday,
      debtsToday,
      paidToday
    };
  }, [state.sales, state.debts, today]);

  // Dados para gráficos avançados
  const chartData = useMemo(() => {
    // Vendas por mês (últimos 6 meses)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthSales = state.sales.filter(sale => sale.date.startsWith(monthKey));
      const monthDebts = state.debts.filter(debt => debt.date.startsWith(monthKey));
      
      monthlyData.push({
        month: monthName,
        vendas: monthSales.reduce((sum, sale) => sum + sale.totalValue, 0),
        recebido: monthSales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
        dividas: monthDebts.reduce((sum, debt) => sum + debt.totalValue, 0),
        lucro: monthSales.reduce((sum, sale) => sum + sale.receivedAmount, 0) - monthDebts.reduce((sum, debt) => sum + debt.paidAmount, 0)
      });
    }

    // Status das vendas
    const salesStatus = [
      { name: 'Pagas', value: state.sales.filter(s => s.status === 'pago').length, color: '#10b981' },
      { name: 'Parciais', value: state.sales.filter(s => s.status === 'parcial').length, color: '#f59e0b' },
      { name: 'Pendentes', value: state.sales.filter(s => s.status === 'pendente').length, color: '#ef4444' }
    ];

    // Performance por funcionário
    const employeePerformance = state.employees.map(emp => {
      const empSales = state.sales.filter(sale => sale.sellerId === emp.id);
      return {
        name: emp.name.split(' ')[0],
        vendas: empSales.length,
        valor: empSales.reduce((sum, sale) => sum + sale.totalValue, 0)
      };
    }).filter(emp => emp.vendas > 0);

    // Fluxo de caixa diário (últimos 30 dias)
    const cashFlow = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.getDate();
      
      const dayReceived = state.sales.filter(sale => sale.date === dateStr).reduce((sum, sale) => sum + sale.receivedAmount, 0);
      const dayPaid = state.debts.filter(debt => debt.date === dateStr).reduce((sum, debt) => sum + debt.paidAmount, 0);
      
      cashFlow.push({
        day: dayName,
        entrada: dayReceived,
        saida: dayPaid,
        saldo: dayReceived - dayPaid
      });
    }

    return {
      monthlyData,
      salesStatus,
      employeePerformance,
      cashFlow
    };
  }, [state.sales, state.debts, state.employees]);

  // Alertas e notificações
  const alerts = useMemo(() => {
    const dueToday = state.checks.filter(check => check.dueDate === today);
    const overdueChecks = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
    const dueBoletos = state.boletos.filter(boleto => boleto.dueDate === today);
    const overdueBoletos = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
    
    return {
      checksToday: dueToday.length,
      overdueChecks: overdueChecks.length,
      boletosToday: dueBoletos.length,
      overdueBoletos: overdueBoletos.length
    };
  }, [state.checks, state.boletos, today]);

  // Estatísticas gerais
  const generalStats = useMemo(() => {
    const totalSales = state.sales.length;
    const totalDebts = state.debts.length;
    const totalChecks = state.checks.length;
    const totalBoletos = state.boletos.length;
    const activeEmployees = state.employees.filter(emp => emp.isActive).length;
    
    return {
      totalSales,
      totalDebts,
      totalChecks,
      totalBoletos,
      activeEmployees
    };
  }, [state]);

  return (
    <div className="space-y-8">
      {/* Header com efeitos */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-green-900/30 to-emerald-900/20 blur-3xl"></div>
        <div className="relative bg-gradient-to-br from-slate-800 via-green-900 to-emerald-900 rounded-3xl p-12 text-white shadow-2xl">
          <div className="absolute top-4 right-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
          </div>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl floating-animation">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
                Dashboard RevGold
              </h1>
              <p className="text-2xl text-green-200 font-bold">
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
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <p className="text-green-200 font-semibold">Funcionários Ativos</p>
                  <p className="text-2xl font-black text-white">{generalStats.activeEmployees}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-blue-200 font-semibold">Total de Vendas</p>
                  <p className="text-2xl font-black text-white">{generalStats.totalSales}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <p className="text-purple-200 font-semibold">Cheques & Boletos</p>
                  <p className="text-2xl font-black text-white">{generalStats.totalChecks + generalStats.totalBoletos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-orange-300" />
                </div>
                <div>
                  <p className="text-orange-200 font-semibold">Total de Dívidas</p>
                  <p className="text-2xl font-black text-white">{generalStats.totalDebts}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas do Dia - Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Vendas Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-3xl p-8 border-2 border-green-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-green-800 mb-2">Vendas Hoje</h3>
                <p className="text-4xl font-black text-green-700 mb-1">
                  R$ {todayMetrics.salesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">Atualizado em tempo real</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valor Recebido Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-3xl p-8 border-2 border-blue-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation" style={{ animationDelay: '0.5s' }}>
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-blue-800 mb-2">Valor Recebido Hoje</h3>
                <p className="text-4xl font-black text-blue-700 mb-1">
                  R$ {todayMetrics.receivedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-600">Pagamentos confirmados</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dívidas Feitas Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 rounded-3xl p-8 border-2 border-orange-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation" style={{ animationDelay: '1s' }}>
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-orange-800 mb-2">Dívidas Feitas Hoje</h3>
                <p className="text-4xl font-black text-orange-700 mb-1">
                  R$ {todayMetrics.debtsToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-bold text-orange-600">Novos compromissos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valor Pago Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 rounded-3xl p-8 border-2 border-purple-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation" style={{ animationDelay: '1.5s' }}>
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-purple-800 mb-2">Valor Pago Hoje</h3>
                <p className="text-4xl font-black text-purple-700 mb-1">
                  R$ {todayMetrics.paidToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-600">Dívidas quitadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Avançados 3D */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 3D de Vendas */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-emerald-900/30 to-green-900/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800 via-green-900/70 to-emerald-900/70 rounded-3xl p-8 text-white shadow-2xl border border-green-400/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl floating-animation">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Vendas 3D Interativo</h2>
                <p className="text-green-200 font-bold">Visualização tridimensional das vendas</p>
              </div>
            </div>
            
            <Sales3DChart data={chartData.monthlyData.map(item => ({ name: item.month, value: item.vendas }))} />
          </div>
        </div>

        {/* Métricas 3D Flutuantes */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-violet-900/30 to-purple-900/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800 via-purple-900/70 to-violet-900/70 rounded-3xl p-8 text-white shadow-2xl border border-purple-400/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl floating-animation">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Métricas 3D</h2>
                <p className="text-purple-200 font-bold">Esferas flutuantes representando KPIs</p>
              </div>
            </div>
            
            <Metrics3D metrics={todayMetrics} />
          </div>
        </div>
      </div>

      {/* Gráficos Avançados 2D */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fluxo de Caixa */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Fluxo de Caixa (30 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.cashFlow}>
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Area type="monotone" dataKey="entrada" stackId="1" stroke="#10b981" fill="url(#colorEntrada)" name="Entradas" />
              <Area type="monotone" dataKey="saida" stackId="2" stroke="#ef4444" fill="url(#colorSaida)" name="Saídas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status das Vendas - Gráfico de Pizza */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Status das Vendas</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData.salesStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.salesStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance dos Funcionários */}
      {chartData.employeePerformance.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 modern-shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Performance dos Vendedores</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.employeePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'valor' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
                  name === 'valor' ? 'Valor Total' : 'Número de Vendas'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="vendas" fill="#3b82f6" name="Vendas" />
              <Bar yAxisId="right" dataKey="valor" fill="#10b981" name="Valor (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Evolução Mensal */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 modern-shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Evolução Mensal Completa</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <Legend />
            <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={3} name="Vendas" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="recebido" stroke="#3b82f6" strokeWidth={3} name="Recebido" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="dividas" stroke="#ef4444" strokeWidth={3} name="Dívidas" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="lucro" stroke="#8b5cf6" strokeWidth={3} name="Lucro" dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas e Notificações */}
      {(alerts.checksToday > 0 || alerts.overdueChecks > 0 || alerts.boletosToday > 0 || alerts.overdueBoletos > 0) && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-orange-900/30 to-yellow-900/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800 via-red-900/50 to-orange-900/50 rounded-3xl p-8 text-white shadow-2xl border border-red-400/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
                <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Alertas Importantes</h2>
                <p className="text-red-200 font-semibold">Itens que precisam de sua atenção</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {alerts.checksToday > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6 text-blue-300" />
                    <span className="font-bold text-blue-200">Cheques Hoje</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.checksToday}</p>
                  <p className="text-sm text-blue-200">Vencimento hoje</p>
                </div>
              )}
              
              {alerts.overdueChecks > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-300" />
                    <span className="font-bold text-red-200">Cheques Vencidos</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.overdueChecks}</p>
                  <p className="text-sm text-red-200">Precisam atenção</p>
                </div>
              )}
              
              {alerts.boletosToday > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-green-300" />
                    <span className="font-bold text-green-200">Boletos Hoje</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.boletosToday}</p>
                  <p className="text-sm text-green-200">Vencimento hoje</p>
                </div>
              )}
              
              {alerts.overdueBoletos > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-orange-300" />
                    <span className="font-bold text-orange-200">Boletos Vencidos</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.overdueBoletos}</p>
                  <p className="text-sm text-orange-200">Precisam atenção</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumo Rápido */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-emerald-900/30 to-green-900/20 blur-3xl"></div>
        <div className="relative bg-gradient-to-br from-slate-800 via-green-900/70 to-emerald-900/70 rounded-3xl p-8 text-white shadow-2xl border border-green-400/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl floating-animation">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Sistema RevGold</h2>
              <p className="text-green-200 font-bold text-lg">Gestão Empresarial Profissional</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-2xl text-green-200 font-bold mb-4">
              "Colorindo seu ambiente e levando vida para os seus dias"
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-bold">Sistema Online e Funcionando</span>
              <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}