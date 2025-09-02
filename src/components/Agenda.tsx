import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit2, Trash2, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AgendaEventForm } from './forms/AgendaEventForm';

interface AgendaEvent {
  id?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: 'evento' | 'reuniao' | 'pagamento' | 'cobranca' | 'entrega' | 'outros';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'concluido' | 'cancelado' | 'adiado';
  reminderDate?: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function Agenda() {
  const { 
    agendaEvents, 
    sales, 
    debts, 
    checks, 
    boletos, 
    employeePayments,
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    loading 
  } = useAppContext();
  
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleEventSubmit = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEvent) {
        await updateAgendaEvent({
          ...eventData,
          id: editingEvent.id!,
          createdAt: editingEvent.createdAt,
          updatedAt: editingEvent.updatedAt
        } as AgendaEvent);
      } else {
        await createAgendaEvent(eventData);
      }

      setShowForm(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erro ao salvar evento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      await deleteAgendaEvent(id);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Erro ao excluir evento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleStatusChange = async (id: string, status: AgendaEvent['status']) => {
    try {
      const event = agendaEvents.find(e => e.id === id);
      if (event) {
        await updateAgendaEvent({ ...event, status } as AgendaEvent);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be last (6)
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

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

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Get events for a specific date
  const getEventsForDate = (dateStr: string) => {
    const events = agendaEvents.filter(event => event.date === dateStr);
    
    // Add automatic events from other modules
    const automaticEvents = [];
    
    // Sales deliveries
    sales.forEach(sale => {
      if (sale.deliveryDate === dateStr) {
        automaticEvents.push({
          id: `sale-delivery-${sale.id}`,
          title: `Entrega - ${sale.client}`,
          description: `Entrega da venda para ${sale.client}`,
          date: dateStr,
          type: 'entrega' as const,
          priority: 'media' as const,
          status: 'pendente' as const,
          isAutomatic: true,
          relatedId: sale.id,
          relatedType: 'sale'
        });
      }
    });
    
    // Check due dates
    checks.forEach(check => {
      if (check.dueDate === dateStr && check.status === 'pendente') {
        automaticEvents.push({
          id: `check-due-${check.id}`,
          title: `Vencimento Cheque - ${check.client}`,
          description: `Cheque de ${check.client} vence hoje - R$ ${check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          date: dateStr,
          type: 'cobranca' as const,
          priority: 'alta' as const,
          status: 'pendente' as const,
          isAutomatic: true,
          relatedId: check.id,
          relatedType: 'check'
        });
      }
    });
    
    // Boleto due dates
    boletos.forEach(boleto => {
      if (boleto.dueDate === dateStr && boleto.status === 'pendente') {
        automaticEvents.push({
          id: `boleto-due-${boleto.id}`,
          title: `Vencimento Boleto - ${boleto.client}`,
          description: `Boleto de ${boleto.client} vence hoje - R$ ${boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          date: dateStr,
          type: 'cobranca' as const,
          priority: 'alta' as const,
          status: 'pendente' as const,
          isAutomatic: true,
          relatedId: boleto.id,
          relatedType: 'boleto'
        });
      }
    });
    
    // Employee payments
    employeePayments.forEach(payment => {
      if (payment.paymentDate === dateStr) {
        automaticEvents.push({
          id: `payment-${payment.id}`,
          title: `Pagamento de Funcionário`,
          description: `Pagamento realizado - R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          date: dateStr,
          type: 'pagamento' as const,
          priority: 'media' as const,
          status: 'concluido' as const,
          isAutomatic: true,
          relatedId: payment.id,
          relatedType: 'payment'
        });
      }
    });
    
    return [...events, ...automaticEvents].sort((a, b) => {
      // Sort by time if available, otherwise by priority
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      const priorityOrder = { 'urgente': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'text-red-600 bg-red-50 border-red-200';
      case 'alta': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'media': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'baixa': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelado': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'adiado': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'evento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reuniao': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pagamento': return 'bg-green-100 text-green-800 border-green-200';
      case 'cobranca': return 'bg-red-100 text-red-800 border-red-200';
      case 'entrega': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateKey(date);
      const dayEvents = getEventsForDate(dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate;
      
      days.push({
        day,
        date: dateStr,
        events: dayEvents,
        isToday,
        isSelected
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayData, index) => (
                  <div key={index} className="min-h-[100px] border border-gray-100 rounded-lg">
                    {dayData ? (
                      <div
                        className={`
                          h-full p-2 cursor-pointer transition-all duration-200 rounded-lg
                          ${dayData.isToday ? 'bg-blue-50 border-2 border-blue-300' : ''}
                          ${dayData.isSelected ? 'bg-green-50 border-2 border-green-300' : ''}
                          ${!dayData.isToday && !dayData.isSelected ? 'hover:bg-gray-50' : ''}
                        `}
                        onClick={() => setSelectedDate(dayData.date)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`
                            text-sm font-medium
                            ${dayData.isToday ? 'text-blue-700 font-bold' : 'text-gray-700'}
                          `}>
                            {dayData.day}
                          </span>
                          {dayData.events.length > 0 && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        
                        {/* Event indicators */}
                        <div className="space-y-1">
                          {dayData.events.slice(0, 3).map((event, eventIndex) => (
                            <div
                              key={event.id || eventIndex}
                              className={`
                                text-xs px-2 py-1 rounded-md truncate border
                                ${getPriorityColor(event.priority)}
                                ${event.isAutomatic ? 'opacity-75 italic' : ''}
                              `}
                              title={event.title}
                            >
                              {event.time && <span className="mr-1">{event.time}</span>}
                              {event.title}
                            </div>
                          ))}
                          {dayData.events.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayData.events.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Events for selected date */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              {selectedDate ? (
                <>Eventos de {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</>
              ) : (
                'Selecione uma data'
              )}
            </h3>
          </div>

          <div className="p-6">
            {selectedDate ? (
              <div className="space-y-4">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className={`
                      p-4 rounded-lg border transition-all duration-200 hover:shadow-md
                      ${event.isAutomatic ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(event.status)}
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        {!event.isAutomatic && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>
                        )}
                      </div>
                      
                      {!event.isAutomatic && (
                        <div className="flex items-center space-x-1">
                          {event.status === 'pendente' && (
                            <button
                              onClick={() => handleStatusChange(event.id!, 'concluido')}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Marcar como concluído"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingEvent(event as AgendaEvent);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id!)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {event.time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{event.time}</span>
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full border ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                      <span className="capitalize">{event.status}</span>
                      {event.isAutomatic && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                          Automático
                        </span>
                      )}
                    </div>

                    {event.observations && (
                      <p className="text-sm text-gray-500 mt-2 italic">{event.observations}</p>
                    )}
                  </div>
                ))}
                
                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum evento nesta data</p>
                    <button
                      onClick={() => {
                        setShowForm(true);
                        // Pre-fill the form with selected date
                      }}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Adicionar Evento
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Clique em uma data no calendário para ver os eventos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Legenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600">Hoje</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Data Selecionada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Tem Eventos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded opacity-75"></div>
            <span className="text-sm text-gray-600">Eventos Automáticos</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Tipos de Eventos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { type: 'evento', label: 'Evento' },
              { type: 'reuniao', label: 'Reunião' },
              { type: 'pagamento', label: 'Pagamento' },
              { type: 'cobranca', label: 'Cobrança' },
              { type: 'entrega', label: 'Entrega' },
              { type: 'outros', label: 'Outros' }
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs border ${getTypeColor(type)}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <AgendaEventForm
          event={editingEvent}
          onSubmit={handleEventSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
          defaultDate={selectedDate}
        />
      )}
    </div>
  );
}