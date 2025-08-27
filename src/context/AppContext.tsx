import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  currentView: string;
  isLoading: boolean;
  error: string | null;
}

interface AppContextType {
  state: AppState;
  setCurrentView: (view: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    isLoading: false,
    error: null,
  });

  const setCurrentView = (view: string) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const value: AppContextType = {
    state,
    setCurrentView,
    setLoading,
    setError,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};