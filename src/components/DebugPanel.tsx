import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Eye, X, CheckCircle, Database } from 'lucide-react';
import { debugService } from '../lib/supabaseServices';
import { SalesDebugger } from '../lib/debugUtils';
import { ErrorHandler } from '../lib/errorHandler';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<any>(null);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const recentErrors = await debugService.getRecentSaleErrors(50);
      setErrors(recentErrors);
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Debug Errors');
      alert('Erro ao carregar logs: ' + ErrorHandler.handleSupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const cleanupErrors = async (daysOld: number = 7) => {
    try {
      const cleaned = await debugService.cleanupOldErrors(daysOld);
      alert(`${cleaned} erro(s) antigo(s) removido(s)`);
      loadErrors();
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Cleanup Debug Errors');
      alert('Erro ao limpar logs: ' + ErrorHandler.handleSupabaseError(error));
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadErrors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[200] backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[95vh] overflow-hidden modern-shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-600">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Debug Panel - Sales Creation Errors</h2>
                <p className="text-slate-600">Logs de erro para diagnóstico de problemas na criação de vendas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadErrors}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(95vh-120px)]">
          {/* Error List */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Erros Recentes ({errors.length})
                </h3>
                <button
                  onClick={() => cleanupErrors(7)}
                  className="btn-warning flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar 7+ dias
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-slate-600">Carregando logs...</p>
                </div>
              ) : errors.length > 0 ? (
                <div className="space-y-3">
                  {errors.map((error, index) => (
                    <div
                      key={error.id || index}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedError?.id === error.id
                          ? 'border-red-300 bg-red-50'
                          : 'border-red-200 bg-red-50/50 hover:bg-red-50'
                      }`}
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-red-900">
                          Erro #{index + 1}
                        </span>
                        <span className="text-xs text-red-600">
                          {new Date(error.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-red-700 truncate">
                        {error.error_message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          {error.payload?.client || 'No client'}
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          R$ {error.payload?.total_value || '0'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-bold text-green-800 mb-2">
                    Nenhum erro encontrado!
                  </h3>
                  <p className="text-green-600">
                    O sistema está funcionando corretamente.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Details */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              {selectedError ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      Detalhes do Erro
                    </h3>
                    
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
                      <h4 className="font-semibold text-red-800 mb-2">Mensagem de Erro:</h4>
                      <p className="text-red-700 font-mono text-sm">
                        {selectedError.error_message}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6">
                      <h4 className="font-semibold text-blue-800 mb-2">Timestamp:</h4>
                      <p className="text-blue-700">
                        {new Date(selectedError.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">Análise do Payload:</h4>
                    <div className="space-y-3">
                      {(() => {
                        const analysis = SalesDebugger.analyzePayload(selectedError.payload);
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-semibold text-slate-700">Cliente:</p>
                                <p className="text-sm text-slate-600">
                                  {analysis.clientValue || 'Não informado'} ({analysis.clientType})
                                </p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-semibold text-slate-700">Vendedor:</p>
                                <p className="text-sm text-slate-600">
                                  {analysis.sellerIdValue || 'Não informado'} ({analysis.sellerIdType})
                                </p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-semibold text-slate-700">Valor Total:</p>
                                <p className="text-sm text-slate-600">
                                  R$ {analysis.totalValue || 0} ({analysis.totalValueType})
                                </p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-semibold text-slate-700">Métodos de Pagamento:</p>
                                <p className="text-sm text-slate-600">
                                  {analysis.paymentMethodsCount} método(s)
                                </p>
                              </div>
                            </div>

                            {analysis.issues.length > 0 && (
                              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                <h5 className="font-semibold text-yellow-800 mb-2">Problemas Identificados:</h5>
                                <ul className="space-y-1">
                                  {analysis.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-yellow-700">
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">Payload Completo:</h4>
                    <pre className="text-xs bg-slate-100 p-4 rounded-lg overflow-x-auto text-slate-700 font-mono max-h-96 overflow-y-auto">
                      {JSON.stringify(selectedError.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-bold text-slate-600 mb-2">
                    Selecione um erro
                  </h3>
                  <p className="text-slate-500">
                    Clique em um erro na lista para ver os detalhes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              <p className="font-semibold">Como usar este painel:</p>
              <p>1. Erros são registrados automaticamente quando a criação de vendas falha</p>
              <p>2. Analise os payloads para identificar problemas de validação</p>
              <p>3. Use as informações para corrigir bugs no frontend</p>
            </div>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fechar Debug Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}