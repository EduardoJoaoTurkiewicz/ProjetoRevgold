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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-green-500/30 to-green-600/40 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/30 to-emerald-600/40 rounded-full blur-3xl floating-animation" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-green-400/20 to-green-500/30 rounded-full blur-2xl floating-animation" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-20 left-20 w-[200px] h-[200px] bg-gradient-to-br from-emerald-400/20 to-emerald-500/30 rounded-full blur-xl floating-animation" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-20 w-[300px] h-[300px] bg-gradient-to-br from-green-600/20 to-green-700/30 rounded-full blur-2xl floating-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-32 w-auto modern-shadow-lg floating-animation hover-lift neon-glow"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-100 mb-6 animate-bounce-in text-shadow-modern">
            {getGreeting()}!
          </h1>
          <p className="text-slate-300 text-xl font-medium animate-slide-up text-shadow-sm" style={{ animationDelay: '0.3s' }}>
            Selecione seu perfil para acessar o sistema
          </p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 mx-auto rounded-full animate-scale-in neon-glow" style={{ animationDelay: '0.6s' }}></div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 modern-shadow-lg hover-lift cursor-pointer border border-slate-700/50 hover:border-green-500/50 transition-modern stagger-animation glow-effect"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center justify-between relative">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center modern-shadow group-hover:scale-110 transition-modern neon-glow floating-animation">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full neon-glow"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-green-400 transition-modern text-shadow-sm">
                      {user.name}
                    </h3>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wide mt-1 group-hover:text-green-500 transition-modern">
                      Administrador
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full neon-glow"></div>
                      <span className="text-xs text-green-400 font-medium">Online</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <ChevronRight className="w-6 h-6 text-green-400 group-hover:text-green-300 group-hover:translate-x-2 transition-modern" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-green-500 rounded-full neon-glow"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full neon-glow"></div>
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent via-green-500 to-green-400 rounded-full neon-glow"></div>
          </div>
          <p className="text-slate-100 text-xl font-bold mb-2 text-shadow-modern">
            Sistema de Gestão Financeira RevGold
          </p>
          <p className="text-slate-300 text-base font-medium text-shadow-sm">
            Colorindo seu ambiente e levando vida para os seus dias
          </p>
        </div>
      </div>
    </div>
  );
}