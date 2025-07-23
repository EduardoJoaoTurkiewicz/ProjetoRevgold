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
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-12 animation-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-32 w-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {getGreeting()}!
          </h1>
          <p className="text-emerald-100 text-lg">
            Selecione seu usuário para acessar o sistema
          </p>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group glass-effect rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer border border-white/30 hover:bg-white/95 animation-fade-in hover-lift"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-gradient transition-all duration-300">
                      {user.name}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-2 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 animation-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-yellow-200 text-sm">
            Sistema de Gestão Financeira RevGold
          </p>
          <p className="text-emerald-200 text-xs mt-1">
            Colorindo seu ambiente e levando vida para os seus dias
          </p>
        </div>
      </div>
    </div>
  );
}