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
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabase';

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
  const { state, dispatch } = useApp();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      dispatch({ type: 'SET_USER', payload: null });
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
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">Online</span>
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
              {isSupabaseConfigured() && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Conectado ao banco de dados"></div>
              )}
            </div>
            <p className="text-green-400 text-xs italic">
              "Colorindo seu ambiente e levando vida para os seus dias"
            </p>
          </div>
        </div>
      </div>

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
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-semibold text-sm">
                  {isSupabaseConfigured() ? 'Banco Online' : 'Modo Local'}
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