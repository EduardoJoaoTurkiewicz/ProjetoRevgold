import React, { useState } from 'react';

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
  console.log('🔍 AppContent - Tipo do currentUser:', typeof currentUser);
  console.log('🔍 AppContent - currentUser é null?', currentUser === null);
  console.log('🔍 AppContent - currentUser é undefined?', currentUser === undefined);

  if (!currentUser) {
    console.log('👤 AppContent - Nenhum usuário selecionado, mostrando tela de seleção');
    return <UserSelection />;
  }
  
  console.log('✅ AppContent - Usuário logado:', currentUser.username, 'Página atual:', currentPage);

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