import React from 'react';
import { User, ChevronRight, Zap, Sparkles, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { testSupabaseConnection, healthCheck } from '../lib/supabase';

const USERS = [
  { 
    id: '1', 
    name: 'Eduardo João', 
    avatar: 'svg'
  },
  { 
    id: '2', 
    name: 'Eduardo Junior', 
    avatar: 'svg'
  },
  { 
    id: '3', 
    name: 'Samuel', 
    avatar: 'svg'
  },
  { 
    id: '4', 
    name: 'Lídia', 
    avatar: 'svg'
  }
];

// Avatar SVG Component
const UserAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    
    {/* Head */}
    <circle cx="50" cy="35" r="18" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="1"/>
    
    {/* Hair */}
    <path d="M32 25 Q50 15 68 25 Q68 20 50 18 Q32 20 32 25" fill="url(#hairGradient)"/>
    
    {/* Eyes */}
    <circle cx="44" cy="32" r="2" fill="#1f2937"/>
    <circle cx="56" cy="32" r="2" fill="#1f2937"/>
    <circle cx="44.5" cy="31.5" r="0.5" fill="white"/>
    <circle cx="56.5" cy="31.5" r="0.5" fill="white"/>
    
    {/* Nose */}
    <ellipse cx="50" cy="36" rx="1" ry="1.5" fill="#f59e0b" opacity="0.6"/>
    
    {/* Mouth */}
    <path d="M47 40 Q50 42 53 40" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    
    {/* Body */}
    <ellipse cx="50" cy="70" rx="20" ry="25" fill="url(#shirtGradient)" stroke="#047857" strokeWidth="1"/>
    
    {/* Arms */}
    <ellipse cx="28" cy="65" rx="6" ry="15" fill="url(#shirtGradient)" stroke="#047857" strokeWidth="1"/>
    <ellipse cx="72" cy="65" rx="6" ry="15" fill="url(#shirtGradient)" stroke="#047857" strokeWidth="1"/>
    
    {/* Hands */}
    <circle cx="28" cy="78" r="4" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="0.5"/>
    <circle cx="72" cy="78" r="4" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="0.5"/>
    
    {/* Collar */}
    <path d="M40 55 L50 60 L60 55" stroke="#10b981" strokeWidth="2" fill="none"/>
    
    {/* RevGold Logo on shirt */}
    <circle cx="50" cy="70" r="6" fill="#10b981" opacity="0.8"/>
    <text x="50" y="73" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">RG</text>
  </svg>
);

