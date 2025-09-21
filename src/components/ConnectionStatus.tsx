import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2, RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { connectionManager, ConnectionStatus as ConnStatus } from '../lib/connectionManager';
import { syncManager } from '../lib/syncManager';
import { getOfflineStats } from '../lib/offlineStorage';
import { isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnStatus>(connectionManager.getStatus());
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, progress: 0, total: 0 });
  const [offlineStats, setOfflineStats] = useState({ offlineCount: 0, syncQueueCount: 0, lastSync: null });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Escutar mudanças de conexão
    const unsubscribeConnection = connectionManager.addListener(setStatus);
    
    // Escutar mudanças de sincronização
    const unsubscribeSync = syncManager.addSyncListener(setSyncStatus);
    
    // Atualizar estatísticas offline periodicamente
    const updateStats = async () => {
      const stats = await getOfflineStats();
      setOfflineStats(stats);
    };
    
    updateStats();
    const statsInterval = setInterval(updateStats, 5000);
    
    return () => {
      unsubscribeConnection();
      unsubscribeSync();
      clearInterval(statsInterval);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      await syncManager.forceSync();
    } catch (error) {
      toast.error('Erro ao forçar sincronização: ' + (error?.message ?? 'Erro desconhecido'));
    }
  };

  const handleForceCheck = async () => {
    await connectionManager.forceCheck();
  };

  // Verificar se Supabase está configurado
  const supabaseConfigured = isSupabaseConfigured();

  const getStatusColor = () => {
    if (!supabaseConfigured) return 'bg-yellow-500';
    if (!status.isOnline) return 'bg-gray-500';
    if (!status.isSupabaseReachable) return 'bg-red-500';
    if (syncStatus.isSyncing) return 'bg-yellow-500';
    if (offlineStats.offlineCount > 0 || offlineStats.syncQueueCount > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!supabaseConfigured) return 'Supabase não configurado';
    if (!status.isOnline) return 'Offline';
    if (!status.isSupabaseReachable) return 'Sem conexão com servidor';
    if (syncStatus.isSyncing) return `Sincronizando... (${syncStatus.progress}/${syncStatus.total})`;
    if (offlineStats.offlineCount > 0 || offlineStats.syncQueueCount > 0) return 'Dados pendentes';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!supabaseConfigured) return AlertTriangle;
    if (!status.isOnline) return WifiOff;
    if (!status.isSupabaseReachable) return CloudOff;
    if (syncStatus.isSyncing) return Loader2;
    return status.isSupabaseReachable ? Cloud : CloudOff;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-auto'
      }`}>
        {/* Status Indicator */}
        <div 
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${
            syncStatus.isSyncing ? 'animate-pulse' : ''
          }`}></div>
          
          <StatusIcon className={`w-5 h-5 text-gray-600 ${
            syncStatus.isSyncing ? 'animate-spin' : ''
          }`} />
          
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{getStatusText()}</p>
            {(offlineStats.offlineCount > 0 || offlineStats.syncQueueCount > 0) && (
              <p className="text-xs text-orange-600">
                {offlineStats.offlineCount + offlineStats.syncQueueCount} pendente(s)
              </p>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Supabase Configuration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Supabase:</span>
                <div className="flex items-center gap-2">
                  {supabaseConfigured ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className={`text-sm font-semibold ${
                    supabaseConfigured ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {supabaseConfigured ? 'Configurado' : 'Não Configurado'}
                  </span>
                </div>
              </div>
              
              {!supabaseConfigured && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800 font-semibold">
                    Configure o arquivo .env com suas credenciais do Supabase
                  </p>
                </div>
              )}
            </div>

            {/* Connection Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Internet:</span>
                <div className="flex items-center gap-2">
                  {status.isOnline ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${
                    status.isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status.isOnline ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Servidor:</span>
                <div className="flex items-center gap-2">
                  {status.isSupabaseReachable ? (
                    <Database className="w-4 h-4 text-green-600" />
                  ) : (
                    <CloudOff className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${
                    status.isSupabaseReachable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status.isSupabaseReachable ? 'Acessível' : 'Inacessível'}
                  </span>
                </div>
              </div>
            </div>

            {/* Offline Stats */}
            {(offlineStats.offlineCount > 0 || offlineStats.syncQueueCount > 0) && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">Dados Pendentes</h4>
                <div className="space-y-1 text-xs">
                  {offlineStats.offlineCount > 0 && (
                    <p className="text-orange-700">
                      📄 {offlineStats.offlineCount} registro(s) offline
                    </p>
                  )}
                  {offlineStats.syncQueueCount > 0 && (
                    <p className="text-orange-700">
                      🔄 {offlineStats.syncQueueCount} operação(ões) na fila
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sync Progress */}
            {syncStatus.isSyncing && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Sincronizando...</h4>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(syncStatus.progress / syncStatus.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {syncStatus.progress} de {syncStatus.total} operações
                </p>
              </div>
            )}

            {/* Last Sync */}
            {offlineStats.lastSync && (
              <div className="text-xs text-gray-500">
                Última sincronização: {new Date(offlineStats.lastSync).toLocaleString('pt-BR')}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleForceCheck}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                disabled={syncStatus.isSyncing}
              >
                <RefreshCw className="w-4 h-4" />
                Verificar
              </button>
              
              {supabaseConfigured && (offlineStats.offlineCount > 0 || offlineStats.syncQueueCount > 0) && (
                <button
                  onClick={handleForceSync}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                  disabled={syncStatus.isSyncing || !status.isSupabaseReachable}
                >
                  <Database className="w-4 h-4" />
                  Sincronizar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}