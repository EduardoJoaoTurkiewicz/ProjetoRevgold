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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden rustic-texture">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-green-600/10 rounded-full blur-3xl animate-subtle-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-600/10 to-green-800/10 rounded-full blur-3xl animate-subtle-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-white/98 backdrop-blur-xl border-b border-green-800/30 professional-shadow-xl sticky top-0 z-50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-800/5 to-green-900/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg hover:bg-green-50 transition-all duration-300 professional-hover text-green-800"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center space-x-3 professional-hover">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-10 w-auto professional-shadow transition-all duration-300"
                />
                <h1 className="text-xl font-bold text-green-900 hidden sm:block">
                  RevGold System
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right bg-green-50/80 backdrop-blur-sm rounded-lg p-3 professional-shadow professional-hover">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-800 rounded-full flex items-center justify-center professional-shadow">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-base font-semibold text-green-900">
                    {getGreeting()}, {state.user?.username}!
                  </p>
                </div>
                <p className="text-sm text-green-700 font-medium">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium professional-shadow professional-hover transition-all duration-300"
                title="Voltar para seleção de usuário"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Trocar Usuário</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-lg font-medium professional-shadow professional-hover transition-all duration-300"
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
        <nav className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white/98 backdrop-blur-xl professional-shadow-xl border-r border-green-800/30 min-h-screen transition-all duration-300 ease-out`}>
          <div className="absolute inset-0 bg-gradient-to-b from-green-800/5 to-green-900/5"></div>
          <div className="p-6 relative">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center space-x-3 professional-hover">
                <img 
                  src="/image.png" 
                  alt="RevGold Logo" 
                  className="h-8 w-auto professional-shadow"
                />
                <h1 className="text-lg font-bold text-green-900">
                  RevGold System
                </h1>
              </div>
            </div>
            
            {/* User Info Card */}
            <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200/50 professional-shadow professional-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-800 rounded-full flex items-center justify-center professional-shadow">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">{state.user?.username}</p>
                  <p className="text-sm text-green-700 capitalize">{state.user?.role}</p>
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onPageChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium group relative overflow-hidden ${
                        currentPage === item.id
                          ? 'bg-gradient-to-r from-green-800 to-green-900 text-white professional-shadow-lg'
                          : 'text-green-800 hover:bg-green-50 hover:text-green-900 professional-hover'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        currentPage === item.id 
                          ? 'bg-white/20 professional-shadow' 
                          : 'bg-green-100 group-hover:bg-white group-hover:professional-shadow'
                      }`}>
                        <Icon className={`h-5 w-5 transition-all duration-300 ${
                          currentPage === item.id 
                            ? 'text-white' 
                            : 'text-green-700 group-hover:text-green-800'
                        }`} />
                      </div>
                      <span className="relative z-10">{item.label}</span>
                      
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
            <div className="mt-6 pt-4 border-t border-green-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium text-red-700 hover:bg-red-50 hover:text-red-800 professional-hover group"
              >
                <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-all duration-300">
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-6 relative">
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