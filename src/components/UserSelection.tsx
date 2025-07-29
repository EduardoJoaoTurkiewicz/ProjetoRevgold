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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-green-400/40 to-green-600/40 rounded-full blur-3xl animate-pulse-modern floating-animation neon-glow"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-green-300/40 to-green-500/40 rounded-full blur-3xl animate-pulse-modern floating-animation neon-glow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-full blur-2xl animate-pulse-modern floating-animation neon-glow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-green-400/20 rounded-full blur-xl animate-pulse-modern" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-500/20 rounded-full blur-xl animate-pulse-modern" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-24 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-8 perspective-1000">
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-48 w-auto modern-shadow-xl floating-animation hover-lift transform-3d rotate-hover filter-modern neon-glow"
            />
          </div>
          <h1 className="text-8xl font-black text-white mb-8 text-shadow-xl animate-bounce-in">
            {getGreeting()}!
          </h1>
          <p className="text-green-100 text-2xl font-bold text-shadow-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
            Selecione seu perfil para acessar o sistema
          </p>
          <div className="mt-6 w-32 h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 mx-auto rounded-full animate-scale-in neon-glow" style={{ animationDelay: '0.6s' }}></div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group glass-effect rounded-3xl p-12 modern-shadow-xl hover-lift cursor-pointer border-2 border-green-400/30 hover:border-green-400/70 transition-modern stagger-animation glow-effect backdrop-blur-modern transform-3d"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center justify-between relative transform-3d">
                <div className="flex items-center space-x-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-3xl flex items-center justify-center modern-shadow-xl group-hover:modern-shadow-xl transition-modern group-hover:scale-125 floating-animation neon-glow transform-3d">
                      <User className="w-12 h-12 text-white filter-modern" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full animate-pulse-modern neon-glow"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-300 rounded-full animate-pulse-modern opacity-60" style={{ animationDelay: '1s' }}></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white group-hover:text-green-200 transition-modern text-shadow-lg">
                      {user.name}
                    </h3>
                    <p className="text-base text-green-200 font-bold uppercase tracking-wider mt-2 group-hover:text-green-100 transition-modern">
                      Administrador
                    </p>
                    <div className="mt-3 flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-modern neon-glow"></div>
                      <span className="text-sm text-green-300 font-bold">Online</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <ChevronRight className="w-10 h-10 text-green-400 group-hover:text-green-200 group-hover:translate-x-4 transition-modern animate-wiggle filter-modern" />
                  <div className="absolute inset-0 bg-green-400/30 rounded-full scale-0 group-hover:scale-200 transition-modern opacity-0 group-hover:opacity-100 blur-sm"></div>
                </div>
              </div>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-green-600/10 to-green-700/15 rounded-3xl opacity-0 group-hover:opacity-100 transition-modern pointer-events-none"></div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-b-3xl transform scale-x-0 group-hover:scale-x-100 transition-modern origin-left neon-glow"></div>
              
              {/* Side accent lines */}
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-l-3xl transform scale-y-0 group-hover:scale-y-100 transition-modern origin-top"></div>
              <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-r-3xl transform scale-y-0 group-hover:scale-y-100 transition-modern origin-bottom"></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-24 animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="inline-flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-green-400 to-green-500 rounded-full neon-glow"></div>
            <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse-modern neon-glow"></div>
            <div className="w-16 h-1 bg-gradient-to-l from-transparent via-green-500 to-green-400 rounded-full neon-glow"></div>
          </div>
          <p className="text-white text-2xl font-black text-shadow-lg mb-3">
            Sistema de Gestão Financeira RevGold
          </p>
          <p className="text-green-100 text-lg font-bold text-shadow-modern">
            Colorindo seu ambiente e levando vida para os seus dias
          </p>
          <div className="mt-8 flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce neon-glow" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce neon-glow" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce neon-glow" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}