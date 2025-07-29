import React from 'react';
import { User, ChevronRight, Sparkles, Zap, Star, Crown } from 'lucide-react';
import { useApp } from '../context/AppContext';

const USERS = [
  { id: '1', name: 'Eduardo João', role: 'admin' as const, avatar: '👑', color: 'from-blue-500 to-purple-600' },
  { id: '2', name: 'Eduardo Junior', role: 'admin' as const, avatar: '⚡', color: 'from-purple-500 to-pink-600' },
  { id: '3', name: 'Samuel', role: 'admin' as const, avatar: '🚀', color: 'from-green-500 to-teal-600' },
  { id: '4', name: 'Lídia', role: 'admin' as const, avatar: '✨', color: 'from-orange-500 to-red-600' }
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
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 to-purple-600/40 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/30 to-pink-600/40 rounded-full blur-3xl floating-animation" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-green-400/20 to-teal-500/30 rounded-full blur-2xl floating-animation" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-20 left-20 w-[250px] h-[250px] bg-gradient-to-br from-orange-400/20 to-red-500/30 rounded-full blur-xl floating-animation" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-20 w-[350px] h-[350px] bg-gradient-to-br from-cyan-600/20 to-blue-700/30 rounded-full blur-2xl floating-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-50 scale-110"></div>
            <img 
              src="/image.png" 
              alt="RevGold Logo" 
              className="h-40 w-auto modern-shadow-xl floating-animation hover-lift neon-glow relative z-10 rounded-3xl"
            />
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center neon-glow animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="relative">
            <h1 className="text-7xl md:text-8xl font-black text-white mb-8 animate-bounce-in text-shadow-modern">
              {getGreeting()}!
            </h1>
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl rounded-full"></div>
          </div>
          
          <p className="text-slate-300 text-2xl font-bold animate-slide-up text-shadow-sm mb-6" style={{ animationDelay: '0.3s' }}>
            Selecione seu perfil para acessar o sistema
          </p>
          
          <div className="flex items-center justify-center gap-4 animate-scale-in" style={{ animationDelay: '0.6s' }}>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-purple-500 rounded-full neon-glow"></div>
            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full neon-glow animate-pulse"></div>
            <div className="w-32 h-1 bg-gradient-to-l from-transparent via-purple-500 to-pink-400 rounded-full neon-glow"></div>
          </div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group cursor-pointer stagger-animation card-3d glow-effect"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="relative overflow-hidden rounded-3xl p-10 transition-all duration-500 hover-lift">
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl"></div>
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${user.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className={`w-20 h-20 bg-gradient-to-br ${user.color} rounded-3xl flex items-center justify-center modern-shadow-xl group-hover:scale-110 transition-all duration-500 neon-glow floating-animation`}>
                        <span className="text-3xl">{user.avatar}</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center neon-glow animate-pulse">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-500 group-hover:bg-clip-text transition-all duration-500 text-shadow-sm">
                        {user.name}
                      </h3>
                      <p className="text-slate-400 font-bold uppercase tracking-wider mt-2 group-hover:text-slate-300 transition-colors duration-500">
                        Administrador
                      </p>
                      <div className="mt-3 flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full neon-glow animate-pulse"></div>
                        <span className="text-sm text-green-400 font-bold">Online</span>
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center modern-shadow-xl group-hover:scale-110 transition-all duration-500 neon-glow">
                      <ChevronRight className="w-8 h-8 text-white group-hover:translate-x-2 transition-transform duration-500" />
                    </div>
                  </div>
                </div>
                
                {/* Bottom Glow */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-3xl neon-glow"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="inline-flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-purple-500 rounded-full neon-glow"></div>
            <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full neon-glow animate-pulse"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-purple-500 to-pink-400 rounded-full neon-glow"></div>
          </div>
          
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl rounded-2xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 modern-shadow-xl">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center neon-glow floating-animation">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white text-2xl font-black mb-1 text-shadow-modern">
                    Sistema RevGold
                  </p>
                  <p className="text-slate-300 text-lg font-bold text-shadow-sm">
                    Gestão Financeira Profissional
                  </p>
                </div>
              </div>
              
              <p className="text-slate-400 text-base font-medium italic">
                "Colorindo seu ambiente e levando vida para os seus dias"
              </p>
              
              <div className="mt-4 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full neon-glow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}