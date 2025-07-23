import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Users, Calendar, Clock, AlertTriangle, CheckCircle, CreditCard, Receipt, Activity, Target, Zap, ArrowUp, ArrowDown, Eye, Package, Banknote, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export function Dashboard() {
  const { state } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // dias

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calcular métricas principais
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
  const netProfit = totalReceived - totalDebts;

  // Dados para gráfico de vendas por período
  const salesByPeriod = () => {
    const days = parseInt(selectedPeriod);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const salesInPeriod = state.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Agrupar vendas por dia
    const salesByDay = salesInPeriod.reduce((acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.vendas += sale.totalValue;
        existing.recebido += sale.receivedAmount;
        existing.pendente += sale.pendingAmount;
        existing.quantidade += 1;
      } else {
        acc.push({
          date,
          vendas: sale.totalValue,
          recebido: sale.receivedAmount,
          pendente: sale.pendingAmount,
          quantidade: 1
        });
      }
      return acc;
    }, [] as any[]);

    return salesByDay.sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());
  };

  // Dados para gráfico de métodos de pagamento
  const paymentMethodsData = () => {
    const methods: { [key: string]: number } = {};
    
    state.sales.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        const methodName = method.type === 'dinheiro' ? 'Dinheiro' :
                          method.type === 'pix' ? 'PIX' :
                          method.type === 'cartao_credito' ? 'Cartão Crédito' :
                          method.type === 'cartao_debito' ? 'Cartão Débito' :
                          method.type === 'cheque' ? 'Cheque' :
                          method.type === 'boleto' ? 'Boleto' :
                          method.type === 'transferencia' ? 'Transferência' : 'Outros';
        
        methods[methodName] = (methods[methodName] || 0) + method.amount;
      });
    });

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    
    return Object.entries(methods).map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length]
    }));
  };

  // Status dos cheques
  const checksStatusData = () => {
    const status = {
      'Compensado': state.checks.filter(c => c.status === 'compensado').length,
      'Pendente': state.checks.filter(c => c.status === 'pendente').length,
      'Devolvido': state.checks.filter(c => c.status === 'devolvido').length,
      'Reapresentado': state.checks.filter(c => c.status === 'reapresentado').length
    };

    const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    
    return Object.entries(status)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value,
        fill: colors[index]
      }));
  };

  // Fluxo de caixa mensal
  const cashFlowData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthSales = state.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getFullYear() === currentYear && saleDate.getMonth() === index;
      });
      
      const monthDebts = state.debts.filter(debt => {
        const debtDate = new Date(debt.date);
        return debtDate.getFullYear() === currentYear && debtDate.getMonth() === index;
      });

      const entrada = monthSales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
      const saida = monthDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
      
      return {
        mes: month,
        entrada,
        saida,
        saldo: entrada - saida
      };
    });
  };

  // Top clientes
  const topClients = () => {
    const clients: { [key: string]: number } = {};
    
    state.sales.forEach(sale => {
      clients[sale.client] = (clients[sale.client] || 0) + sale.totalValue;
    });

    return Object.entries(clients)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  };

  // Itens vencendo hoje
  const today = new Date().toISOString().split('T')[0];
  const itemsDueToday = [
    ...state.checks.filter(c => c.dueDate === today && c.status === 'pendente'),
    ...state.boletos.filter(b => b.dueDate === today && b.status === 'pendente'),
    ...state.installments.filter(i => i.dueDate === today && !i.isPaid)
  ];

  // Itens vencidos
  const overdueItems = [
    ...state.checks.filter(c => c.dueDate < today && c.status === 'pendente'),
    ...state.boletos.filter(b => b.dueDate < today && b.status === 'pendente'),
    ...state.installments.filter(i => i.dueDate < today && !i.isPaid)
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header Profissional */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="flex items-center gap-6 mb-6 lg:mb-0">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
              <img 
                src="/image.png" 
                alt="RevGold Logo" 
                className="w-16 h-16 object-contain filter brightness-0 invert"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, {state.user?.username}!
              </h1>
              <p className="text-emerald-100 text-lg">
                Dashboard Executivo - Sistema RevGold
              </p>
            </div>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center text-white mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="text-lg font-bold">
                {currentTime.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </span>
            </div>
            <div className="flex items-center text-emerald-100">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-lg font-bold">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Faturamento Total',
            value: totalSales,
            icon: DollarSign,
            color: 'emerald',
            trend: '+12.5%',
            trendUp: true,
            subtitle: `${state.sales.length} vendas`
          },
          {
            title: 'Valor Recebido',
            value: totalReceived,
            icon: TrendingUp,
            color: 'green',
            trend: '+8.2%',
            trendUp: true,
            subtitle: `${((totalReceived / totalSales) * 100 || 0).toFixed(1)}% do total`
          },
          {
            title: 'Valores Pendentes',
            value: totalPending,
            icon: Clock,
            color: 'amber',
            trend: '-3.1%',
            trendUp: false,
            subtitle: `${((totalPending / totalSales) * 100 || 0).toFixed(1)}% do total`
          },
          {
            title: 'Lucro Líquido',
            value: netProfit,
            icon: netProfit >= 0 ? TrendingUp : TrendingDown,
            color: netProfit >= 0 ? 'green' : 'red',
            trend: netProfit >= 0 ? '+15.3%' : '-5.2%',
            trendUp: netProfit >= 0,
            subtitle: 'Receitas - Gastos'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 }}
            className={`card bg-gradient-to-br from-white to-${metric.color}-50 border-${metric.color}-200`}
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
                {metric.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alertas Importantes */}
      {(itemsDueToday.length > 0 || overdueItems.length > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {itemsDueToday.length > 0 && (
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-600 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Vencimentos Hoje</h3>
                  <p className="text-blue-700">{itemsDueToday.length} item(s) vencem hoje</p>
                </div>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {itemsDueToday.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-sm text-blue-800 bg-blue-200/50 p-2 rounded">
                    {'client' in item ? `${item.client} - R$ ${item.value.toFixed(2)}` :
                     'description' in item ? `${item.description} - R$ ${item.amount.toFixed(2)}` :
                     `Parcela - R$ ${item.amount.toFixed(2)}`}
                  </div>
                ))}
                {itemsDueToday.length > 3 && (
                  <p className="text-blue-600 text-sm font-medium">
                    +{itemsDueToday.length - 3} outros itens
                  </p>
                )}
              </div>
            </div>
          )}

          {overdueItems.length > 0 && (
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-red-600 shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Itens Vencidos</h3>
                  <p className="text-red-700">{overdueItems.length} item(s) em atraso</p>
                </div>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {overdueItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-sm text-red-800 bg-red-200/50 p-2 rounded">
                    {'client' in item ? `${item.client} - R$ ${item.value.toFixed(2)}` :
                     'description' in item ? `${item.description} - R$ ${item.amount.toFixed(2)}` :
                     `Parcela - R$ ${item.amount.toFixed(2)}`}
                  </div>
                ))}
                {overdueItems.length > 3 && (
                  <p className="text-red-600 text-sm font-medium">
                    +{overdueItems.length - 3} outros itens
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Vendas por Período */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Vendas por Período</h3>
                <p className="text-slate-600">Evolução das vendas e recebimentos</p>
              </div>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </div>
          
          <div className="h-80">
            {salesByPeriod().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesByPeriod()}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRecebido" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorVendas)"
                    strokeWidth={3}
                    name="Vendas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="recebido" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorRecebido)"
                    strokeWidth={3}
                    name="Recebido"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl">
                <div className="text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nenhuma venda no período selecionado</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Métodos de Pagamento */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Métodos de Pagamento</h3>
              <p className="text-slate-600">Distribuição por forma de pagamento</p>
            </div>
          </div>
          
          <div className="h-80">
            {paymentMethodsData().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethodsData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl">
                <div className="text-center">
                  <Banknote className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nenhum método de pagamento registrado</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Fluxo de Caixa e Status dos Cheques */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Fluxo de Caixa Mensal */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Fluxo de Caixa Mensal</h3>
              <p className="text-slate-600">Entradas vs Saídas por mês</p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                />
                <Bar dataKey="entrada" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="saida" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status dos Cheques */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Status dos Cheques</h3>
              <p className="text-slate-600">Situação atual dos cheques</p>
            </div>
          </div>
          
          <div className="h-80">
            {checksStatusData().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={checksStatusData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {checksStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} cheques`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nenhum cheque registrado</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Clientes */}
      {topClients().length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Top 5 Clientes</h3>
              <p className="text-slate-600">Clientes com maior volume de compras</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topClients().map((client, index) => (
              <div key={client.name} className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                <div className="text-2xl font-bold text-teal-700 mb-1">#{index + 1}</div>
                <div className="font-medium text-slate-800 mb-2 truncate" title={client.name}>
                  {client.name}
                </div>
                <div className="text-lg font-bold text-teal-600">
                  R$ {client.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resumo Rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Vendas', count: state.sales.length, icon: DollarSign, color: 'emerald' },
          { title: 'Cheques', count: state.checks.length, icon: FileText, color: 'blue' },
          { title: 'Boletos', count: state.boletos.length, icon: Receipt, color: 'purple' },
          { title: 'Funcionários', count: state.employees.filter(e => e.isActive).length, icon: Users, color: 'indigo' }
        ].map((item, index) => (
          <motion.div
            key={item.title}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 }}
            className={`card bg-gradient-to-br from-white to-${item.color}-50 border-${item.color}-200 text-center`}
          >
            <div className={`p-3 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 shadow-lg mx-auto mb-3 w-fit`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{item.count}</div>
            <div className="text-slate-600 font-medium">{item.title}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}