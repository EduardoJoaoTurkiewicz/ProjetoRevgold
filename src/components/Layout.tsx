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
  Sparkles,
  Zap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'from-blue-500 to-purple-600' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, color: 'from-green-500 to-teal-600' },
    { id: 'boletos', label: 'Boletos', icon: Receipt, color: 'from-orange-500 to-red-600' },
    { id: 'checks', label: 'Cheques', icon: CheckSquare, color: 'from-purple-500 to-pink-600' },
    { id: 'debts', label: 'Dívidas', icon: CreditCard, color: 'from-red-500 to-rose-600' },
    { id: 'employees', label: 'Funcionários', icon: Users, color: 'from-cyan-500 to-blue-600' },
    { id: 'sales', label: 'Vendas', icon: DollarSign, color: 'from-emerald-500 to-green-600' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, color: 'from-indigo-500 to-purple-600' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="particles">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <div className="w-80 sidebar-glass relative overflow-hidden">
        {/* Sidebar Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        
        <div className="p-8 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center modern-shadow-xl floating-animation neon-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full neon-glow animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white text-shadow-modern">RevGold</h1>
              <p className="text-sm text-slate-300 font-medium">Sistema de Gestão</p>
            </div>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-8 neon-glow" />
        </div>

        <nav className="px-4 space-y-2 relative z-10">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-6 py-4 text-left rounded-2xl transition-all duration-500 menu-item group relative overflow-hidden ${
                  isActive
                    ? 'active text-white font-bold'
                    : 'text-slate-300 hover:text-white font-medium'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`p-3 rounded-xl mr-4 bg-gradient-to-br ${item.color} modern-shadow group-hover:scale-110 transition-all duration-500 neon-glow`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold tracking-wide">{item.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-4 w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full neon-glow animate-pulse" />
                )}
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/50 backdrop-blur-xl modern-shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center neon-glow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Sistema Online</p>
                <p className="text-slate-400 text-xs">Todos os serviços ativos</p>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full w-full neon-glow animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="header-glass relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />
          
          <div className="px-8 py-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 modern-shadow-xl floating-animation neon-glow`}>
                  {(() => {
                    const currentItem = menuItems.find(item => item.id === currentPage);
                    const Icon = currentItem?.icon || Home;
                    return <Icon className="w-6 h-6 text-white" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white text-shadow-modern capitalize">
                    {menuItems.find(item => item.id === currentPage)?.label || currentPage}
                  </h2>
                  <p className="text-slate-300 font-medium">
                    {new Date().toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-white text-shadow-modern">
                    {new Date().getHours().toString().padStart(2, '0')}:
                    {new Date().getMinutes().toString().padStart(2, '0')}
                  </p>
                  <p className="text-slate-300 text-sm font-medium">Horário atual</p>
                </div>
                
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center modern-shadow-xl floating-animation neon-glow">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 modern-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
          
          {/* Floating Action Button */}
          <div className="fixed bottom-8 right-8 z-50">
            <button className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center modern-shadow-xl hover-lift neon-glow group">
              <Sparkles className="w-8 h-8 text-white group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;