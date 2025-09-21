import React, { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, Eye, X, AlertTriangle } from 'lucide-react';
import { getOfflineData, clearAllOfflineData, getOfflineStats } from '../lib/offlineStorage';
import { syncManager } from '../lib/syncManager';
import toast from 'react-hot-toast';

interface OfflineDataViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineDataViewer({ isOpen, onClose }: OfflineDataViewerProps) {
  const [offlineData, setOfflineData] = useState<any[]>([]);
  const [stats, setStats] = useState({ offlineCount: 0, syncQueueCount: 0, lastSync: null });
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        getOfflineData(),
        getOfflineStats()
      ]);
      setOfflineData(data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading offline data:', error);
      toast.error('Erro ao carregar dados offline');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Tem certeza que deseja limpar TODOS os dados offline? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await clearAllOfflineData();
      toast.success('Todos os dados offline foram limpos');
      loadData();
    } catch (error) {
      console.error('Error clearing offline data:', error);
      toast.error('Erro ao limpar dados offline');
    }
  };

  const handleForceSync = async () => {
    try {
      await syncManager.forceSync();
      loadData();
    } catch (error) {
      console.error('Error forcing sync:', error ?? 'Unknown error');
      toast.error('Erro ao forçar sincronização');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[200] backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden modern-shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-600">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Dados Offline</h2>
                <p className="text-slate-600">Visualizar e gerenciar dados salvos localmente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
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
          {/* Data List */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Registros Offline ({stats.offlineCount})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleForceSync}
                    className="btn-primary flex items-center gap-2 text-sm"
                    disabled={stats.offlineCount === 0}
                  >
                    <Database className="w-4 h-4" />
                    Sincronizar
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="btn-danger flex items-center gap-2 text-sm"
                    disabled={stats.offlineCount === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar Tudo
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900">Dados Offline</h4>
                  <p className="text-2xl font-bold text-blue-700">{stats.offlineCount}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-orange-900">Fila de Sync</h4>
                  <p className="text-2xl font-bold text-orange-700">{stats.syncQueueCount}</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-slate-600">Carregando dados offline...</p>
                </div>
              ) : offlineData.length > 0 ? (
                <div className="space-y-3">
                  {offlineData.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedItem?.id === item.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900">
                          {item.table.toUpperCase()} #{index + 1}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 truncate">
                        {item.data?.client || item.data?.name || item.data?.company || 'Sem identificação'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.synced ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.synced ? 'Sincronizado' : 'Pendente'}
                        </span>
                        {item.data?.totalValue && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            R$ {item.data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-bold text-slate-600 mb-2">
                    Nenhum dado offline
                  </h3>
                  <p className="text-slate-500">
                    Dados salvos offline aparecerão aqui
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Item Details */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              {selectedItem ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      Detalhes do Item Offline
                    </h3>
                    
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-blue-800">Tabela:</p>
                          <p className="text-blue-700">{selectedItem.table}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800">ID:</p>
                          <p className="text-blue-700 font-mono text-xs">{selectedItem.id}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800">Criado em:</p>
                          <p className="text-blue-700">
                            {new Date(selectedItem.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800">Status:</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            selectedItem.synced ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {selectedItem.synced ? 'Sincronizado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">Dados Salvos:</h4>
                    <pre className="text-xs bg-slate-100 p-4 rounded-lg overflow-x-auto text-slate-700 font-mono max-h-96 overflow-y-auto">
                      {JSON.stringify(selectedItem.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-bold text-slate-600 mb-2">
                    Selecione um item
                  </h3>
                  <p className="text-slate-500">
                    Clique em um item na lista para ver os detalhes
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
              <p className="font-semibold">Sistema Offline-First:</p>
              <p>• Dados salvos automaticamente quando offline</p>
              <p>• Sincronização automática quando conexão for restabelecida</p>
              <p>• Funcionalidade completa mesmo sem internet</p>
            </div>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}