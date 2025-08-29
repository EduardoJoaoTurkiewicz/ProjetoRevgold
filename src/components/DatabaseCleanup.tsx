import React, { useState } from 'react';
import { Trash2, Database, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { removeDuplicates, cleanupDatabase } from '../utils/removeDuplicates';

interface DuplicateStats {
  table: string;
  totalRecords: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  uniqueRecordsKept: number;
}

export function DatabaseCleanup() {
  const { recalculateCashBalance, cleanupDuplicates } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [stats, setStats] = useState<DuplicateStats[]>([]);
  const [cleanupComplete, setCleanupComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecalculatingCash, setIsRecalculatingCash] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setCleanupComplete(false);
    
    try {
      console.log('🔍 Iniciando análise de duplicatas...');
      const results = await removeDuplicates();
      setStats(results);
      console.log('✅ Análise concluída!');
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido na análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta ação irá remover PERMANENTEMENTE todas as duplicatas encontradas. Esta operação NÃO PODE ser desfeita. Tem certeza que deseja continuar?')) {
      return;
    }

    setIsCleaning(true);
    setError(null);
    
    try {
      console.log('🧹 Iniciando limpeza do banco de dados...');
      await cleanupDatabase();
      setCleanupComplete(true);
      
      // Recarregar estatísticas após limpeza
      const newResults = await removeDuplicates();
      setStats(newResults);
      
      console.log('✅ Limpeza concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido na limpeza');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRecalculateCash = async () => {
    setIsRecalculatingCash(true);
    setError(null);
    
    try {
      await recalculateCashBalance();
      console.log('✅ Saldo do caixa recalculado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao recalcular saldo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao recalcular saldo');
    } finally {
      setIsRecalculatingCash(false);
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const names = {
      'sales': 'Vendas',
      'debts': 'Dívidas', 
      'employees': 'Funcionários',
      'boletos': 'Boletos',
      'checks': 'Cheques',
      'employee_commissions': 'Comissões'
    };
    return names[tableName] || tableName;
  };

  const getTotalDuplicates = () => {
    return stats.reduce((sum, stat) => sum + stat.duplicatesFound, 0);
  };

  const getTotalRemoved = () => {
    return stats.reduce((sum, stat) => sum + stat.duplicatesRemoved, 0);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 modern-shadow-xl">
          <Database className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Limpeza do Banco de Dados</h1>
          <p className="text-slate-600 text-lg">Ferramenta para identificar e remover registros duplicados</p>
        </div>
      </div>

      {/* Warning */}
      <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 modern-shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-600">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-yellow-900">⚠️ ATENÇÃO - OPERAÇÃO CRÍTICA</h3>
            <p className="text-yellow-800 font-semibold">
              Esta ferramenta remove PERMANENTEMENTE registros duplicados do banco de dados.
            </p>
            <p className="text-yellow-700 text-sm mt-2">
              • A operação NÃO PODE ser desfeita<br/>
              • Faça backup dos dados importantes antes de prosseguir<br/>
              • Analise primeiro para ver o que será removido
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Controles de Limpeza</h3>
          <div className="flex gap-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isCleaning}
              className="btn-secondary flex items-center gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              {isAnalyzing ? 'Analisando...' : 'Analisar Duplicatas'}
            </button>
            
            {stats.length > 0 && getTotalDuplicates() > 0 && (
              <button
                onClick={handleCleanup}
                disabled={isAnalyzing || isCleaning}
                className="btn-danger flex items-center gap-2"
              >
                {isCleaning ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                {isCleaning ? 'Removendo...' : 'Remover Duplicatas'}
              </button>
            )}
            
            <button
              onClick={handleRecalculateCash}
              disabled={isRecalculatingCash}
              className="btn-info flex items-center gap-2"
            >
              {isRecalculatingCash ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              {isRecalculatingCash ? 'Recalculando...' : 'Recalcular Caixa'}
            </button>
          </div>
        </div>

        {/* Sistema de Caixa */}
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-blue-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-900">Sistema de Caixa</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">Recalcular Saldo do Caixa</h4>
              <p className="text-sm text-blue-700 mb-4">
                Esta função recalcula o saldo do caixa baseado em TODAS as transações registradas no sistema.
                Use se suspeitar que o saldo está incorreto.
              </p>
              <button
                onClick={handleRecalculateCash}
                disabled={isRecalculatingCash}
                className="btn-info flex items-center gap-2"
              >
                {isRecalculatingCash ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {isRecalculatingCash ? 'Recalculando...' : 'Recalcular Saldo'}
              </button>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-2">⚠️ Como o Sistema de Caixa Funciona</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Entradas automáticas:</strong> Vendas (dinheiro, PIX, débito), cheques compensados, boletos pagos</li>
                <li>• <strong>Saídas automáticas:</strong> Dívidas pagas, salários, adiantamentos, tarifas PIX, impostos</li>
                <li>• <strong>Atualização:</strong> O saldo é atualizado automaticamente a cada transação</li>
                <li>• <strong>Integridade:</strong> Todas as operações são registradas em cash_transactions</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-bold text-red-800">Erro na Operação</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {cleanupComplete && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-600">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-green-800">🎉 Limpeza Concluída com Sucesso!</h4>
                <p className="text-green-700 font-semibold">
                  {getTotalRemoved()} registros duplicados foram removidos do banco de dados.
                </p>
                <p className="text-green-600 text-sm mt-1">
                  O banco de dados foi otimizado e está funcionando com melhor performance.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.length === 0 && !isAnalyzing && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">
              Clique em "Analisar Duplicatas" para verificar o banco de dados
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {stats.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Resumo da Análise</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-blue-600 font-semibold">Total de Registros</p>
                  <p className="text-3xl font-black text-blue-800">
                    {stats.reduce((sum, stat) => sum + stat.totalRecords, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Duplicatas Encontradas</p>
                  <p className="text-3xl font-black text-red-600">
                    {getTotalDuplicates()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Registros Únicos</p>
                  <p className="text-3xl font-black text-green-600">
                    {stats.reduce((sum, stat) => sum + stat.uniqueRecordsKept, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="card modern-shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Análise Detalhada por Tabela</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Tabela</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Total de Registros</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Duplicatas Encontradas</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Duplicatas Removidas</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Registros Únicos</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(stat => (
                    <tr key={stat.table} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">
                        {getTableDisplayName(stat.table)}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-700">
                        {stat.totalRecords}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`font-bold ${stat.duplicatesFound > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {stat.duplicatesFound}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`font-bold ${stat.duplicatesRemoved > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
                          {stat.duplicatesRemoved}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-green-600">
                        {stat.uniqueRecordsKept}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {stat.duplicatesFound === 0 ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                            ✓ Limpo
                          </span>
                        ) : stat.duplicatesRemoved === stat.duplicatesFound ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                            ✓ Limpo
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                            ⚠️ Duplicatas
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instructions */}
          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-green-600">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900">Como Funciona a Limpeza</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-green-800 mb-2">Critérios de Duplicação:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• <strong>Vendas:</strong> Cliente + Data + Valor Total</li>
                  <li>• <strong>Dívidas:</strong> Empresa + Data + Valor + Descrição</li>
                  <li>• <strong>Funcionários:</strong> Nome + Cargo + Salário</li>
                  <li>• <strong>Boletos:</strong> Cliente + Valor + Vencimento + Parcela</li>
                  <li>• <strong>Cheques:</strong> Cliente + Valor + Vencimento + Parcela</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-green-800 mb-2">Processo de Limpeza:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Identifica registros com dados idênticos</li>
                  <li>• Mantém o registro mais antigo (primeiro criado)</li>
                  <li>• Remove todos os registros duplicados</li>
                  <li>• Preserva integridade dos relacionamentos</li>
                  <li>• Atualiza contadores e estatísticas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}