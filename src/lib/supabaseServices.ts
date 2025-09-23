import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ErrorHandler } from '../lib/errorHandler';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  Star,
  FileText,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Target,
  Award,
  Building2,
  PieChart,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

const Dashboard: React.FC = () => {
  const { 
    sales, 
    employees, 
    debts, 
    checks, 
    boletos, 
    employeeCommissions,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    pixFees,
    cashBalance,
    recalculateCashBalance,
    loading, 
    isLoading,
    error,
    setError,
    loadAllData
  } = useAppContext();
  
  const [isRecalculating, setIsRecalculating] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Force data reload on mount
  React.useEffect(() => {
    // Dados já carregados pelo AppContext - não recarregar aqui
    console.log('📊 Dashboard mounted - using data from context');
  }, []);

  // Calcular métricas do dia
  const dailyMetrics = useMemo(() => {
    // 1. Total de Vendas do dia
    const todaySales = (sales || []).filter(sale => sale.date === today);
    const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);

    // 2. Valor Recebido do dia (vendas instantâneas + cheques compensados + boletos pagos)
    let totalReceivedToday = 0;
    
    // Vendas com pagamento instantâneo
    todaySales.forEach(sale => {
      if (sale && sale.paymentMethods && Array.isArray(sale.paymentMethods)) {
        sale.paymentMethods.forEach(method => {
          if (method && method.type && method.amount) {
            if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
                (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
              totalReceivedToday += method.amount;
            }
          }
        });
      }
    });
    
    // Cheques compensados hoje
    (checks || []).forEach(check => {
      if (check && check.dueDate === today && check.status === 'compensado') {
        totalReceivedToday += check.value;
      }
    });
    
    // Boletos pagos hoje
    (boletos || []).forEach(boleto => {
      if (boleto && boleto.dueDate === today && boleto.status === 'compensado') {
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        totalReceivedToday += (finalAmount - notaryCosts);
      }
    });

    // 3. Total de Dívidas do dia
    const todayDebts = (debts || []).filter(debt => debt && debt.date === today);
    const totalDebtsToday = todayDebts.reduce((sum, debt) => sum + (debt ? debt.totalValue : 0), 0);

    // 4. Total Pago hoje
    let totalPaidToday = 0;
    
    // Dívidas pagas hoje
    todayDebts.forEach(debt => {
      if (debt && debt.isPaid && debt.paymentMethods && Array.isArray(debt.paymentMethods)) {
        debt.paymentMethods.forEach(method => {
          if (method && method.type && method.amount && ['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            totalPaidToday += method.amount;
          }
        });
      }
    });
    
    // Pagamentos de funcionários hoje
    (employeePayments || []).forEach(payment => {
      if (payment && payment.paymentDate === today) {
        totalPaidToday += payment.amount;
      }
    });
    
    // Tarifas PIX hoje
    (pixFees || []).forEach(fee => {
      if (fee && fee.date === today) {
        totalPaidToday += fee.amount;
      }
    });

    // 5. Lucro Líquido do dia
    const netProfitToday = totalReceivedToday - totalPaidToday;

    return {
      totalSalesToday,
      totalReceivedToday,
      totalDebtsToday,
      totalPaidToday,
      netProfitToday,
      todaySales: todaySales.length,
      todayDebts: todayDebts.length
    };
  }, [sales, debts, checks, boletos, employeePayments, pixFees, today]);

  // Calcular métricas do mês
  const monthlyMetrics = useMemo(() => {
    // Comissões do mês
    const monthlyCommissions = (employeeCommissions || []).filter(commission => {
      if (!commission || !commission.date) return false;
      const commissionDate = new Date(commission.date);
      return commissionDate.getMonth() === currentMonth && 
             commissionDate.getFullYear() === currentYear;
    });
    const totalCommissionsMonth = monthlyCommissions.reduce((sum, c) => sum + (c ? c.commissionAmount : 0), 0);

    // Folha de pagamento do mês
    const monthlyPayroll = (employees || [])
      .filter(emp => emp && emp.isActive)
      .reduce((sum, emp) => sum + (emp ? emp.salary : 0), 0);

    // Vendas do mês
    const monthlySales = (sales || []).filter(sale => {
      if (!sale || !sale.date) return false;
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === currentMonth && 
             saleDate.getFullYear() === currentYear;
    });
    const totalSalesMonth = monthlySales.reduce((sum, sale) => sum + (sale ? sale.totalValue : 0), 0);

    // Lucro do mês (simplificado)
    const monthlyProfit = totalSalesMonth - monthlyPayroll - totalCommissionsMonth;

    return {
      totalCommissionsMonth,
      monthlyPayroll,
      totalSalesMonth,
      monthlyProfit,
      monthlySalesCount: monthlySales.length
    };
  }, [employeeCommissions, employees, sales, currentMonth, currentYear]);

  // Boletos vencidos
  const overdueBoletos = useMemo(() => {
    return (boletos || []).filter(boleto => 
      boleto && boleto.dueDate && boleto.dueDate < today && boleto.status === 'pendente'
    );
  }, [boletos, today]);

  // Dívidas para pagar
  const debtsToPay = useMemo(() => {
    return (debts || []).filter(debt => debt && !debt.isPaid);
  }, [debts]);

  // Valores a receber
  const valuesToReceive = useMemo(() => {
    const toReceive = [];
    
    // Cheques pendentes
    (checks || []).forEach(check => {
      if (check && check.status === 'pendente' && !check.isOwnCheck) {
        toReceive.push({
          id: check.id,
          type: 'Cheque',
          client: check.client,
          amount: check.value,
          dueDate: check.dueDate,
          description: `Cheque - Parcela ${check.installmentNumber}/${check.totalInstallments}`,
          status: check.status
        });
      }
    });
    
    // Boletos pendentes
    (boletos || []).forEach(boleto => {
      if (boleto && boleto.status === 'pendente') {
        toReceive.push({
          id: boleto.id,
          type: 'Boleto',
          client: boleto.client,
          amount: boleto.value,
          dueDate: boleto.dueDate,
          description: `Boleto - Parcela ${boleto.installmentNumber}/${boleto.totalInstallments}`,
          status: boleto.status
        });
      }
    });
    
    // Vendas com valores pendentes
    (sales || []).forEach(sale => {
      if (sale && sale.pendingAmount > 0) {
        toReceive.push({
          id: sale.id,
          type: 'Venda',
          client: sale.client,
          amount: sale.pendingAmount,
          dueDate: sale.date,
          description: `Venda pendente`,
          status: sale.status
        });
      }
    });
    
    return toReceive.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [checks, boletos, sales]);

  // Dados para gráfico de fluxo financeiro (30 dias)
  const flowChartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Vendas do dia
      const daySales = (sales || []).filter(sale => sale && sale.date === dateStr);
      const salesValue = daySales.reduce((sum, sale) => sum + (sale ? sale.totalValue : 0), 0);
      
      // Dívidas do dia
      const dayDebts = (debts || []).filter(debt => debt && debt.date === dateStr);
      const debtsValue = dayDebts.reduce((sum, debt) => sum + (debt ? debt.totalValue : 0), 0);
      
      // Lucro do dia (vendas - dívidas)
      const profit = salesValue - debtsValue;
      
      last30Days.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: salesValue,
        dividas: debtsValue,
        lucro: profit
      });
    }
    
    return last30Days;
  }, [sales, debts]);

  // Dados para gráfico de métodos de pagamento
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    
    (sales || []).forEach(sale => {
      if (sale && sale.paymentMethods && Array.isArray(sale.paymentMethods)) {
        sale.paymentMethods.forEach(method => {
          if (method && method.type && method.amount) {
            const methodName = method.type.replace('_', ' ').toUpperCase();
            if (!methods[methodName]) {
              methods[methodName] = 0;
            }
            methods[methodName] += method.amount;
          }
        });
      }
    });
    
    return Object.entries(methods).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / Object.values(methods).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  }, [sales]);

  // Top vendedores do mês
  const topSellers = useMemo(() => {
    const sellerStats = {};
    
    // Vendas do mês por vendedor
    (sales || []).forEach(sale => {
      if (sale && sale.sellerId && sale.date) {
        const saleDate = new Date(sale.date);
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          if (!sellerStats[sale.sellerId]) {
            const employee = (employees || []).find(emp => emp.id === sale.sellerId);
            sellerStats[sale.sellerId] = {
              name: employee ? employee.name : 'Vendedor não encontrado',
              totalSales: 0,
              salesCount: 0,
              totalCommissions: 0
            };
          }
          sellerStats[sale.sellerId].totalSales += sale.totalValue;
          sellerStats[sale.sellerId].salesCount += 1;
        }
      }
    });
    
    // Adicionar comissões
    (employeeCommissions || []).forEach(commission => {
      if (commission && commission.employeeId && commission.date) {
        const commissionDate = new Date(commission.date);
        if (commissionDate.getMonth() === currentMonth && commissionDate.getFullYear() === currentYear) {
          if (sellerStats[commission.employeeId]) {
            sellerStats[commission.employeeId].totalCommissions += commission.commissionAmount;
          }
        }
      }
    });
    
    return Object.values(sellerStats)
      .filter(seller => seller && typeof seller === 'object')
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
  }, [sales, employees, employeeCommissions, currentMonth, currentYear]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Carregando Dashboard...</h2>
          <p className="text-slate-600">Preparando seus dados financeiros</p>
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state if there's an error but not loading
  if (error && !loading && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Erro de Conexão</h2>
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => {
                setError(null);
                // Não recarregar página, apenas tentar reconectar
                connectionManager.forceCheck().then(() => {
                  if (connectionManager.isConnected()) {
                    loadAllData();
                  }
                });
              }}
              className="btn-primary"
            >
              Tentar Novamente
            </button>
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-bold text-blue-900 mb-4">Como Configurar o Supabase:</h3>
              <ol className="text-left space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Crie um novo projeto em <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">supabase.com/dashboard</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Vá em Settings → API no seu projeto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>Configure o arquivo <code className="bg-blue-100 px-2 py-1 rounded">.env</code>:</span>
                </li>
                <li className="ml-6 bg-blue-100 p-3 rounded-lg font-mono text-sm">
                  VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co<br/>
                  VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Execute as migrações: <code className="bg-blue-100 px-2 py-1 rounded">supabase db push</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">5.</span>
                  <span>Reinicie o servidor: <code className="bg-blue-100 px-2 py-1 rounded">npm run dev</code></span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900">Dashboard RevGold</h1>
          <p className="text-slate-600 text-lg font-semibold">
            Visão geral completa do seu negócio - {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Widgets Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* Total de Vendas Hoje */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Vendas Hoje</h3>
              <p className="text-3xl font-black text-green-700">
                R$ {dailyMetrics.totalSalesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                {dailyMetrics.todaySales} venda(s)
              </p>
            </div>
          </div>
        </div>

        {/* Valor Recebido Hoje */}
        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 modern-shadow-lg">
              <ArrowUpCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-lg">Recebido Hoje</h3>
              <p className="text-3xl font-black text-emerald-700">
                R$ {dailyMetrics.totalReceivedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-emerald-600 font-semibold">
                Entradas efetivas
              </p>
            </div>
          </div>
        </div>

        {/* Total de Dívidas Hoje */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 modern-shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Dívidas Hoje</h3>
              <p className="text-3xl font-black text-red-700">
                R$ {dailyMetrics.totalDebtsToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-red-600 font-semibold">
                {dailyMetrics.todayDebts} dívida(s)
              </p>
            </div>
          </div>
        </div>

        {/* Total Pago Hoje */}
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 modern-shadow-lg">
              <ArrowDownCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Pago Hoje</h3>
              <p className="text-3xl font-black text-orange-700">
                R$ {dailyMetrics.totalPaidToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600 font-semibold">
                Saídas efetivas
              </p>
            </div>
          </div>
        </div>

        {/* Saldo em Caixa */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Saldo Caixa</h3>
              <p className="text-3xl font-black text-blue-700">
                R$ {(cashBalance?.currentBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm text-blue-600 font-semibold">
                  Disponível agora
                </p>
                <button
                  onClick={async () => {
                    setIsRecalculating(true);
                    try {
                      await recalculateCashBalance();
                    } catch (error) {
                      console.error('Erro ao recalcular:', error);
                    } finally {
                      setIsRecalculating(false);
                    }
                  }}
                  disabled={isRecalculating}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                  title="Recalcular saldo"
                >
                  {isRecalculating ? '...' : '↻'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda linha de widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Lucro Líquido Hoje */}
        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 modern-shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-lg">Lucro Hoje</h3>
              <p className={`text-3xl font-black ${
                dailyMetrics.netProfitToday >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {dailyMetrics.netProfitToday >= 0 ? '+' : ''}R$ {dailyMetrics.netProfitToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-purple-600 font-semibold">
                Recebido - Pago
              </p>
            </div>
          </div>
        </div>

        {/* Funcionários */}
        <div className="card bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 modern-shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 text-lg">Funcionários</h3>
              <p className="text-3xl font-black text-indigo-700">
                {(employees || []).filter(emp => emp.isActive).length}
              </p>
              <p className="text-sm text-indigo-600 font-semibold">
                {(employees || []).filter(emp => emp.isActive && emp.isSeller).length} vendedor(es)
              </p>
            </div>
          </div>
        </div>

        {/* Comissões do Mês */}
        <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 modern-shadow-xl hover:modern-shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="p-