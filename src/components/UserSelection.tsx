import React from 'react';
import { User, ChevronRight, Shield, Crown, Star, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

const USERS = [
  { 
    id: '1', 
    name: 'Eduardo João', 
    role: 'admin' as const, 
    avatar: '👑', 
    title: 'CEO & Fundador',
    description: 'Acesso completo ao sistema'
  },
  { 
    id: '2', 
    name: 'Eduardo Junior', 
    role: 'admin' as const, 
    avatar: '⚡', 
    title: 'Diretor Executivo',
    description: 'Gestão operacional e estratégica'
  },
  { 
    id: '3', 
    name: 'Samuel', 
    role: 'admin' as const, 
    avatar: '🚀', 
    title: 'Gerente Geral',
    description: 'Supervisão de todas as operações'
  },
  { 
    id: '4', 
    name: 'Lídia', 
    role: 'admin' as const, 
    avatar: '✨', 
    title: 'Diretora Financeira',
    description: 'Controle financeiro e contábil'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-8 relative">
            <div className="w-32 h-32 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-modern-xl hover-lift">
              <img 
                src="/image.png" 
                alt="RevGold Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-modern">
              <Crown className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 animate-slide-up">
            {getGreeting()}!
          </h1>
          
          <p className="text-xl text-gray-600 font-medium animate-slide-up mb-8" style={{ animationDelay: '0.2s' }}>
            Bem-vindo ao sistema RevGold
          </p>
          
          <div className="flex items-center justify-center space-x-4 animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent to-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-24 h-0.5 bg-gradient-to-l from-transparent to-green-500 rounded-full"></div>
          </div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="group cursor-pointer stagger-animation"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="card card-elevated hover-lift group-hover:border-green-500 transition-all duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-modern group-hover:shadow-modern-lg transition-all duration-300">
                        <span className="text-2xl">{user.avatar}</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                        {user.name}
                      </h3>
                      <p className="text-sm font-semibold text-green-600 mb-1">
                        {user.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-xs text-gray-500 ml-2">Administrador</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-modern group-hover:shadow-modern-lg group-hover:scale-110 transition-all duration-300">
                      <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" />
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
            <div className="card bg-gradient-light border-green-200 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-modern">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    Sistema RevGold
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Gestão Financeira Profissional
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 italic mb-4">
                "Colorindo seu ambiente e levando vida para os seus dias"
              </p>
              
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-semibold">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}