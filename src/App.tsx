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
import { Reports } from './components/Reports';
import { CashManagement } from './components/CashManagement';
import { Agenda } from './components/Agenda';
import { Employees } from './components/Employees';
import { useApp } from './context/AppContext';

function AppContent() {
  const { currentUser } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  console.log('🔍 AppContent - Estado do usuário atual:', currentUser);

  // Verificar se o usuário está definido corretamente
  if (!currentUser) {
    console.log('👤 AppContent - Usuário não válido, mostrando tela de seleção');
    return <UserSelection />;
  }
  
  console.log('✅ AppContent - Usuário válido logado:', currentUser.username, 'Página atual:', currentPage);

  // Adicionar um pequeno delay para garantir que o estado seja atualizado
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);
  
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando sistema...</p>
          <p className="text-slate-500 text-sm mt-2">Bem-vindo, {currentUser.username}!</p>
        </div>
      </div>
    );
  }
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
    <div className="min-h-screen relative z-20">
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        <div className="relative z-10">
          {renderPage()}
        </div>
      </Layout>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </div>
  );
}

export default App;