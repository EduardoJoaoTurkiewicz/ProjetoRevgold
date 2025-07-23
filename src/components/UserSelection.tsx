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
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-blue-800 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse floating-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse floating-animation" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-16 animation-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-40 w-auto drop-shadow-3xl floating-animation hover:scale-110 transition-transform duration-500"
            />
          </div>
          <h1 className="text-6xl font-black text-white mb-4 drop-shadow-2xl bg-gradient-to-r from-white via-emerald-100 to-blue-100 bg-clip-text text-transparent">
            {getGreeting()}!
          </h1>
          <p className="text-emerald-100 text-xl font-semibold drop-shadow-lg">
            Selecione seu usuário para acessar o sistema
          </p>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group glass-effect rounded-3xl p-10 shadow-3xl hover:shadow-3xl transform hover:scale-110 transition-all duration-700 cursor-pointer border border-white/40 hover:bg-white/95 animation-fade-in hover-lift glow-effect"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-125 floating-animation">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 group-hover:text-gradient transition-all duration-500">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-semibold uppercase tracking-wider">
                      Administrador
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-8 h-8 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-4 transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 animation-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-yellow-200 text-lg font-bold drop-shadow-lg">
            Sistema de Gestão Financeira RevGold
          </p>
          <p className="text-emerald-200 text-sm mt-2 font-medium drop-shadow-md">
            Colorindo seu ambiente e levando vida para os seus dias
          </p>
        </div>
      </div>
    </div>
  );
}