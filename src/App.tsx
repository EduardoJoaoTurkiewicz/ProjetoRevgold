import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
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
import { UserSelection } from './components/UserSelection';
import { useApp } from './context/AppContext';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
      <AppProvider>
        <AppContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </AppProvider>
    </div>
  );
}

function AppContent({ currentPage, setCurrentPage }: {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}) {
  const { currentUser } = useApp();
  
  console.log('🔍 AppContent - Estado do usuário atual:', currentUser);


  // Se não há usuário, mostrar tela de seleção
  if (!currentUser) {
    console.log('👤 AppContent - Usuário não válido, mostrando tela de seleção');
    return (
      <div className="min-h-screen">
        <UserSelection />
      </div>
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