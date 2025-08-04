import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Calendar, 
  Receipt, 
  CheckSquare, 
  CreditCard, 
  Users, 
  BarChart3,
  DollarSign,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Building2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { state } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'sales', label: 'Vendas', icon: DollarSign },
    { id: 'debts', label: 'Dívidas', icon: CreditCard },
    { id: 'checks', label: 'Cheques', icon: CheckSquare },
    { id: 'boletos', label: 'Boletos', icon: Receipt },
    { id: 'employees', label: 'Funcionários', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #059669 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #10b981 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 transform transition-all duration-500 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        revgold-sidebar
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-8 border-b border-green-700/30 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent"></div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl revgold-animate-floating">
                  <span className="text-2xl font-black text-white">RG</span>
                </div>
              </div>
              <div className="relative">
                <h1 className="text-3xl font-black text-white mb-1">RevGold</h1>
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-green-300" />
                  <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Sistema Empresarial</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-3 rounded-xl hover:bg-green-700/30 transition-all duration-300 text-green-200 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    revgold-menu-item revgold-animate-fade-in revgold-stagger-${index + 1}
                    ${isActive 
                      ? 'active' 
                      : ''
                    }
                  `}
                >
                  <Icon className="w-6 h-6 mr-4" />
                  <span className="font-bold text-base">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-3 h-3 bg-green-300 rounded-full revgold-animate-pulse-glow"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-6 border-t border-green-700/30">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-green-800/20 hover:bg-green-700/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                {state.user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">{state.user?.username}</p>
                <p className="text-sm text-green-200 font-semibold">Sistema RevGold</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="revgold-header relative">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 rounded-xl hover:bg-green-50 transition-all duration-300 hover:shadow-md"
              >
                <Menu className="w-6 h-6 text-green-700" />
              </button>
              
              <div>
                <h2 className="text-4xl font-black text-green-800 capitalize mb-1">
                  {menuItems.find(item => item.id === currentPage)?.label || currentPage}
                </h2>
                <p className="text-base text-green-600 font-semibold">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-md border border-green-100">
                <Search className="w-5 h-5 text-green-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent border-none outline-none text-sm text-green-700 placeholder-green-400 font-medium w-48"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-3 rounded-2xl hover:bg-green-50 transition-all duration-300 hover:shadow-md group">
                <Bell className="w-6 h-6 text-green-600 group-hover:text-green-700 transition-colors" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg revgold-animate-pulse-glow">
                  <span className="absolute inset-0 bg-red-400 rounded-full animate-ping"></span>
                </span>
              </button>
              
              {/* Time */}
              <div className="hidden md:block text-right">
                <p className="text-2xl font-black text-green-800">
                  {new Date().getHours().toString().padStart(2, '0')}:
                  {new Date().getMinutes().toString().padStart(2, '0')}
                </p>
                <p className="text-sm text-green-600 font-semibold uppercase tracking-wide">Horário Atual</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
          <div className="p-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;