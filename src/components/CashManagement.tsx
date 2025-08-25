import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowUpCircle, ArrowDownCircle, PieChart, BarChart3, Activity, Wallet, Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

export function CashManagement() {
  const { state, initializeCashBalance, updateCashBalance } = useApp();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initialAmount, setInitialAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const today = new Date().toISOString().split('T')[0];

  // Calcular transações do dia selecionado
  const dayTransactions = useMemo(() => {
    const transactions = [];
    
    // Vendas recebidas no dia
    state.sales.forEach(sale => {
      if (sale.date === selectedDate) {
        (sale.paymentMethods || []).forEach(method => {
          if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type)) {
            transactions.push({
              id: `sale-${sale.id}-${method.type}`,
              type: 'entrada' as const,
              amount: method.amount,
              description: `Venda - ${sale.client} (${method.type.replace('_', ' ')})`,
              category: 'venda',
              time: new Date(sale.createdAt).toLocaleTimeString('pt-BR'),
              relatedId: sale.id
            });
          }
        });
      }
    });

    // Cheques compensados no dia
    state.checks.forEach(check => {
      if (check.dueDate === selectedDate && check.status === 'compensado') {
        transactions.push({
          id: `check-${check.id}`,
          type: 'entrada' as const,
          amount: check.value,
          description: `Cheque compensado - ${check.client}`,
          category: 'cheque',
          time: new Date().toLocaleTimeString('pt-BR'),
          relatedId: check.id
        });
      }
    });

    // Boletos pagos no dia
    state.boletos.forEach(boleto => {
      if (boleto.dueDate === selectedDate && boleto.status === 'compensado') {
        // Calcular valor líquido (valor final menos custos de cartório)
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        
        transactions.push({
          id: `boleto-${boleto.id}`,
          type: 'entrada' as const,
          amount: netReceived,
          description: `Boleto pago - ${boleto.client}${boleto.overdueAction ? ` (${boleto.overdueAction})` : ''}`,
          category: 'boleto',
          time: new Date().toLocaleTimeString('pt-BR'),
          relatedId: boleto.id
        });
        
        // Se houve custos de cartório, adicionar como saída separada
        if (notaryCosts > 0) {
          transactions.push({
            id: `boleto-costs-${boleto.id}`,
            type: 'saida' as const,
            amount: notaryCosts,
            description: `Custos de cartório - Boleto ${boleto.client}`,
            category: 'outro',
            time: new Date().toLocaleTimeString('pt-BR'),
            relatedId: boleto.id
          });
        }
      }
    });

    // Tarifas PIX do dia
    state.pixFees.forEach(pixFee => {
      if (pixFee.date === selectedDate) {
        transactions.push({
          id: `pix-fee-${pixFee.id}`,
          type: 'saida' as const,
          amount: pixFee.amount,
          description: `Tarifa PIX - ${pixFee.bank}: ${pixFee.description}`,
          category: 'outro',
          time: new Date().toLocaleTimeString('pt-BR'),
          relatedId: pixFee.id
        });
      }
    });

    // Dívidas pagas no dia
    state.debts.forEach(debt => {
      if (debt.date === selectedDate) {
        (debt.paymentMethods || []).forEach(method => {
          if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type)) {
            transactions.push({
              id: `debt-${debt.id}-${method.type}`,
              type: 'saida' as const,
              amount: method.amount,
              description: `Pagamento - ${debt.company} (${method.type.replace('_', ' ')})`,
              category: 'divida',
              time: new Date(debt.createdAt).toLocaleTimeString('pt-BR'),
              relatedId: debt.id
            });
          }
        });
      }
    });

    return transactions.sort((a, b) => a.time.localeCompare(b.time));
  }, [state, selectedDate]);

  // Calcular totais do dia
  const dayTotals = useMemo(() => {
    const entrada = dayTransactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0);
    const saida = dayTransactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0);
    const saldo = entrada - saida;
    
    return { entrada, saida, saldo };
  }, [dayTransactions]);

  // Dados para gráficos - últimos 30 dias
  const chartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let entrada = 0;
      let saida = 0;
      
      // Calcular entradas do dia
      state.sales.forEach(sale => {
        if (sale.date === dateStr) {
          (sale.paymentMethods || []).forEach(method => {
            if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type)) {
              entrada += method.amount;
            }
          });
        }
      });
      
      // Cheques compensados
      state.checks.forEach(check => {
        if (check.dueDate === dateStr && check.status === 'compensado') {
          entrada += check.value;
        }
      });
      
      // Boletos pagos
      state.boletos.forEach(boleto => {
        if (boleto.dueDate === dateStr && boleto.status === 'compensado') {
          // Calcular valor líquido (valor final menos custos de cartório)
          const finalAmount = boleto.finalAmount || boleto.value;
          const notaryCosts = boleto.notaryCosts || 0;
          const netReceived = finalAmount - notaryCosts;
          entrada += netReceived;
          
          // Custos de cartório são saídas
          if (notaryCosts > 0) {
            saida += notaryCosts;
          }
        }
      });
      
      // Calcular saídas do dia
      state.debts.forEach(debt => {
        if (debt.date === dateStr) {
          (debt.paymentMethods || []).forEach(method => {
            if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type)) {
              saida += method.amount;
            }
          });
        }
      });
      
      // Tarifas PIX do dia
      state.pixFees.forEach(pixFee => {
        if (pixFee.date === dateStr) {
          saida += pixFee.amount;
        }
      });
      
      last30Days.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        entrada,
        saida,
        lucro: entrada - saida
      });
    }
    
    return last30Days;
  }, [state]);

  // Distribuição por categoria
  const categoryData = useMemo(() => {
    const categories = {};
    
    dayTransactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = { entrada: 0, saida: 0 };
      }
      
      if (transaction.type === 'entrada') {
        categories[transaction.category].entrada += transaction.amount;
      } else {
        categories[transaction.category].saida += transaction.amount;
      }
    });
    
    return Object.entries(categories).map(([name, values]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      entrada: values.entrada,
      saida: values.saida,
      total: values.entrada - values.saida
    }));
  }, [dayTransactions]);

  const handleInitializeCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    
    try {
      await initializeCashBalance(initialAmount);
      console.log('✅ Caixa inicializado com sucesso');
      // Forçar atualização do estado
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      alert('Erro ao inicializar caixa: ' + (error as Error).message);
    } finally {
      setIsInitializing(false);
    }
  };

  // Se não há saldo inicial, mostrar formulário de inicialização
  if (!state.cashBalance || state.cashBalance.currentBalance === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-8">
        <div className="card modern-shadow-xl max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {!state.cashBalance ? 'Inicializar Caixa' : 'Definir Saldo Inicial'}
            </h1>
            <p className="text-slate-600 text-lg">
              Para começar a usar o sistema de caixa, informe o valor atual em caixa da empresa.
            </p>
          </div>

          <form onSubmit={handleInitializeCash} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Valor Atual em Caixa *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
                className="input-field text-center text-2xl font-bold"
                placeholder="0,00"
                required
              />
              <p className="text-sm text-slate-500 mt-2">
                Este será o valor base do seu caixa. Todas as transações futuras serão calculadas a partir deste valor.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">Como funciona?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Vendas em dinheiro, PIX e débito são adicionadas automaticamente</li>
                <li>• Cheques compensados são adicionados quando marcados como "compensado"</li>
                <li>• Boletos pagos são adicionados quando marcados como "compensado"</li>
                <li>• Pagamentos de dívidas são subtraídos automaticamente</li>
                <li>• Você pode acompanhar o fluxo diário e gráficos de crescimento</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isInitializing}
              className="btn-primary w-full"
            >
              {isInitializing ? 'Inicializando...' : 
               !state.cashBalance ? 'Inicializar Caixa' : 'Atualizar Saldo Inicial'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Caixa</h1>
          <p className="text-slate-600 text-lg">Controle completo do fluxo de caixa da empresa</p>
        </div>
      </div>

      {/* Saldo Atual */}
      <div className="card bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 modern-shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Saldo Atual em Caixa</h2>
          <p className="text-6xl font-black text-green-700 mb-4">
            R$ {state.cashBalance.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-green-600 font-semibold">
            Última atualização: {new Date(state.cashBalance.lastUpdated).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600">
              <ArrowUpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900">Entradas Hoje</h3>
              <p className="text-2xl font-black text-green-700">
                R$ {dayTotals.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600">
              <ArrowDownCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900">Saídas Hoje</h3>
              <p className="text-2xl font-black text-red-700">
                R$ {dayTotals.saida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Saldo do Dia</h3>
              <p className={`text-2xl font-black ${dayTotals.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                R$ {dayTotals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900">Transações</h3>
              <p className="text-2xl font-black text-purple-700">
                {dayTransactions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de Data */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">Transações por Data</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field max-w-48"
          />
        </div>

        {/* Transações do Dia */}
        {dayTransactions.length > 0 ? (
          <div className="space-y-4">
            {dayTransactions.map(transaction => (
              <div
                key={transaction.id}
                className={`p-4 rounded-xl border-2 ${
                  transaction.type === 'entrada' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'entrada' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {transaction.type === 'entrada' ? 
                        <Plus className="w-4 h-4 text-white" /> : 
                        <Minus className="w-4 h-4 text-white" />
                      }
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{transaction.description}</h4>
                      <p className="text-sm text-slate-600">
                        {transaction.time} • Categoria: {transaction.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${
                      transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'entrada' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total do Dia */}
            <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border-2 border-blue-300">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-blue-600 font-semibold">Entradas</p>
                  <p className="text-2xl font-black text-green-600">
                    +R$ {dayTotals.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Saídas</p>
                  <p className="text-2xl font-black text-red-600">
                    -R$ {dayTotals.saida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Saldo do Dia</p>
                  <p className={`text-3xl font-black ${dayTotals.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dayTotals.saldo >= 0 ? '+' : ''}R$ {dayTotals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhuma transação nesta data</p>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fluxo de Caixa - Últimos 30 Dias */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-blue-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Fluxo de Caixa (30 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Area type="monotone" dataKey="entrada" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Entradas" />
              <Area type="monotone" dataKey="saida" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Saídas" />
              <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Categoria */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-purple-600">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Distribuição por Categoria</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, total }) => `${name}: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Evolução do Saldo */}
        <div className="card modern-shadow-xl lg:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Evolução do Saldo</h3>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Line type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={3} name="Entradas" />
              <Line type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={3} name="Saídas" />
              <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={4} name="Lucro Diário" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}