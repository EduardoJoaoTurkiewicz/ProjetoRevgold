import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectionStatus } from './components/ConnectionStatus';
import { Toaster } from 'react-hot-toast';
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
import { Taxes } from './components/Taxes';
import { Acertos } from './components/Acertos';
import { PrintReportPage } from './components/reports/PrintReportPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <ConnectionStatus />
          <Routes>
            <Route path="/print/reports" element={<PrintReportPage />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderPage(currentPage)}
      </Layout>
    </div>
  );
}

function renderPage(currentPage: string) {
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
    case 'taxes':
      return <Taxes />;
    case 'reports':
      return <Reports />;
    case 'agenda':
      return <Agenda />;
    case 'acertos':
      return <Acertos />;
    default:
      return <Dashboard />;
  }
}

export default App;