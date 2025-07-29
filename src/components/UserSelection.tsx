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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-gradient-to-br from-green-100 to-green-200 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full blur-3xl floating-animation" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-br from-green-50 to-green-100 rounded-full blur-2xl floating-animation" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="w-full max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-32 w-auto modern-shadow-lg floating-animation hover-lift"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 animate-bounce-in">
            {getGreeting()}!
          </h1>
          <p className="text-slate-600 text-xl font-medium animate-slide-up" style={{ animationDelay: '0.3s' }}>
            Selecione seu perfil para acessar o sistema
          </p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 mx-auto rounded-full animate-scale-in" style={{ animationDelay: '0.6s' }}></div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 modern-shadow-lg hover-lift cursor-pointer border border-slate-200 hover:border-green-300 transition-modern stagger-animation"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center justify-between relative">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center modern-shadow group-hover:scale-110 transition-modern">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-green-700 transition-modern">
                      {user.name}
                    </h3>
                    <p className="text-sm text-slate-600 font-medium uppercase tracking-wide mt-1 group-hover:text-green-600 transition-modern">
                      Administrador
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <ChevronRight className="w-6 h-6 text-green-500 group-hover:text-green-600 group-hover:translate-x-2 transition-modern" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-green-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent via-green-500 to-green-400 rounded-full"></div>
          </div>
          <p className="text-slate-800 text-xl font-bold mb-2">
            Sistema de Gestão Financeira RevGold
          </p>
          <p className="text-slate-600 text-base font-medium">
            Colorindo seu ambiente e levando vida para os seus dias
          </p>
        </div>
      </div>
    </div>
  );
}