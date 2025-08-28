import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  user: any;
  setUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const value: AppContextType = {
    currentView,
    setCurrentView,
    isLoading,
    setIsLoading,
    user,
    setUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;