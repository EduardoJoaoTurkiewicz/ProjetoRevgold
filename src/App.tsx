import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

import { AppProvider } from './context/AppContext';
import { UserSelection } from './components/UserSelection';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { Sales } from './components/Sales';
import { Debts } from './components/Debts';
import { Checks } from './components/Checks';
import { Boletos } from './components/Boletos';
import { PixFees } from './components/PixFees';
import Reports from './components/Reports';
import { CashManagement } from './components/CashManagement';
import { Agenda } from './components/Agenda';
import { Employees } from './components/Employees';
import { useApp } from './context/AppContext';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
      <AppProvider>
        <AppContent 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          isInitializing={isInitializing}
          setIsInitializing={setIsInitializing}
        />
      </AppProvider>
    </div>
  );
}

function AppContent({ 
  currentPage, 
  setCurrentPage, 
  isInitializing, 
  setIsInitializing 
}: {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isInitializing: boolean;
  setIsInitializing: (initializing: boolean) => void;
}) {
  const { currentUser } = useApp();
  
  console.log('🔍 AppContent - Estado do usuário atual:', currentUser);

  // Aguardar inicialização do sistema
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000); // Dar tempo para o sistema carregar
    
    return () => clearTimeout(timer);
  }, [setIsInitializing]);

  // Verificar se o usuário está definido corretamente
  if (!currentUser || isInitializing) {
    console.log('👤 AppContent - Usuário não válido, mostrando tela de seleção');
    return isInitializing ? (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <img 
              src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
              alt="RevGold Logo" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.logo-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'logo-fallback text-white font-black text-2xl';
                  fallback.textContent = 'RG';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Inicializando Sistema RevGold</h2>
          <p className="text-green-200 font-semibold">Carregando componentes...</p>
        </div>
      </div>
    ) : (
      <UserSelection />
    );
  }
  
  console.log('✅ AppContent - Usuário válido logado:', currentUser.username, 'Página atual:', currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'sales':
        return <Sales />;
      case 'debts':
        return <Debts />;
      case 'checks':
        return <Checks />;
      case 'boletos':
        return <Boletos />;
      case 'pix-fees':
        return <PixFees />;
      case 'employees':
        return <Employees />;
      case 'cash':
        return <CashManagement />;
      case 'reports':
        return <Reports />;
      case 'agenda':
        return <Agenda />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderPage()}
      </Layout>
    </div>
  );
}

export default App;