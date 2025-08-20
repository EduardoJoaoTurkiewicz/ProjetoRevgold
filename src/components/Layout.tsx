import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  FileText, 
  Users, 
  Calendar, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Building2,
  Sparkles,
  Database,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  HardDrive
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'debts', label: 'Dívidas', icon: CreditCard },
  { id: 'checks', label: 'Cheques', icon: Receipt },
  { id: 'boletos', label: 'Boletos', icon: FileText },
  { id: 'employees', label: 'Funcionários', icon: Users },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
];

export default function Layout({ currentPage, onPageChange, children }: LayoutProps) {
  const { state, dispatch, exportData, importData, restoreBackup, getStorageStats, clearAllData } = useApp();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showDataManager, setShowDataManager] = React.useState(false);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      dispatch({ type: 'SET_USER', payload: null });
    }
  };

  const handleExportData = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revgold-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✅ Dados exportados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result as string;
            const success = importData(data);
            if (success) {
              alert('✅ Dados importados com sucesso!');
            } else {
              alert('❌ Erro ao importar dados. Verifique o arquivo.');
            }
          } catch (error) {
            console.error('❌ Erro ao importar:', error);
            alert('❌ Erro ao importar dados. Arquivo inválido.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRestoreBackup = () => {
    if (window.confirm('Deseja restaurar o backup? Os dados atuais serão substituídos.')) {
      const success = restoreBackup();
      if (success) {
        alert('✅ Backup restaurado com sucesso!');
      } else {
        alert('❌ Nenhum backup encontrado.');
      }
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-slate-900 via-green-900 to-emerald-900 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        
        {/* Logo Section */}
        <div className="flex items-center justify-between p-8 border-b border-green-700/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                  alt="RevGold" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.warn('Logo principal não encontrada, usando fallback');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'logo-fallback w-full h-full bg-white rounded-lg flex items-center justify-center text-green-600 font-black text-lg';
                      fallback.textContent = 'RG';
                      parent.appendChild(fallback);
                    }
                  }}
                  onLoad={() => console.log('Logo carregada com sucesso')}
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">RevGold</h1>
              <p className="text-green-300 text-sm font-semibold">Sistema de Gestão</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-green-300 hover:text-white p-2 rounded-lg hover:bg-green-700/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-green-700/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {state.user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{state.user?.username}</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isSupabaseConfigured() ? 'bg-green-400' : 'bg-yellow-400'
                }`}></div>
                <span className="text-green-300 text-sm font-medium">
                  {isSupabaseConfigured() ? 'Conectado ao Banco' : 'Modo Local'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                      : 'text-green-100 hover:text-white hover:bg-green-700/40'
                  }`}
                >
                  <Icon className={`w-6 h-6 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span className="text-lg">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-green-700/30">
          <div className="mb-6 p-4 bg-green-700/20 rounded-2xl border border-green-600/30">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-green-200 font-bold">Sistema Local Ativo</p>
                <p className="text-green-300 text-sm">Dados salvos automaticamente</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDataManager(true)}
            className="w-full flex items-center gap-4 px-6 py-4 text-blue-300 hover:text-blue-200 hover:bg-blue-900/20 rounded-2xl font-semibold transition-all duration-300 group mb-4"
          >
            <HardDrive className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg">Gerenciar Dados</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded-2xl font-semibold transition-all duration-300 group"
          >
            <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg">Sair</span>
          </button>
          
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-bold">RevGold System</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Sistema local ativo"></div>
            </div>
            <p className="text-green-400 text-xs italic">
              "Colorindo seu ambiente e levando vida para os seus dias"
            </p>
          </div>
        </div>
      </div>

      {/* Data Manager Modal */}
      {showDataManager && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <HardDrive className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Gerenciador de Dados</h2>
                    <p className="text-slate-600">Backup, restauração e estatísticas</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDataManager(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Storage Statistics */}
              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-4">Estatísticas do Sistema</h3>
                {(() => {
                  const stats = getStorageStats();
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-black text-green-700">{stats.itemCounts.sales}</p>
                        <p className="text-sm text-green-600 font-semibold">Vendas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-green-700">{stats.itemCounts.debts}</p>
                        <p className="text-sm text-green-600 font-semibold">Dívidas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-green-700">{stats.itemCounts.checks}</p>
                        <p className="text-sm text-green-600 font-semibold">Cheques</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-green-700">{stats.itemCounts.employees}</p>
                        <p className="text-sm text-green-600 font-semibold">Funcionários</p>
                      </div>
                      <div className="text-center md:col-span-2">
                        <p className="text-lg font-black text-blue-700">{(stats.totalSize / 1024).toFixed(1)}KB</p>
                        <p className="text-sm text-blue-600 font-semibold">Tamanho dos Dados</p>
                      </div>
                      <div className="text-center md:col-span-2">
                        <p className="text-lg font-black text-purple-700">v{stats.version}</p>
                        <p className="text-sm text-purple-600 font-semibold">Versão do Sistema</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="mt-4 text-center">
                  <p className="text-sm text-green-600">
                    Última sincronização: {new Date(getStorageStats().lastSync).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Data Management Actions */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all duration-300 hover:scale-105"
                  >
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-blue-900">Exportar Dados</p>
                      <p className="text-sm text-blue-700">Baixar backup completo</p>
                    </div>
                  </button>

                  <button
                    onClick={handleImportData}
                    className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all duration-300 hover:scale-105"
                  >
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-purple-900">Importar Dados</p>
                      <p className="text-sm text-purple-700">Restaurar de arquivo</p>
                    </div>
                  </button>

                  <button
                    onClick={handleRestoreBackup}
                    className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-all duration-300 hover:scale-105"
                  >
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-orange-900">Restaurar Backup</p>
                      <p className="text-sm text-orange-700">Voltar versão anterior</p>
                    </div>
                  </button>

                  <button
                    onClick={clearAllData}
                    className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all duration-300 hover:scale-105"
                  >
                    <div className="p-2 bg-red-600 rounded-lg">
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-red-900">Limpar Tudo</p>
                      <p className="text-sm text-red-700">Apagar todos os dados</p>
                    </div>
                  </button>
                </div>

                <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-yellow-600" />
                    <h4 className="text-lg font-bold text-yellow-900">Sistema de Armazenamento</h4>
                  </div>
                  <div className="space-y-2 text-sm text-yellow-800">
                    <p>✅ <strong>Salvamento automático:</strong> Dados salvos a cada alteração</p>
                    <p>✅ <strong>Backup automático:</strong> Cópias de segurança criadas automaticamente</p>
                    <p>✅ <strong>Migração de versão:</strong> Dados atualizados automaticamente</p>
                    <p>✅ <strong>Limpeza automática:</strong> Dados antigos removidos quando necessário</p>
                    <p>✅ <strong>Validação de dados:</strong> Verificação de integridade na inicialização</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowDataManager(false)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-green-100/50 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize">
                  {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-slate-600 font-medium">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowDataManager(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
              >
                <HardDrive className="w-4 h-4" />
                <span className="font-semibold text-sm">Gerenciar Dados</span>
              </button>
              
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  'bg-green-500'
                }`}></div>
                <span className="text-green-700 font-semibold text-sm">
                  Salvando Automaticamente
                </span>
              </div>
              
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <span className="relative z-10">
                  {state.user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}