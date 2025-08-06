import React from 'react';
import { useState } from 'react';
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

// Avatar SVG Component
const UserAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    
    {/* Head */}
    <circle cx="50" cy="35" r="18" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="1"/>
    
    {/* Hair */}
    <path d="M32 25 Q50 15 68 25 Q68 20 50 18 Q32 20 32 25" fill="url(#hairGradient)"/>
    
    {/* Eyes */}
    <circle cx="44" cy="32" r="2" fill="#1f2937"/>
    <circle cx="56" cy="32" r="2" fill="#1f2937"/>
    <circle cx="44.5" cy="31.5" r="0.5" fill="white"/>
    <circle cx="56.5" cy="31.5" r="0.5" fill="white"/>
    
    {/* Nose */}
    <ellipse cx="50" cy="36" rx="1" ry="1.5" fill="#f59e0b" opacity="0.6"/>
    
    {/* Mouth */}
    <path d="M47 40 Q50 42 53 40" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    
    {/* Body */}
    <ellipse cx="50" cy="70" rx="20" ry="25" fill="url(#shirtGradient)" stroke="#047857" strokeWidth="1"/>
    
    {/* Arms */}
    <ellipse cx="28" cy="65" rx="6" ry="15" fill="url(#shirtGradient)" stroke="#047857" strokeWidth="1"/>
    <ellipse cx="72" cy="65" rx="6" ry="15" fill="url(#shirtGradient)" stroke="#047857" strokeWidth="1"/>
    
    {/* Hands */}
    <circle cx="28" cy="78" r="4" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="0.5"/>
    <circle cx="72" cy="78" r="4" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="0.5"/>
    
    {/* Collar */}
    <path d="M40 55 L50 60 L60 55" stroke="#10b981" strokeWidth="2" fill="none"/>
    
    {/* RevGold Logo on shirt */}
    <circle cx="50" cy="70" r="6" fill="#10b981" opacity="0.8"/>
    <text x="50" y="73" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">RG</text>
  </svg>
);
interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    time: string;
    type: 'success' | 'warning' | 'info' | 'error';
    timestamp: number;
  }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { state } = useApp();

  // Função para adicionar notificação
  const addNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      time: 'Agora',
      type,
      timestamp: Date.now()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Manter apenas 10 notificações
  };

  // Função de busca
  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    const searchResults = [];
    
    // Buscar em vendas
    const salesResults = state.sales.filter(sale => 
      sale.client.toLowerCase().includes(query.toLowerCase()) ||
      (Array.isArray(sale.products) 
        ? sale.products.some(p => p.name.toLowerCase().includes(query.toLowerCase()))
        : sale.products.toLowerCase().includes(query.toLowerCase())
      )
    );
    
    // Buscar em dívidas
    const debtsResults = state.debts.filter(debt =>
      debt.company.toLowerCase().includes(query.toLowerCase()) ||
      debt.description.toLowerCase().includes(query.toLowerCase())
    );
    
    // Buscar em funcionários
    const employeesResults = state.employees.filter(employee =>
      employee.name.toLowerCase().includes(query.toLowerCase()) ||
      employee.position.toLowerCase().includes(query.toLowerCase())
    );
    
    if (salesResults.length > 0) {
      searchResults.push(`${salesResults.length} venda(s) encontrada(s)`);
    }
    if (debtsResults.length > 0) {
      searchResults.push(`${debtsResults.length} dívida(s) encontrada(s)`);
    }
    if (employeesResults.length > 0) {
      searchResults.push(`${employeesResults.length} funcionário(s) encontrado(s)`);
    }
    
    if (searchResults.length > 0) {
      addNotification(`Busca por "${query}": ${searchResults.join(', ')}`, 'info');
    } else {
      addNotification(`Nenhum resultado encontrado para "${query}"`, 'warning');
    }
  };

  // Monitorar mudanças no estado para gerar notificações
  React.useEffect(() => {
    const lastSalesCount = localStorage.getItem('lastSalesCount');
    const lastDebtsCount = localStorage.getItem('lastDebtsCount');
    const lastEmployeesCount = localStorage.getItem('lastEmployeesCount');
    const lastChecksCount = localStorage.getItem('lastChecksCount');
    const lastBoletosCount = localStorage.getItem('lastBoletosCount');
    
    const currentSalesCount = state.sales.length;
    const currentDebtsCount = state.debts.length;
    const currentEmployeesCount = state.employees.length;
    const currentChecksCount = state.checks.length;
    const currentBoletosCount = state.boletos.length;
    
    // Verificar novas vendas
    if (lastSalesCount && parseInt(lastSalesCount) < currentSalesCount) {
      const newSales = currentSalesCount - parseInt(lastSalesCount);
      addNotification(`${newSales} nova(s) venda(s) registrada(s)`, 'success');
    }
    
    // Verificar novas dívidas
    if (lastDebtsCount && parseInt(lastDebtsCount) < currentDebtsCount) {
      const newDebts = currentDebtsCount - parseInt(lastDebtsCount);
      addNotification(`${newDebts} nova(s) dívida(s) registrada(s)`, 'warning');
    }
    
    // Verificar novos funcionários
    if (lastEmployeesCount && parseInt(lastEmployeesCount) < currentEmployeesCount) {
      const newEmployees = currentEmployeesCount - parseInt(lastEmployeesCount);
      addNotification(`${newEmployees} novo(s) funcionário(s) cadastrado(s)`, 'info');
    }
    
    // Verificar novos cheques
    if (lastChecksCount && parseInt(lastChecksCount) < currentChecksCount) {
      const newChecks = currentChecksCount - parseInt(lastChecksCount);
      addNotification(`${newChecks} novo(s) cheque(s) registrado(s)`, 'info');
    }
    
    // Verificar novos boletos
    if (lastBoletosCount && parseInt(lastBoletosCount) < currentBoletosCount) {
      const newBoletos = currentBoletosCount - parseInt(lastBoletosCount);
      addNotification(`${newBoletos} novo(s) boleto(s) gerado(s)`, 'info');
    }
    
    // Atualizar contadores no localStorage
    localStorage.setItem('lastSalesCount', currentSalesCount.toString());
    localStorage.setItem('lastDebtsCount', currentDebtsCount.toString());
    localStorage.setItem('lastEmployeesCount', currentEmployeesCount.toString());
    localStorage.setItem('lastChecksCount', currentChecksCount.toString());
    localStorage.setItem('lastBoletosCount', currentBoletosCount.toString());
  }, [state.sales.length, state.debts.length, state.employees.length, state.checks.length, state.boletos.length]);

  // Verificar cheques vencendo
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const checksDueToday = state.checks.filter(check => 
      check.dueDate === today && check.status === 'pendente'
    );
    
    const checksDueTomorrow = state.checks.filter(check => 
      check.dueDate === tomorrowStr && check.status === 'pendente'
    );
    
    if (checksDueToday.length > 0) {
      addNotification(`${checksDueToday.length} cheque(s) vencendo hoje`, 'warning');
    }
    
    if (checksDueTomorrow.length > 0) {
      addNotification(`${checksDueTomorrow.length} cheque(s) vencendo amanhã`, 'info');
    }
  }, [state.checks]);

  // Função para logout
  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      localStorage.removeItem('revgold-data');
      localStorage.removeItem('lastSalesCount');
      localStorage.removeItem('lastDebtsCount');
      localStorage.removeItem('lastEmployeesCount');
      localStorage.removeItem('lastChecksCount');
      localStorage.removeItem('lastBoletosCount');
      // Reset user state
      dispatch({ type: 'SET_USER', payload: null });
    }
  };

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
                  <img 
                    src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                    alt="RevGold Logo" 
                    className="w-10 h-10 object-contain"
                  />
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
            <button
              onClick={handleLogout}
              className="w-full mb-4 p-3 rounded-xl bg-red-600/80 hover:bg-red-500 text-white transition-all duration-300 text-sm font-semibold"
            >
              🚪 Sair do Sistema
            </button>
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-green-800/20 hover:bg-green-700/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                <UserAvatar />
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleSearch(searchQuery);
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center shadow-xl revgold-animate-floating">
                    }
                  src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png"
                  placeholder="Buscar..."
                  className="bg-transparent border-none outline-none text-sm text-green-700 placeholder-green-400 font-medium w-48"
                />
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 rounded-2xl hover:bg-green-50 transition-all duration-300 hover:shadow-md group"
                >
                  <Bell className="w-6 h-6 text-green-600 group-hover:text-green-700 transition-colors" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg revgold-animate-pulse-glow flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{notifications.length}</span>
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-green-100 z-50">
                    <div className="p-4 border-b border-green-100">
                      <h3 className="font-bold text-green-800">Notificações</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div key={notification.id} className={`p-4 border-b border-green-50 hover:bg-green-50 transition-colors ${
                            notification.type === 'success' ? 'border-l-4 border-l-green-500' :
                            notification.type === 'warning' ? 'border-l-4 border-l-yellow-500' :
                            notification.type === 'error' ? 'border-l-4 border-l-red-500' :
                            'border-l-4 border-l-blue-500'
                          }`}>
                            <p className="text-sm font-medium text-slate-800">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">Nenhuma notificação</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-green-100">
                      <button 
                        onClick={() => {
                          setNotifications([]);
                          setShowNotifications(false);
                        }}
                        className="w-full text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
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