import React from 'react';
import { User, ChevronRight, Zap, Sparkles, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const USERS = [
  { 
    id: '1', 
    name: 'Eduardo João', 
    avatar: '👨‍💼'
  },
  { 
    id: '2', 
    name: 'Eduardo Junior', 
    avatar: '👨‍💻'
  },
  { 
    id: '3', 
    name: 'Samuel', 
    avatar: '👨‍🔧'
  },
  { 
    id: '4', 
    name: 'Lídia', 
    avatar: '👩‍💼'
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
        role: 'user'
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-400/20 rounded-full blur-3xl revgold-animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-emerald-400/15 rounded-full blur-3xl revgold-animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-3xl revgold-animate-pulse-glow" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-green-400/40 rounded-full revgold-animate-floating"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>
      
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-20 revgold-animate-fade-in">
          <div className="inline-flex items-center justify-center mb-12 relative">
            <div className="w-48 h-48 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl revgold-hover-lift revgold-animate-floating relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
              <img 
                src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                alt="RevGold Logo" 
                className="w-32 h-32 object-contain relative z-10"
              />
            </div>
          </div>
          
          <h1 className="text-8xl md:text-9xl font-black text-white mb-8 revgold-animate-slide-up">
            {getGreeting()}!
          </h1>
          
          <p className="text-3xl text-green-200 font-bold revgold-animate-slide-up revgold-stagger-2 mb-6">
            Bem-vindo ao Sistema RevGold
          </p>
          
          <p className="text-xl text-emerald-200 font-medium revgold-animate-slide-up revgold-stagger-3 mb-12">
            Sistema Profissional de Gestão Empresarial
          </p>
          
          <div className="flex items-center justify-center space-x-6 revgold-animate-scale-in revgold-stagger-4">
            <div className="w-40 h-1 bg-gradient-to-r from-transparent to-green-400 rounded-full"></div>
            <div className="w-6 h-6 bg-green-400 rounded-full shadow-lg revgold-animate-pulse-glow"></div>
            <div className="w-40 h-1 bg-gradient-to-l from-transparent to-green-400 rounded-full"></div>
          </div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className={`group cursor-pointer revgold-animate-scale-in revgold-stagger-${index + 1} revgold-hover-glow`}
            >
              <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-green-300/30 p-10 transition-all duration-500 hover:bg-white/20 hover:border-green-400/60 hover:shadow-2xl hover:scale-105">
                {/* Card Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 revgold-animate-floating">
                        <span className="text-4xl filter drop-shadow-lg">{user.avatar}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-3xl font-black text-white group-hover:text-green-200 transition-colors duration-300 mb-2">
                        {user.name}
                      </h3>
                      <div className="flex items-center mt-4 space-x-2">
                        <Building2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400 font-bold uppercase tracking-wide">Sistema RevGold</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-400 rounded-full revgold-animate-pulse-glow shadow-lg"></div>
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                      <ChevronRight className="w-10 h-10 text-white group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center revgold-animate-slide-up revgold-stagger-6">
          <div className="inline-block">
            <div className="bg-white/10 backdrop-blur-xl border border-green-300/30 rounded-3xl p-10 max-w-2xl mx-auto shadow-2xl">
              <div className="flex items-center justify-center space-x-8 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl revgold-animate-floating">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-black text-white mb-3">
                    Sistema RevGold
                  </p>
                  <p className="text-base text-green-200 font-bold uppercase tracking-wider">
                    Gestão Empresarial Profissional
                  </p>
                </div>
              </div>
              
              <p className="text-lg text-slate-300 italic mb-8 font-medium">
                "Colorindo seu ambiente e levando vida para os seus dias"
              </p>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="w-4 h-4 bg-green-400 rounded-full revgold-animate-pulse-glow shadow-lg"></div>
                <span className="text-base text-green-300 font-bold uppercase tracking-wide">Sistema Online</span>
                <Sparkles className="w-5 h-5 text-green-400 revgold-animate-floating" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}