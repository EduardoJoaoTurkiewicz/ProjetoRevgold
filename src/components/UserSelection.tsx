import React from 'react';
import { User, ChevronRight, Shield, Crown, Star, Zap, Sparkles, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';

const USERS = [
  { 
    id: '1', 
    name: 'Eduardo João', 
    role: 'admin' as const, 
    avatar: '👨‍💼', 
    title: 'CEO & Fundador',
    description: 'Acesso completo ao sistema',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  { 
    id: '2', 
    name: 'Eduardo Junior', 
    role: 'admin' as const, 
    avatar: '👨‍💻', 
    title: 'Diretor Executivo',
    description: 'Gestão operacional e estratégica',
    gradient: 'from-green-500 to-green-600'
  },
  { 
    id: '3', 
    name: 'Samuel', 
    role: 'admin' as const, 
    avatar: '👨‍🔧', 
    title: 'Gerente Geral',
    description: 'Supervisão de todas as operações',
    gradient: 'from-teal-500 to-teal-600'
  },
  { 
    id: '4', 
    name: 'Lídia', 
    role: 'admin' as const, 
    avatar: '👩‍💼', 
    title: 'Diretora Financeira',
    description: 'Controle financeiro e contábil',
    gradient: 'from-green-600 to-emerald-700'
  }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>
      
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-12 relative">
            <div className="w-40 h-40 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl hover-lift floating-animation relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
              <img 
                src="/image.png" 
                alt="RevGold Logo" 
                className="w-24 h-24 object-contain relative z-10"
              />
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black text-white mb-8 animate-slide-up text-gradient">
            {getGreeting()}!
          </h1>
          
          <p className="text-2xl text-yellow-100 font-bold animate-slide-up mb-4" style={{ animationDelay: '0.2s' }}>
            Bem-vindo ao Sistema RevGold
          </p>
          
          <p className="text-lg text-slate-300 font-medium animate-slide-up mb-12" style={{ animationDelay: '0.3s' }}>
            Sistema de Gestão Empresarial
          </p>
          
          <div className="flex items-center justify-center space-x-4 animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent to-emerald-400 rounded-full"></div>
            <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg animate-pulse"></div>
            <div className="w-32 h-1 bg-gradient-to-l from-transparent to-emerald-400 rounded-full"></div>
          </div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-16">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group cursor-pointer stagger-animation hover-glow"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 transition-all duration-700 hover:bg-white/20 hover:border-yellow-400/50 hover:shadow-2xl hover:scale-105">
                {/* Card Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${user.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className={`w-20 h-20 bg-gradient-to-br ${user.gradient} rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}>
                        <span className="text-3xl filter drop-shadow-lg">{user.avatar}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-white group-hover:text-yellow-300 transition-colors duration-300 mb-2">
                        {user.name}
                      </h3>
                      <p className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                        {user.title}
                      </p>
                      <p className="text-sm text-slate-300 font-medium">
                        {user.description}
                      </p>
                      <div className="flex items-center mt-3 space-x-1">
                        <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Profissional</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                      <ChevronRight className="w-8 h-8 text-emerald-900 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="inline-block">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-lg mx-auto shadow-2xl">
              <div className="flex items-center justify-center space-x-6 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl floating-animation">
                  <Zap className="w-8 h-8 text-emerald-900" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-white mb-2">
                    Sistema RevGold
                  </p>
                  <p className="text-sm text-emerald-200 font-bold uppercase tracking-wider">
                    Gestão Empresarial
                  </p>
                </div>
              </div>
              
              <p className="text-base text-slate-300 italic mb-6 font-medium">
                "Colorindo seu ambiente e levando vida para os seus dias"
              </p>
              
              <div className="flex items-center justify-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-sm text-green-300 font-bold uppercase tracking-wide">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}