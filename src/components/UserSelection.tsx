import React from 'react';
import { User, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const USERS = [
  { id: '1', name: 'Eduardo João', role: 'admin' as const },
  { id: '2', name: 'Eduardo Junior', role: 'admin' as const },
  { id: '3', name: 'Samuel', role: 'admin' as const },
  { id: '4', name: 'Lídia', role: 'admin' as const }
];

export function UserSelection() {
  const { dispatch } = useApp();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleUserSelect = (user: typeof USERS[0]) => {
    dispatch({ 
      type: 'SET_USER', 
      payload: { 
        id: user.id, 
        username: user.name, 
        role: user.role 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4 relative overflow-hidden rustic-texture">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full blur-3xl animate-subtle-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-full blur-3xl animate-subtle-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-16 animation-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-32 w-auto professional-shadow-xl animate-gentle-float professional-hover"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 professional-shadow-xl">
            {getGreeting()}!
          </h1>
          <p className="text-green-100 text-lg font-medium professional-shadow">
            Selecione seu usuário para acessar o sistema
          </p>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group professional-card rounded-lg p-8 professional-shadow-xl professional-hover transform transition-all duration-300 cursor-pointer border border-white/30 hover:bg-white animation-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-700 to-green-800 rounded-full flex items-center justify-center professional-shadow-lg group-hover:professional-shadow-xl transition-all duration-300 group-hover:scale-110 animate-gentle-float">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-800 transition-all duration-300">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                      Administrador
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-700 group-hover:translate-x-2 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 animation-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-green-100 text-lg font-semibold professional-shadow">
            Sistema de Gestão Financeira RevGold
          </p>
          <p className="text-green-200 text-sm mt-2 font-medium professional-shadow">
            Colorindo seu ambiente e levando vida para os seus dias
          </p>
        </div>
      </div>
    </div>
  );
}