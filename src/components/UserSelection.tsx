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
    <div className="min-h-screen bg-gradient-modern flex items-center justify-center p-4 relative overflow-hidden bg-particles">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-600/30 rounded-full blur-3xl animate-pulse-modern floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-emerald-600/30 rounded-full blur-3xl animate-pulse-modern floating-animation" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl animate-pulse-modern floating-animation" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="w-full max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-8 perspective-1000">
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-40 w-auto modern-shadow-xl floating-animation hover-lift transform-3d rotate-hover filter-modern"
            />
          </div>
          <h1 className="text-7xl font-black text-white mb-6 text-shadow-xl animate-bounce-in text-gradient-modern">
            {getGreeting()}!
          </h1>
          <p className="text-slate-200 text-xl font-semibold text-shadow-modern animate-slide-up" style={{ animationDelay: '0.3s' }}>
            Selecione seu perfil para acessar o sistema
          </p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 mx-auto rounded-full animate-scale-in" style={{ animationDelay: '0.6s' }}></div>
          </p>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group glass-effect rounded-2xl p-10 modern-shadow-xl hover-lift cursor-pointer border border-white/20 hover:border-emerald-400/50 transition-modern stagger-animation glow-effect backdrop-blur-modern"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center justify-between relative">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center modern-shadow-lg group-hover:modern-shadow-xl transition-modern group-hover:scale-110 floating-animation neon-glow">
                      <User className="w-10 h-10 text-white filter-modern" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse-modern"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-modern text-shadow-modern">
                      {user.name}
                    </h3>
                    <p className="text-sm text-slate-300 font-semibold uppercase tracking-wider mt-1 group-hover:text-emerald-200 transition-modern">
                      Administrador
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-modern"></div>
                      <span className="text-xs text-slate-400 font-medium">Online</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <ChevronRight className="w-8 h-8 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-3 transition-modern animate-wiggle" />
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full scale-0 group-hover:scale-150 transition-modern opacity-0 group-hover:opacity-100"></div>
                </div>
              </div>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-modern pointer-events-none"></div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-modern origin-left"></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-emerald-400 rounded-full"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse-modern"></div>
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-emerald-400 rounded-full"></div>
          </div>
          <p className="text-slate-100 text-xl font-bold text-shadow-modern mb-2">
            Sistema de Gestão Financeira RevGold
          </p>
          <p className="text-slate-300 text-base font-medium text-shadow-modern">
            Colorindo seu ambiente e levando vida para os seus dias
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}