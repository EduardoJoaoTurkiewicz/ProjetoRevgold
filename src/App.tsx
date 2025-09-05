import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { PrintReportPage } from './components/reports/PrintReportPage';

function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          <Route path="/print/reports" element={<PrintReportPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AppProvider>
    </Router>
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
    default:
      return <Dashboard />;
  }
}

export default App;