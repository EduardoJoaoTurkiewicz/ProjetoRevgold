import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle, Receipt, FileText, CreditCard, Eye, X } from 'lucide-react';

interface CalendarEvent {
  id: string;
  type: 'debt' | 'check' | 'boleto' | 'receivable';
  title: string;
  amount: number;
  description: string;
  status: string;
  details: any;
}

export function Agenda() {
  const { state } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDay(null);
  };

  // Obter dias do mês
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias do mês anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate.getDate(), isCurrentMonth: false, fullDate: prevDate });
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day);
      days.push({ date: day, isCurrentMonth: true, fullDate });
    }
    
    // Dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: day, isCurrentMonth: false, fullDate: nextDate });
    }
    
    return days;
  };

  // Obter eventos para um dia específico
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    const events: CalendarEvent[] = [];

    // Dívidas da empresa (que a empresa deve pagar)
    state.debts.forEach(debt => {
      debt.paymentMethods.forEach((method, index) => {
        if (method.installments && method.installments > 1) {
          for (let i = 0; i < method.installments; i++) {
            const dueDate = new Date(method.startDate || debt.date);
            dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
            
            if (dueDate.toISOString().split('T')[0] === dateStr) {
              events.push({
                id: `debt-${debt.id}-${index}-${i}`,
                type: 'debt',
                title: `${debt.company} - Parcela ${i + 1}/${method.installments}`,
                amount: method.installmentValue || 0,
                description: debt.description,
                status: debt.isPaid ? 'Pago' : 'Pendente',
                details: { ...debt, installment: i + 1, totalInstallments: method.installments }
              });
            }
          }
        } else if (debt.date === dateStr) {
          events.push({
            id: `debt-${debt.id}`,
            type: 'debt',
            title: debt.company,
            amount: debt.totalValue,
            description: debt.description,
            status: debt.isPaid ? 'Pago' : 'Pendente',
            details: debt
          });
        }
      });
    });

    // Cheques (que a empresa vai receber)
    state.checks.filter(check => check.dueDate === dateStr).forEach(check => {
      events.push({
        id: `check-${check.id}`,
        type: 'check',
        title: `Cheque - ${check.client}`,
        amount: check.value,
        description: check.usedFor || 'Cheque a receber',
        status: check.status === 'compensado' ? 'Compensado' : 
               check.status === 'pendente' ? 'Pendente' :
               check.status === 'devolvido' ? 'Devolvido' : 'Reapresentado',
        details: check
      });
    });

    // Boletos (que a empresa vai receber)
    state.boletos.filter(boleto => boleto.dueDate === dateStr).forEach(boleto => {
      events.push({
        id: `boleto-${boleto.id}`,
        type: 'boleto',
        title: `Boleto - ${boleto.client}`,
        amount: boleto.value,
        description: `Parcela ${boleto.installmentNumber}/${boleto.totalInstallments}`,
        status: boleto.status === 'compensado' ? 'Pago' :
               boleto.status === 'pendente' ? 'Pendente' :
               boleto.status === 'vencido' ? 'Vencido' : 'Cancelado',
        details: boleto
      });
    });

    // Vendas a receber (parcelas pendentes)
    state.sales.forEach(sale => {
      // Adicionar evento para data de entrega se existir
      if (sale.deliveryDate && sale.deliveryDate === dateStr) {
        events.push({
          id: `delivery-${sale.id}`,
          type: 'receivable',
          title: `Entrega - ${sale.client}`,
          amount: sale.totalValue,
          description: `Entrega programada - ${Array.isArray(sale.products) ? sale.products.map(p => p.name).join(', ') : sale.products}`,
          status: 'Entrega Programada',
          details: { ...sale, isDelivery: true }
        });
      }
      
      sale.paymentMethods.forEach((method, methodIndex) => {
        if (method.installments && method.installments > 1) {
          for (let i = 0; i < method.installments; i++) {
            const dueDate = new Date(method.firstInstallmentDate || method.startDate || sale.date);
            dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
            
            if (dueDate.toISOString().split('T')[0] === dateStr && i > 0) { // Primeira parcela já foi recebida
              events.push({
                id: `receivable-${sale.id}-${methodIndex}-${i}`,
                type: 'receivable',
                title: `${sale.client} - Parcela ${i + 1}/${method.installments}`,
                amount: method.installmentValue || 0,
                description: `Venda - ${Array.isArray(sale.products) ? sale.products.map(p => p.name).join(', ') : sale.products}`,
                status: 'A Receber',
                details: { ...sale, installment: i + 1, totalInstallments: method.installments }
              });
            }
          }
        }
      });
    });

    return events.sort((a, b) => b.amount - a.amount);
  };

  // Obter eventos do dia selecionado
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    return getEventsForDay(selectedDate);
  }, [selectedDay, currentDate, state]);

  const days = getDaysInMonth();
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'debt': return <CreditCard className="w-4 h-4" />;
      case 'check': return <Receipt className="w-4 h-4" />;
      case 'boleto': return <FileText className="w-4 h-4" />;
      case 'receivable': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string, status: string) => {
    if (status === 'Entrega Programada') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (type === 'debt') {
      return status === 'Pago' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
    }
    if (type === 'check') {
      return status === 'Compensado' ? 'bg-green-100 text-green-800 border-green-200' : 
             status === 'Devolvido' ? 'bg-red-100 text-red-800 border-red-200' :
             'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (type === 'boleto') {
      return status === 'Pago' ? 'bg-green-100 text-green-800 border-green-200' :
             status === 'Vencido' ? 'bg-red-100 text-red-800 border-red-200' :
             'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agenda Financeira</h1>
          <p className="text-slate-600 text-lg">Calendário completo de compromissos financeiros</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <div className="card modern-shadow-xl">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <ChevronLeft className="w-6 h-6 text-blue-600" />
              </button>
              
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-900 mb-1">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-blue-600 font-semibold">
                  {currentDate.toLocaleDateString('pt-BR', { year: 'numeric' })}
                </p>
              </div>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <ChevronRight className="w-6 h-6 text-blue-600" />
              </button>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-4 text-center font-bold text-slate-600 bg-slate-50 rounded-xl">
                  {day}
                </div>
              ))}
            </div>

            {/* Grade do Calendário */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const events = getEventsForDay(day.fullDate);
                const hasEvents = events.length > 0;
                const isCurrentDay = isToday(day.fullDate);
                const isSelected = selectedDay === day.date && day.isCurrentMonth;

                return (
                  <div
                    key={index}
                    onClick={() => day.isCurrentMonth ? setSelectedDay(day.date) : null}
                    className={`
                      relative p-3 min-h-[100px] rounded-xl border-2 transition-all duration-300 cursor-pointer
                      ${day.isCurrentMonth ? 'bg-white hover:bg-blue-50' : 'bg-slate-50 text-slate-400'}
                      ${isCurrentDay ? 'border-green-400 bg-green-50' : 'border-slate-200'}
                      ${isSelected ? 'border-blue-500 bg-blue-100 shadow-lg' : ''}
                      ${hasEvents ? 'hover:shadow-md' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-bold mb-2
                      ${isCurrentDay ? 'text-green-700' : day.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
                    `}>
                      {day.date}
                    </div>
                    
                    {hasEvents && (
                      <div className="space-y-1">
                        {events.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`
                              px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1
                              ${getEventColor(event.type, event.status)}
                            `}
                          >
                            {getEventIcon(event.type)}
                            <span className="truncate">
                              R$ {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-xs text-slate-500 font-bold text-center">
                            +{events.length - 2} mais
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

        {/* Detalhes do Dia Selecionado */}
        <div className="lg:col-span-1">
          <div className="card modern-shadow-xl sticky top-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedDay ? `Dia ${selectedDay}` : 'Selecione um dia'}
                </h3>
                <p className="text-slate-600">
                  {selectedDay ? 
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)
                      .toLocaleDateString('pt-BR', { weekday: 'long' }) 
                    : 'Clique em um dia para ver os eventos'
                  }
                </p>
              </div>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedDayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md cursor-pointer
                      ${getEventColor(event.type, event.status)}
                    `}
                    onClick={() => setViewingEvent(event)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <span className="font-bold text-sm">
                          {event.type === 'debt' ? 'A Pagar' :
                           event.type === 'check' ? 'Cheque' :
                           event.type === 'boleto' ? 'Boleto' : 'A Receber'}
                        </span>
                      </div>
                      <Eye className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold mb-1">{event.title}</h4>
                    <p className="text-sm mb-2">{event.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-black">
                        R$ {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50">
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 font-medium">
                  {selectedDay ? 'Nenhum evento neste dia' : 'Selecione um dia para ver os eventos'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Evento */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center
                    ${viewingEvent.type === 'debt' ? 'bg-red-600' :
                      viewingEvent.type === 'check' ? 'bg-yellow-600' :
                      viewingEvent.type === 'boleto' ? 'bg-blue-600' : 'bg-purple-600'}
                  `}>
                    {getEventIcon(viewingEvent.type)}
                    <span className="text-white ml-1">
                      {getEventIcon(viewingEvent.type)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{viewingEvent.title}</h2>
                    <p className="text-slate-600">{viewingEvent.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-2xl font-black text-green-600">
                    R$ {viewingEvent.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`
                    px-4 py-2 rounded-full text-sm font-bold border
                    ${getEventColor(viewingEvent.type, viewingEvent.status)}
                  `}>
                    {viewingEvent.status}
                  </span>
                </div>
              </div>

              {/* Detalhes específicos baseados no tipo */}
              <div className="space-y-6">
                {viewingEvent.type === 'debt' && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Detalhes da Dívida</h3>
                    <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                      <p><strong>Empresa:</strong> {viewingEvent.details.company}</p>
                      <p><strong>Descrição:</strong> {viewingEvent.details.description}</p>
                      <p><strong>Data:</strong> {new Date(viewingEvent.details.date).toLocaleDateString('pt-BR')}</p>
                      {viewingEvent.details.installment && (
                        <p><strong>Parcela:</strong> {viewingEvent.details.installment}/{viewingEvent.details.totalInstallments}</p>
                      )}
                    </div>
                  </div>
                )}

                {viewingEvent.type === 'check' && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Detalhes do Cheque</h3>
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                      <p><strong>Cliente:</strong> {viewingEvent.details.client}</p>
                      <p><strong>Vencimento:</strong> {new Date(viewingEvent.details.dueDate).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Tipo:</strong> {viewingEvent.details.isOwnCheck ? 'Cheque Próprio' : 'Cheque de Terceiros'}</p>
                      {viewingEvent.details.installmentNumber && (
                        <p><strong>Parcela:</strong> {viewingEvent.details.installmentNumber}/{viewingEvent.details.totalInstallments}</p>
                      )}
                      {viewingEvent.details.observations && (
                        <p><strong>Observações:</strong> {viewingEvent.details.observations}</p>
                      )}
                    </div>
                  </div>
                )}

                {viewingEvent.type === 'boleto' && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Detalhes do Boleto</h3>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <p><strong>Cliente:</strong> {viewingEvent.details.client}</p>
                      <p><strong>Vencimento:</strong> {new Date(viewingEvent.details.dueDate).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Parcela:</strong> {viewingEvent.details.installmentNumber}/{viewingEvent.details.totalInstallments}</p>
                      {viewingEvent.details.observations && (
                        <p><strong>Observações:</strong> {viewingEvent.details.observations}</p>
                      )}
                    </div>
                  </div>
                )}

                {viewingEvent.type === 'receivable' && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Detalhes do Recebimento</h3>
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                      {viewingEvent.details.isDelivery ? (
                        <>
                          <p><strong>Tipo:</strong> Entrega Programada</p>
                          <p><strong>Cliente:</strong> {viewingEvent.details.client}</p>
                          <p><strong>Data da Venda:</strong> {new Date(viewingEvent.details.date).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Data de Entrega:</strong> {new Date(viewingEvent.details.deliveryDate).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Valor Total da Venda:</strong> R$ {viewingEvent.details.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </>
                      ) : (
                        <>
                      <p><strong>Cliente:</strong> {viewingEvent.details.client}</p>
                      <p><strong>Data da Venda:</strong> {new Date(viewingEvent.details.date).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Parcela:</strong> {viewingEvent.details.installment}/{viewingEvent.details.totalInstallments}</p>
                      <p><strong>Valor Total da Venda:</strong> R$ {viewingEvent.details.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setViewingEvent(null)}
                  className="btn-secondary"
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