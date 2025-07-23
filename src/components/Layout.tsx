import React from 'react';
import { Building2, BarChart3, Calendar, Users, DollarSign, FileText, CreditCard, Receipt, Menu, X, LogOut, User } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-2xl sticky top-0 z-50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 relative">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-3 rounded-xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-12 w-auto drop-shadow-2xl hover:drop-shadow-3xl transition-all duration-300"
                />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent hidden sm:block">
                  RevGold System
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right bg-white/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {getGreeting()}, {state.user?.username}!
                  </p>
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
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
        <nav className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 min-h-screen transition-all duration-500 ease-out`}>
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-blue-500/5"></div>
          <div className="p-8 relative">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-10 w-auto drop-shadow-lg"
                />
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent">
                  RevGold System
                </h1>
              </div>
            </div>
            
            {/* User Info Card */}
            <div className="mb-8 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{state.user?.username}</p>
                  <p className="text-sm text-slate-600 capitalize">{state.user?.role}</p>
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
                      className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-500 font-semibold group relative overflow-hidden ${
                        currentPage === item.id
                          ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-2xl transform scale-105'
                          : 'text-slate-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 hover:text-slate-900 hover:shadow-xl hover:scale-105 hover:border-emerald-200'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Background animation */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 transform transition-transform duration-500 ${
                        currentPage === item.id ? 'translate-x-0' : '-translate-x-full group-hover:translate-x-0'
                      }`}></div>
                      
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        currentPage === item.id 
                          ? 'bg-white/20 shadow-lg' 
                          : 'bg-slate-100 group-hover:bg-white group-hover:shadow-lg'
                      }`}>
                        <Icon className={`h-6 w-6 transition-all duration-300 ${
                          currentPage === item.id 
                            ? 'text-white' 
                            : 'text-slate-600 group-hover:text-emerald-600'
                        }`} />
                      </div>
                      <span className="text-lg relative z-10">{item.label}</span>
                      
                      {/* Hover effect */}
                      <div className={`absolute right-4 transition-all duration-300 ${
                        currentPage === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            
            {/* Logout Button in Sidebar */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-lg hover:scale-105 group"
              >
                <div className="p-2 rounded-xl bg-red-100 group-hover:bg-red-200 transition-all duration-300">
                  <LogOut className="h-6 w-6" />
                </div>
                <span className="text-lg">Sair do Sistema</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
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