export function UserSelection() {
  const { dispatch, isSupabaseConfigured } = useApp();
  const [connectionStatus, setConnectionStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionDetails, setConnectionDetails] = React.useState<any>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);

  // Test connection on component mount
  React.useEffect(() => {
    const testConnection = async () => {
      console.log('🔍 Testando conexão com Supabase...');
      
      if (!isSupabaseConfigured()) {
        setConnectionStatus('error');
        setConnectionDetails({ error: 'Supabase não configurado' });
        return;
      }

      try {
        const health = await healthCheck();
        setConnectionDetails(health);
        
        if (health.connected) {
          setConnectionStatus('connected');
          console.log('✅ Conexão com Supabase estabelecida');
        } else {
          setConnectionStatus('error');
          console.log('❌ Falha na conexão com Supabase');
        }
      } catch (error) {
        setConnectionStatus('error');
        setConnectionDetails({ error: error.message });
        console.error('❌ Erro ao testar conexão:', error);
      }
    };

    testConnection();
  }, [isSupabaseConfigured]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleUserSelect = (user: typeof USERS[0]) => {
    console.log('🎯 handleUserSelect chamado para:', user.name);
    
    setIsConnecting(true);
    
    // Simular delay de conexão para melhor UX
    setTimeout(() => {
      try {
        console.log('📤 Despachando ação SET_USER...');
        const userData = { 
          id: user.id, 
          username: user.name, 
          role: 'user' as const
        };
        
        console.log('👤 Dados do usuário a serem definidos:', userData);
        
        dispatch({ 
          type: 'SET_USER', 
          payload: userData
        });
        
        console.log('✅ Usuário definido no contexto com sucesso');
        
        // Mostrar aviso sobre Supabase apenas se não estiver configurado
        if (!isSupabaseConfigured()) {
          setTimeout(() => {
            console.log('⚠️ Sistema funcionando em modo local - dados não serão persistidos');
          }, 500);
        }
        
      } catch (error) {
        console.error('❌ Erro ao definir usuário:', error);
        alert('Erro ao acessar o sistema. Tente recarregar a página.');
      } finally {
        setIsConnecting(false);
      }
    }, 800);
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
          {connectionStatus === 'error' && (
            <div className="mb-12 p-8 bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-300 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-red-800">⚠️ Configuração Necessária</h3>
                  <p className="text-red-700 font-bold">{connectionDetails?.error || 'Problema na conexão'}</p>
                </div>
              </div>
              <div className="text-red-800 space-y-2 text-left max-w-2xl mx-auto">
                <p className="font-bold text-lg mb-4">Para usar o sistema, você precisa:</p>
                <ol className="list-decimal list-inside space-y-2 font-semibold">
                  <li>Acessar <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a> e criar uma conta</li>
                  <li>Criar um novo projeto no Supabase</li>
                  <li>Ir em Settings → API e copiar suas credenciais</li>
                  <li>Configurar o arquivo .env com suas credenciais reais</li>
                  <li>Reiniciar o servidor de desenvolvimento</li>
                </ol>
                <p className="text-red-700 font-bold mt-4 text-center">
                  ⚠️ Sem isso, NENHUM DADO será salvo no banco!
                </p>
                {connectionDetails?.tables && (
                  <div className="mt-6 p-4 bg-white/50 rounded-xl">
                    <h4 className="font-bold text-red-800 mb-2">Status das Tabelas:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(connectionDetails.tables).map(([table, status]) => (
                        <div key={table} className="flex justify-between">
                          <span className="text-red-700">{table}:</span>
                          <span className={status.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {connectionStatus === 'checking' && (
            <div className="mb-12 p-8 bg-gradient-to-r from-blue-100 to-indigo-200 border-2 border-blue-300 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-blue-800">🔍 Verificando Conexão</h3>
                  <p className="text-blue-700 font-bold">Testando conexão com o banco de dados...</p>
                </div>
              </div>
            </div>
          )}

          <div className="inline-flex items-center justify-center mb-12 relative">
            <div className="w-48 h-48 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-2xl revgold-hover-lift revgold-animate-floating relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
              <div className="w-32 h-32 flex items-center justify-center relative z-10">
                <img 
                  src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
                  alt="RevGold Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.warn('Logo principal não encontrada na tela de seleção, usando fallback');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.logo-fallback-main')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'logo-fallback-main w-full h-full bg-white/90 rounded-full flex items-center justify-center text-green-600 font-black text-6xl shadow-inner';
                      fallback.textContent = 'RG';
                      parent.appendChild(fallback);
                    }
                  }}
                  onLoad={() => console.log('Logo principal carregada com sucesso')}
                />
              </div>
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
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20 ${isConnecting ? 'pointer-events-none opacity-50' : ''}`}>
          {USERS.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className={`group cursor-pointer revgold-animate-scale-in revgold-stagger-${index + 1} revgold-hover-glow ${isConnecting ? 'cursor-not-allowed' : ''}`}
            >
              <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-green-300/30 p-10 transition-all duration-500 hover:bg-white/20 hover:border-green-400/60 hover:shadow-2xl hover:scale-105">
                {/* Card Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Loading Overlay */}
                {isConnecting && (
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 revgold-animate-floating">
                        {user.avatar === 'svg' ? (
                          <div className="w-16 h-16">
                            <UserAvatar />
                          </div>
                        ) : (
                          <span className="text-4xl filter drop-shadow-lg">{user.avatar}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-3xl font-black text-white group-hover:text-green-200 transition-colors duration-300 mb-2">
                        {user.name}
                      </h3>
                      {isConnecting && (
                        <p className="text-green-300 text-sm font-bold animate-pulse">
                          Conectando...
                        </p>
                      )}
                      <div className="flex items-center mt-4 space-x-2">
                        <Building2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400 font-bold uppercase tracking-wide">Sistema RevGold</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-400 rounded-full revgold-animate-pulse-glow shadow-lg"></div>
                    <div className={`w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 ${isConnecting ? 'animate-spin' : ''}`}>
                      {isConnecting ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ChevronRight className="w-10 h-10 text-white group-hover:translate-x-2 transition-transform duration-300" />
                      )}
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
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center shadow-xl revgold-animate-floating">
                  {connectionStatus === 'connected' ? (
                    <Zap className="w-10 h-10 text-white" />
                  ) : (
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">!</span>
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-3xl font-black text-white mb-3">
                    Sistema RevGold
                  </p>
                  <p className="text-base text-green-200 font-bold uppercase tracking-wider">
                    {connectionStatus === 'connected' ? 'Gestão Empresarial Profissional' : 'Configure o Supabase'}
                  </p>
                </div>
              </div>
              
              <p className="text-lg text-slate-300 italic mb-8 font-medium">
                "Colorindo seu ambiente e levando vida para os seus dias"
              </p>
              
              <div className="flex items-center justify-center space-x-4">
                <div className={`w-4 h-4 rounded-full shadow-lg ${
                  connectionStatus === 'connected' ? 'bg-green-400 revgold-animate-pulse-glow' : 'bg-red-400 animate-pulse'
                }`}></div>
                <span className={`text-base font-bold uppercase tracking-wide ${
                  connectionStatus === 'connected' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {connectionStatus === 'connected' ? 'Sistema Online' : connectionStatus === 'checking' ? 'Verificando...' : 'Configuração Necessária'}
                </span>
                <Sparkles className="w-5 h-5 text-green-400 revgold-animate-floating" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}