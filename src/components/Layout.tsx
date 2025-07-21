import React from 'react';
import { Building2, BarChart3, Calendar, Users, DollarSign, FileText, CreditCard, Receipt, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, onPageChange, children }) => {
  const { state } = useApp();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <img 
                src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                alt="RevGold Logo" 
                className="h-12 w-auto drop-shadow-lg"
              />
              <h1 className="text-2xl font-bold text-slate-800 hidden sm:block">
                RevGold System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800">
                  {getGreeting()}, {state.user?.username}!
                </p>
                <p className="text-sm text-slate-600">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200 min-h-screen transition-transform duration-300 ease-in-out`}>
          <div className="p-8">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center space-x-3">
                <img 
                  src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                  alt="RevGold Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-bold text-slate-800">
                  RevGold System
                </h1>
              </div>
            </div>
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onPageChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium ${
                        currentPage === item.id
                          ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-xl transform scale-105'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-lg">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};