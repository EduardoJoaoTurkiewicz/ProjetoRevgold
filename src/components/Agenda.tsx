import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';

export function Agenda() {
  const { state } = useApp();
  
  // Verificar se é Eduardo Junior para mostrar integração com Google Calendar
  const isEduardoJunior = state.user?.username === 'Eduardo Junior';

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-600 text-lg">Gerenciamento de compromissos e eventos</p>
        </div>
      </div>

      {isEduardoJunior ? (
        <div className="card modern-shadow-xl">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Integração com Google Calendar</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Como Eduardo Junior, você tem acesso à integração com Google Calendar para gerenciar seus compromissos.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-lg mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-blue-900">Funcionalidade em Desenvolvimento</h3>
              </div>
              <p className="text-blue-700 text-sm">
                A integração com Google Calendar será implementada em breve para sincronizar seus eventos e compromissos.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card modern-shadow-xl">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Agenda Básica</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              A funcionalidade de agenda básica será implementada em breve para todos os usuários.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-lg mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-slate-600" />
                <h3 className="font-bold text-slate-900">Funcionalidades Planejadas</h3>
              </div>
              <ul className="text-slate-700 text-sm text-left space-y-2">
                <li>• Criação de eventos e compromissos</li>
                <li>• Lembretes automáticos</li>
                <li>• Visualização por dia, semana e mês</li>
                <li>• Integração com vendas e pagamentos</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}