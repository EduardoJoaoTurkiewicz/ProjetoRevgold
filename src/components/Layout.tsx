import React from 'react';
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
  Crown,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #D4AF37 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #D4AF37 1px, transparent 1px)`,
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
        sidebar-glass
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-8 border-b border-white/20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent"></div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-modern-xl floating-animation">
                  <img 
                    src="/image.png" 
                    alt="RevGold" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
              <div className="relative">
                <h1 className="text-2xl font-black text-white mb-1">RevGold</h1>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <p className="text-xs text-yellow-100 font-bold uppercase tracking-wider">Sistema Premium</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-3 rounded-xl hover:bg-white/10 transition-all duration-300 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
                <img 
                  src="/image.png" 
                  alt="RevGold" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RevGold</h1>
                <p className="text-xs text-gray-500 font-medium">Sistema de Gestão</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-3">
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
                    w-full flex items-center px-6 py-4 text-left rounded-2xl font-bold transition-all duration-500
                    menu-item stagger-animation
                    ${isActive 
                      ? 'active text-white shadow-xl' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon className={`w-6 h-6 mr-4 ${isActive ? 'text-white' : 'text-white/70'}`} />
                  <span className="font-bold text-sm uppercase tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-6 border-t border-white/20">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Usuário Premium</p>
                <p className="text-xs text-yellow-200 font-semibold">Administrador</p>
              </div>
              <Settings className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="header-glass relative">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 rounded-xl hover:bg-yellow-50 transition-all duration-300 hover:shadow-md"
              >
                <Menu className="w-6 h-6 text-slate-700" />
              </button>
              
              <div>
                <h2 className="text-3xl font-black text-slate-900 capitalize mb-1">
                  {menuItems.find(item => item.id === currentPage)?.label || currentPage}
                </h2>
                <p className="text-sm text-slate-600 font-semibold">
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
              <div className="hidden md:flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-sm border border-white/50">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 font-medium w-48"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-3 rounded-2xl hover:bg-yellow-50 transition-all duration-300 hover:shadow-md group">
                <Bell className="w-6 h-6 text-slate-600 group-hover:text-yellow-600 transition-colors" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg animate-pulse">
                  <span className="absolute inset-0 bg-red-400 rounded-full animate-ping"></span>
                </span>
              </button>
              
              {/* Time */}
              <div className="hidden md:block text-right">
                <p className="text-xl font-black text-slate-900">
                  {new Date().getHours().toString().padStart(2, '0')}:
                  {new Date().getMinutes().toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Horário Atual</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
          <div className="p-8">
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