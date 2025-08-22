import React, { useState } from 'react';

// Sistema robusto para remover elementos flutuantes que interferem com a navegação
const removeFloatingElements = () => {
  // Remover elementos flutuantes conhecidos que interferem
  const selectors = [
    '[style*="position: fixed"][style*="bottom"][style*="right"][style*="z-index: 2147483647"]',
    '[style*="position: fixed"][style*="bottom: 1rem"][style*="right: 1rem"]',
    '[style*="position: fixed"][style*="z-index: 2147483647"]',
    '.floating-widget',
    '.chat-widget',
    '.support-widget'
  ];
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      console.log('Removendo elemento flutuante:', el);
      el.remove();
    });
  });
};

// Executar imediatamente
removeFloatingElements();

// Observar mudanças no DOM com throttling para performance
let timeoutId: number | null = null;
const throttledRemove = () => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = window.setTimeout(removeFloatingElements, 100);
};

const observer = new MutationObserver(throttledRemove);
observer.observe(document.body, { 
  childList: true, 
  subtree: true,
  attributes: true,
  attributeFilter: ['style', 'class']
});

// Cleanup no unload
window.addEventListener('beforeunload', () => {
  observer.disconnect();
  if (timeoutId) clearTimeout(timeoutId);
});

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
    <div className="relative z-20">
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
    <div className="relative z-0 min-h-screen">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </div>
  );
}

export default App;