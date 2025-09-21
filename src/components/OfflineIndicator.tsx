import React, { useState, useEffect } from 'react';
import { WifiOff, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { getOfflineStats } from '../lib/offlineStorage';
import { connectionManager } from '../lib/connectionManager';
import { syncManager } from '../lib/syncManager';
import toast from 'react-hot-toast';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineStats, setOfflineStats] = useState({ offlineCount: 0, syncQueueCount: 0, lastSync: null });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateStats = async () => {
      const stats = await getOfflineStats();
      setOfflineStats(stats);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateStats();
    const interval = setInterval(updateStats, 3000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const totalPending = offlineStats.offlineCount + offlineStats.syncQueueCount;

  if (isOnline && totalPending === 0) {
    return null; // Don't show when everything is fine
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        px-6 py-3 rounded-2xl shadow-xl border-2 transition-all duration-300 cursor-pointer
        ${!isOnline 
          ? 'bg-red-50 border-red-200 text-red-800' 
          : 'bg-orange-50 border-orange-200 text-orange-800'
        }
      `}
      onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <WifiOff className="w-5 h-5" />
          ) : (
            <Database className="w-5 h-5" />
          )}
          
          <div>
            <p className="font-bold text-sm">
              {!isOnline 
                ? 'Modo Offline' 
                : `${totalPending} operação(ões) pendente(s)`
              }
            </p>
            {!isOnline && (
              <p className="text-xs opacity-75">
                Dados salvos localmente
              </p>
            )}
          </div>

          {isOnline && totalPending > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                syncManager.forceSync();
              }}
              className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              title="Sincronizar agora"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            <div className="space-y-2 text-xs">
              {!isOnline ? (
                <div>
                  <p className="font-semibold">Sistema funcionando offline:</p>
                  <ul className="mt-1 space-y-1 opacity-75">
                    <li>• Dados salvos no dispositivo</li>
                    <li>• Sincronização automática quando online</li>
                    <li>• Todas as funcionalidades disponíveis</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">Dados aguardando sincronização:</p>
                  <div className="mt-1 space-y-1 opacity-75">
                    {offlineStats.offlineCount > 0 && (
                      <p>• {offlineStats.offlineCount} registro(s) criado(s) offline</p>
                    )}
                    {offlineStats.syncQueueCount > 0 && (
                      <p>• {offlineStats.syncQueueCount} operação(ões) na fila</p>
                    )}
                  </div>
                </div>
              )}
              
              {offlineStats.lastSync && (
                <p className="opacity-75">
                  Última sync: {new Date(offlineStats.lastSync).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}