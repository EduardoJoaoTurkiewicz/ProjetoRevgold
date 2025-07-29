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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-green-400/40 to-green-600/40 rounded-full blur-3xl floating-animation neon-glow"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-green-300/40 to-green-500/40 rounded-full blur-3xl floating-animation neon-glow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-full blur-2xl floating-animation neon-glow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-effect border-b border-green-400/30 modern-shadow-xl sticky top-0 z-50 relative backdrop-blur-modern">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-xl hover:bg-green-400/20 transition-modern hover-lift text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center space-x-3 hover-lift transition-modern">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-14 w-auto modern-shadow-lg transition-modern floating-animation neon-glow"
                />
                <h1 className="text-xl font-black text-white hidden sm:block text-shadow-lg">
                  RevGold System
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right glass-effect rounded-xl p-4 modern-shadow hover-lift transition-modern border border-green-400/30">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center modern-shadow floating-animation neon-glow">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white text-shadow-modern">
                      {getGreeting()}, {state.user?.username}!
                    </p>
                    <p className="text-xs text-green-200 font-medium">
                      {new Date().toLocaleDateString('pt-BR', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 glass-effect hover:bg-green-400/20 text-white rounded-xl font-bold modern-shadow hover-lift transition-modern border border-green-400/30"
                title="Voltar para seleção de usuário"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Trocar Usuário</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold modern-shadow-xl hover-lift transition-modern"
                title="Sair do sistema"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <nav className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 glass-effect modern-shadow-xl border-r border-green-400/30 min-h-screen transition-modern backdrop-blur-modern`}>
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-green-600/10"></div>
          <div className="p-6 relative">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center space-x-3 hover-lift transition-modern">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-12 w-auto modern-shadow floating-animation neon-glow"
                />
                <h1 className="text-lg font-black text-white text-shadow-lg">
                  RevGold System
                </h1>
              </div>
            </div>
            
            {/* User Info Card */}
            <div className="mb-8 p-6 glass-effect rounded-3xl border-2 border-green-400/30 modern-shadow hover-lift transition-modern glow-effect">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center modern-shadow floating-animation neon-glow">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-shadow-modern">{state.user?.username}</p>
                  <p className="text-sm text-green-200 capitalize font-bold">{state.user?.role}</p>
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
                      className={`w-full flex items-center space-x-4 px-6 py-5 rounded-2xl transition-modern font-bold group relative overflow-hidden hover-lift transform-3d ${
                        currentPage === item.id
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white modern-shadow-xl neon-glow'
                          : 'text-white hover:bg-green-400/20 hover:text-green-200 glass-effect border border-green-400/20'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`p-4 rounded-2xl transition-modern floating-animation ${
                        currentPage === item.id 
                          ? 'bg-white/20 modern-shadow neon-glow' 
                          : 'bg-green-500/20 group-hover:bg-green-400/30 group-hover:modern-shadow'
                      }`}>
                        <Icon className={`h-7 w-7 transition-modern ${
                          currentPage === item.id 
                            ? 'text-white' 
                            : 'text-green-400 group-hover:text-green-200'
                        }`} />
                      </div>
                      <span className="relative z-10 text-shadow-modern text-lg">{item.label}</span>
                      
                      {/* Hover effect */}
                      <div className={`absolute right-6 transition-modern ${
                        currentPage === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <div className="w-4 h-4 bg-current rounded-full neon-glow"></div>
                      </div>
                      
                      {/* Active indicator */}
                      {currentPage === item.id && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-10 bg-white rounded-r-full animate-scale-in neon-glow"></div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            
            {/* Logout Button in Sidebar */}
            <div className="mt-8 pt-6 border-t border-green-400/30">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-6 py-5 rounded-2xl transition-modern font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 hover-lift group glass-effect border border-red-400/30"
              >
                <div className="p-4 rounded-2xl bg-red-500/20 group-hover:bg-red-500/30 transition-modern floating-animation">
                  <LogOut className="h-7 w-7" />
                </div>
                <span className="text-shadow-modern text-lg">Sair do Sistema</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-modern z-30 lg:hidden transition-modern"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-8 sm:p-10 lg:p-12 relative modern-scrollbar">
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