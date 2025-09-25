import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X,
  MapPin,
  User,
  Bell,
  FileText
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AgendaEvent } from '../types';
import { AgendaEventForm } from './forms/AgendaEventForm';

export default function Agenda() {
  const { 
    agendaEvents, 
    isLoading, 
    error, 
    createAgendaEvent, 
    updateAgendaEvent, 
    deleteAgendaEvent 
  } = useAppContext();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<AgendaEvent | null>(null);

  // Navegação do calendário
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    // Primeiro dia da semana (domingo = 0)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Último dia da semana
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Obter eventos de um dia específico
  const getEventsForDate = (date: string) => {
    return agendaEvents.filter(event => event.date === date);
  };

  // Verificar se um dia tem eventos
  const hasEvents = (date: string) => {
    return getEventsForDate(date).length > 0;
  };

  // Obter eventos do dia selecionado
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate).sort((a, b) => {
      // Ordenar por horário, depois por prioridade
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      
      const priorityOrder = { 'urgente': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [selectedDate, agendaEvents]);

  const handleAddEvent = (event: Omit<AgendaEvent, 'id' | 'createdAt'>) => {
    createAgendaEvent(event).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar evento: ' + error.message);
    });
  };

  const handleEditEvent = (event: Omit<AgendaEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateAgendaEvent({ ...event, id: editingEvent.id, createdAt: editingEvent.createdAt }).then(() => {
        setEditingEvent(null);
      }).catch(error => {
        alert('Erro ao atualizar evento: ' + error.message);
      });
    }
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      deleteAgendaEvent(id).catch(error => {
        alert('Erro ao excluir evento: ' + error.message);
      });
    }
  };

  const getPriorityColor = (priority: AgendaEvent['priority']) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-200';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: AgendaEvent['status']) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      case 'adiado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type: AgendaEvent['type']) => {
    switch (type) {
      case 'reuniao': return User;
      case 'pagamento': return FileText;
      case 'cobranca': return AlertTriangle;
      case 'entrega': return MapPin;
      default: return Calendar;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl floating-animation">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agenda</h1>
            <p className="text-slate-600 text-lg">Gerencie seus compromissos e eventos</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setEditingEvent(null);
          }}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Evento
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Erro no Sistema</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <div className="card modern-shadow-xl">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-600">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Hoje
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-3 text-center font-bold text-slate-600 bg-slate-50 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayEvents = getEventsForDate(dateStr);
                const isSelected = selectedDate === dateStr;
                const isTodayDate = isToday(day);
                const isCurrentMonthDate = isCurrentMonth(day);
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                      relative p-3 min-h-[80px] border rounded-lg cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-indigo-300 bg-indigo-50 shadow-md' 
                        : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                      }
                      ${isTodayDate ? 'ring-2 ring-indigo-400' : ''}
                      ${!isCurrentMonthDate ? 'opacity-40' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-bold mb-1
                      ${isTodayDate ? 'text-indigo-600' : 
                        isCurrentMonthDate ? 'text-slate-900' : 'text-slate-400'
                      }
                    `}>
                      {day.getDate()}
                    </div>
                    
                    {/* Indicadores de Eventos */}
                    {dayEvents.length > 0 && (
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                          <div
                            key={event.id}
                            className={`
                              text-xs px-2 py-1 rounded-full font-semibold truncate
                              ${event.priority === 'urgente' ? 'bg-red-500 text-white' :
                                event.priority === 'alta' ? 'bg-orange-500 text-white' :
                                event.priority === 'media' ? 'bg-yellow-500 text-white' :
                                'bg-green-500 text-white'
                              }
                            `}
                            title={event.title}
                          >
                            {event.time && `${event.time} - `}{event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-slate-500 font-semibold text-center">
                            +{dayEvents.length - 2} mais
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel de Eventos do Dia Selecionado */}
        <div className="lg:col-span-1">
          <div className="card modern-shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-purple-600">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedDate ? 'Eventos do Dia' : 'Selecione um Dia'}
                </h3>
                {selectedDate && (
                  <p className="text-slate-600">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                )}
              </div>
            </div>

            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
                  {selectedDateEvents.map(event => {
                    const TypeIcon = getTypeIcon(event.type);
                    
                    return (
                      <div key={event.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              event.priority === 'urgente' ? 'bg-red-600' :
                              event.priority === 'alta' ? 'bg-orange-600' :
                              event.priority === 'media' ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}>
                              <TypeIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{event.title}</h4>
                              {event.time && (
                                <p className="text-sm text-slate-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewingEvent(event)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingEvent(event)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id!)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-sm text-slate-700 mb-3">{event.description}</p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPriorityColor(event.priority)}`}>
                            {event.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                            {event.status.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Nenhum evento neste dia
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Clique no botão abaixo para adicionar um evento.
                  </p>
                  <button
                    onClick={() => {
                      setIsFormOpen(true);
                      setEditingEvent(null);
                    }}
                    className="btn-primary"
                  >
                    Adicionar Evento
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  Selecione um dia
                </h3>
                <p className="text-slate-500">
                  Clique em qualquer dia do calendário para ver os eventos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumo de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Total de Eventos</h3>
              <p className="text-3xl font-black text-blue-700">{agendaEvents.length}</p>
              <p className="text-sm text-blue-600 font-semibold">Este mês</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Concluídos</h3>
              <p className="text-3xl font-black text-green-700">
                {agendaEvents.filter(e => e.status === 'concluido').length}
              </p>
              <p className="text-sm text-green-600 font-semibold">Finalizados</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-600">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-yellow-900 text-lg">Pendentes</h3>
              <p className="text-3xl font-black text-yellow-700">
                {agendaEvents.filter(e => e.status === 'pendente').length}
              </p>
              <p className="text-sm text-yellow-600 font-semibold">Aguardando</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Urgentes</h3>
              <p className="text-3xl font-black text-red-700">
                {agendaEvents.filter(e => e.priority === 'urgente' && e.status === 'pendente').length}
              </p>
              <p className="text-sm text-red-600 font-semibold">Prioridade alta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {(isFormOpen || editingEvent) && (
        <AgendaEventForm
          event={editingEvent}
          defaultDate={selectedDate}
          onSubmit={editingEvent ? handleEditEvent : handleAddEvent}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* View Event Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 modern-shadow-xl">
                    {React.createElement(getTypeIcon(viewingEvent.type), { className: "w-8 h-8 text-white" })}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{viewingEvent.title}</h2>
                    <p className="text-slate-600">
                      {new Date(viewingEvent.date + 'T00:00:00').toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Data</label>
                    <p className="text-sm text-slate-900 font-semibold">
                      {new Date(viewingEvent.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {viewingEvent.time && (
                    <div>
                      <label className="form-label">Horário</label>
                      <p className="text-sm text-slate-900 font-semibold">{viewingEvent.time}</p>
                    </div>
                  )}
                  <div>
                    <label className="form-label">Tipo</label>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {viewingEvent.type.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="form-label">Prioridade</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(viewingEvent.priority)}`}>
                      {viewingEvent.priority.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingEvent.status)}`}>
                      {viewingEvent.status.toUpperCase()}
                    </span>
                  </div>
                  {viewingEvent.reminderDate && (
                    <div>
                      <label className="form-label">Lembrete</label>
                      <p className="text-sm text-slate-900 font-semibold">
                        {new Date(viewingEvent.reminderDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                {viewingEvent.description && (
                  <div>
                    <label className="form-label">Descrição</label>
                    <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                      {viewingEvent.description}
                    </p>
                  </div>
                )}

                {/* Observações */}
                {viewingEvent.observations && (
                  <div>
                    <label className="form-label">Observações</label>
                    <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                      {viewingEvent.observations}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => {
                    setViewingEvent(null);
                    setEditingEvent(viewingEvent);
                  }}
                  className="btn-secondary"
                >
                  Editar
                </button>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="btn-primary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}