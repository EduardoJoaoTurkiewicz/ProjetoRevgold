import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  currentView: string;
  isLoading: boolean;
  user: any;
  notifications: any[];
}

interface AppContextType {
  state: AppState;
  setCurrentView: (view: string) => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: any) => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    isLoading: false,
    user: null,
    notifications: []
  });

  const setCurrentView = (view: string) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setUser = (user: any) => {
    setState(prev => ({ ...prev, user }));
  };

  const addNotification = (notification: any) => {
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, { ...notification, id: Date.now().toString() }]
    }));
  };

  const removeNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const value: AppContextType = {
    state,
    setCurrentView,
    setLoading,
    setUser,
    addNotification,
    removeNotification
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