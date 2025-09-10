import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/errorHandler';
import './lib/consoleFilter';
import './lib/networkInterceptor';
import './lib/connectionManager'; // Initialize connection manager
import './lib/syncManager'; // Initialize sync manager

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
