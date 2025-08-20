import React, { useState } from 'react';

  const removeFloating = () => {
  document.querySelectorAll('[style*="position: fixed"][style*="bottom: 1rem"][style*="right: 1rem"][style*="z-index: 2147483647"]').forEach(el => el.remove());
};

// executa já no load
removeFloating();

// observa mudanças no DOM
const observer = new MutationObserver(removeFloating);
observer.observe(document.body, { childList: true, subtree: true });

import { AppProvider } from './context/AppContext';
import { UserSelection } from './components/UserSelection';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { Sales } from './components/Sales';
import { Debts } from './components/Debts';
import { Checks } from './components/Checks';
import { Boletos } from './components/Boletos';
import { Reports } from './components/Reports';
import { Agenda } from './components/Agenda';
import { Employees } from './components/Employees';
import { useApp } from './context/AppContext';

function AppContent() {
  const { state } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!state.user) {
    return <UserSelection />;
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
      case 'employees':
        return <Employees />;
      case 'reports':
        return <Reports />;
      case 'agenda':
        return <Agenda />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;