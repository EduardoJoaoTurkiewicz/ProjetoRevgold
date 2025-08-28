import React from 'react';
import { 
  Home, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  Calendar,
  Receipt,
  DollarSign,
  Clock,
  TrendingUp,
  Zap,
  Database
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'from-green-600 to-emerald-700' },
    { id: 'employees', label: 'Funcionários', icon: Users, color: 'from-purple-600 to-violet-700' },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart, color: 'from-blue-600 to-indigo-700' },
    { id: 'debts', label: 'Dívidas', icon: CreditCard, color: 'from-red-600 to-rose-700' },
    { id: 'checks', label: 'Cheques', icon: FileText, color: 'from-yellow-600 to-amber-700' },
    { id: 'boletos', label: 'Boletos', icon: Receipt, color: 'from-cyan-600 to-blue-700' },
    { id: 'pix-fees', label: 'Tarifas PIX', icon: Zap, color: 'from-blue-600 to-indigo-700' },
    { id: 'cash', label: 'Caixa', icon: DollarSign, color: 'from-green-600 to-emerald-700' },
    { id: 'taxes', label: 'Impostos', icon: FileText, color: 'from-orange-600 to-red-700' },
    { id: 'reports', label: 'Relatórios', icon: TrendingUp, color: 'from-indigo-600 to-purple-700' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, color: 'from-indigo-600 to-purple-700' },
    { id: 'cleanup', label: 'Limpeza BD', icon: Database, color: 'from-red-600 to-orange-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-b from-slate-800 via-green-900 to-emerald-900 shadow-2xl relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-400/15 rounded-full blur-2xl"></div>
        </div>
        
        {/* Header */}
        <div className="relative p-8 border-b border-green-700/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
              <img 
                src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                alt="RevGold Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'logo-fallback text-white font-black text-xl';
                    fallback.textContent = 'RG';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">RevGold</h1>
              <p className="text-green-200 text-sm font-semibold">Sistema de Gestão</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-green-200 text-sm font-bold">Sistema Online</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="relative mt-8 px-4" role="navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center px-6 py-4 text-left rounded-2xl transition-all duration-300 mb-3 group relative overflow-hidden
                  ${isActive 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-xl transform scale-105` 
                    : 'text-green-100 hover:text-white hover:bg-green-700/40 hover:transform hover:translate-x-2'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                )}
                <div className={`
                  p-2 rounded-xl mr-4 transition-all duration-300
                  ${isActive 
                    ? 'bg-white/20 shadow-lg' 
                    : 'bg-green-700/30 group-hover:bg-green-600/50'
                  }
                `}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute right-4 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-8 left-4 right-4">
          <div className="bg-green-800/50 backdrop-blur-xl rounded-2xl p-6 border border-green-600/30">
            <p className="text-green-200 text-sm font-semibold mb-2">Sistema RevGold</p>
            <p className="text-green-300 text-xs">Gestão Empresarial Profissional</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs font-bold">Conectado ao Supabase</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white/80 backdrop-blur-xl border-b border-green-100/50 shadow-lg">
          <div className="px-8 py-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-r ${
                menuItems.find(item => item.id === currentPage)?.color || 'from-green-600 to-emerald-700'
              } shadow-xl`}>
                {React.createElement(
                  menuItems.find(item => item.id === currentPage)?.icon || Home,
                  { className: "w-8 h-8 text-white" }
                )}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">
                  {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-slate-600 font-semibold">
                  Sistema RevGold - Gestão Empresarial
                </p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;