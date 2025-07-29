import React from 'react';
import { Building2, BarChart3, Calendar, Users, DollarSign, FileText, CreditCard, Receipt, Menu, X, LogOut, User, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, onPageChange, children }) => {
  const { state, dispatch } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      dispatch({ type: 'SET_USER', payload: null });
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'sales', label: 'Vendas', icon: DollarSign },
    { id: 'debts', label: 'Dívidas', icon: CreditCard },
    { id: 'checks', label: 'Cheques', icon: FileText },
    { id: 'boletos', label: 'Boletos', icon: Receipt },
    { id: 'employees', label: 'Funcionários', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-gradient-to-br from-green-100 to-green-200 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full blur-3xl floating-animation" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-br from-green-50 to-green-100 rounded-full blur-2xl floating-animation" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Header */}
      <header className="header-glass sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-700/50 transition-modern hover-lift text-slate-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center space-x-3 hover-lift transition-modern">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-12 w-auto modern-shadow transition-modern floating-animation neon-glow"
                />
                <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
                <h1 className="text-xl font-bold text-slate-100 hidden sm:block text-shadow-modern">
                  RevGold System
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center gap-3 bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 modern-shadow hover-lift transition-modern border border-slate-700/50 glow-effect">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center modern-shadow neon-glow">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {getGreeting()}, {state.user?.username}!
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {new Date().toLocaleDateString('pt-BR', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 hover:text-white rounded-xl font-medium modern-shadow hover-lift transition-modern backdrop-blur-sm border border-slate-600/30"
                title="Voltar para seleção de usuário"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Trocar Usuário</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <nav className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 sidebar-glass min-h-screen transition-modern`}>
          <div className="p-6 relative">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center space-x-3 hover-lift transition-modern">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-10 w-auto modern-shadow floating-animation neon-glow"
                />
                <h1 className="text-lg font-bold text-slate-100 text-shadow-modern">
                  RevGold System
                </h1>
              </div>
            </div>
            
            {/* User Info Card */}
            <div className="mb-8 p-4 bg-gradient-to-r from-slate-800/80 to-slate-700/90 rounded-2xl border border-green-500/30 modern-shadow hover-lift transition-modern glow-effect backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center modern-shadow neon-glow floating-animation">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100 text-shadow-sm">{state.user?.username}</p>
                  <p className="text-sm text-green-400 capitalize font-medium">{state.user?.role}</p>
                </div>
              </div>
            </div>

            <ul className="space-y-3">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onPageChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-modern font-medium group relative overflow-hidden hover-lift ${
                        currentPage === item.id
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white modern-shadow neon-glow'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white backdrop-blur-sm'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`p-2 rounded-lg transition-modern ${
                        currentPage === item.id 
                          ? 'bg-white/20' 
                          : 'bg-green-500/20 group-hover:bg-green-500/30'
                      }`}>
                        <Icon className={`h-5 w-5 transition-modern ${
                          currentPage === item.id 
                            ? 'text-white' 
                            : 'text-green-400 group-hover:text-green-300'
                        }`} />
                      </div>
                      <span className="relative z-10">{item.label}</span>
                      
                      {/* Active indicator */}
                      {currentPage === item.id && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-scale-in"></div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            
            {/* Logout Button in Sidebar */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-modern font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 hover-lift group backdrop-blur-sm"
              >
                <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-modern">
                  <LogOut className="h-5 w-5" />
                </div>
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-modern"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 relative modern-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};