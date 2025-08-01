import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, ExternalLink, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Agenda() {
  const { state } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  const [showGoogleIntegration, setShowGoogleIntegration] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const selectedDateStr = formatDate(selectedDate);

  // Get items for selected date
  const checksForDate = state.checks.filter(check => check.dueDate === selectedDateStr);
  const installmentsForDate = state.installments.filter(installment => 
    installment.dueDate === selectedDateStr
  );

  // Get overdue items
  const overdueChecks = state.checks.filter(check => 
    check.dueDate < selectedDateStr && check.status === 'pendente'
  );
  const overdueInstallments = state.installments.filter(installment => 
    installment.dueDate < selectedDateStr && !installment.isPaid
  );

  // Get upcoming items (next 7 days)
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + i + 1);
    return formatDate(date);
  });

  const upcomingChecks = state.checks.filter(check => 
    upcomingDates.includes(check.dueDate) && check.status === 'pendente'
  );
  const upcomingInstallments = state.installments.filter(installment => 
    upcomingDates.includes(installment.dueDate) && !installment.isPaid
  );

  // Get employees with payment due today
  const today = new Date();
  const employeesPaymentDueToday = state.employees.filter(employee => {
    if (!employee.isActive) return false;
    const paymentDay = employee.paymentDay;
    return today.getDate() === paymentDay;
  });

  // Get today's employee payments
  const todayEmployeePayments = state.employeePayments?.filter(payment => 
    payment.paymentDate === selectedDateStr
  ) || [];

  // Generate calendar data for month view
  const generateCalendarData = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendarData = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = formatDate(currentDate);
      const isToday = dateStr === formatDate(new Date());
      const isCurrentMonth = currentDate.getMonth() === month;
      
      // Get items for this date
      const dayChecks = state.checks.filter(check => check.dueDate === dateStr);
      const dayInstallments = state.installments.filter(inst => inst.dueDate === dateStr);
      const dayDebts = state.debts.filter(debt => debt.date === dateStr);
      const dayEmployeePayments = state.employees.filter(emp => 
        emp.isActive && emp.paymentDay === currentDate.getDate() && isCurrentMonth
      );
      
      calendarData.push({
        day: currentDate.getDate(),
        dateStr,
        isToday,
        isCurrentMonth,
        checks: dayChecks,
        installments: dayInstallments,
        debts: dayDebts,
        employeePayments: dayEmployeePayments
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendarData;
  };

  const calendarData = generateCalendarData();

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const syncWithGoogleCalendar = () => {
    // Simulate Google Calendar integration
    alert('Funcionalidade de integração com Google Calendar será implementada em breve!');
  };

  const isEduardoJunior = state.user?.username === 'Eduardo Junior';

  const ItemCard = ({ 
    title, 
    value, 
    type, 
    status, 
    dueDate, 
    description 
  }: {
    title: string;
    value: number;
    type: 'check' | 'installment';
    status?: string;
    dueDate: string;
    description?: string;
  }) => (
    <div className="p-3 bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <span className="font-bold text-blue-600">
          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      {description && (
        <p className="text-sm text-gray-600 mb-2">{description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded-full ${
          type === 'check' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {type === 'check' ? 'Cheque' : 'Parcela'}
        </span>
        {status && (
          <span className={`px-2 py-1 rounded-full ${
            status === 'compensado' || status === 'paid' ? 'bg-green-100 text-green-700' :
            status === 'devolvido' ? 'bg-red-100 text-red-700' :
            status === 'reapresentado' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
          {status === 'compensado' ? 'Compensado' :
           status === 'devolvido' ? 'Devolvido' :
           status === 'reapresentado' ? 'Reapresentado' :
           status === 'paid' ? 'Pago' : 'Pendente'}
        </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Agenda Financeira</h1>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Mês
            </button>
          </div>
          {isEduardoJunior && (
            <button 
              onClick={syncWithGoogleCalendar}
              className="btn-secondary flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Sincronizar Google
            </button>
          )}
          <button onClick={goToToday} className="btn-secondary">
            Hoje
          </button>
        </div>
      </div>

      {isEduardoJunior && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Integração Google Calendar</h3>
              <p className="text-sm text-blue-700">
                Sincronize automaticamente todos os vencimentos com sua agenda do Google
              </p>
            </div>
            <button 
              onClick={syncWithGoogleCalendar}
              className="btn-primary text-sm"
            >
              Configurar
            </button>
          </div>
        </div>
      )}

      {viewMode === 'month' ? (
        /* Monthly Calendar View */
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold">
              {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50 rounded">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((dayData, index) => (
              <div
                key={index}
                className={`min-h-[140px] p-2 border rounded-xl transition-all duration-300 cursor-pointer hover-lift ${
            <div className="tab-selector">
                  dayData.isToday ? 'bg-gradient-to-br from-emerald-500 to-red-500 text-white border-emerald-300 shadow-2xl' :
                  (dayData.checks.length + dayData.installments.length + dayData.debts.length + dayData.employeePayments.length) > 0 
                className={`tab-option ${viewMode === 'day' ? 'active' : ''}`}
                onClick={() => dayData && setSelectedDate(new Date(dayData.dateStr))}
              >
                <div className={`text-sm font-bold mb-2 ${
                  dayData.isToday ? 'text-white' : 
                  !dayData.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                }`}>
                className={`tab-option ${viewMode === 'month' ? 'active' : ''}`}
                <div className="space-y-1">
                  {/* Debts */}
                  {dayData.debts.slice(0, 1).map(debt => (
                    <div key={`debt-${debt.id}`} className="text-xs p-1.5 bg-red-500 text-white rounded-lg shadow-sm font-medium truncate" title={`${debt.description} - ${debt.company}`}>
                      💳 {debt.company.substring(0, 8)}...
                      <div className="text-xs opacity-90">R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                  
                  {/* Checks */}
                  {dayData.checks.slice(0, 1).map(check => (
                    <div key={`check-${check.id}`} className="text-xs p-1.5 bg-purple-500 text-white rounded-lg shadow-sm font-medium truncate" title={`Cheque - ${check.client}`}>
                      📄 {check.client.substring(0, 8)}...
                      <div className="text-xs opacity-90">R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                  
                  {/* Installments */}
                  {dayData.installments.slice(0, 1).map(installment => (
                    <div key={`inst-${installment.id}`} className="text-xs p-1.5 bg-blue-500 text-white rounded-lg shadow-sm font-medium truncate" title={installment.description}>
                      📊 Parcela
                      <div className="text-xs opacity-90">R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                  
                  {/* Employee Payments */}
                  {dayData.employeePayments.slice(0, 1).map(employee => (
                    <div key={`emp-${employee.id}`} className="text-xs p-1.5 bg-orange-500 text-white rounded-lg shadow-sm font-medium truncate" title={`Pagamento: ${employee.name} - ${employee.position}`}>
                      👤 {employee.name.substring(0, 8)}...
                      <div className="text-xs opacity-90">R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                  
                  {/* Show count if there are more items */}
                  {(dayData.checks.length + dayData.installments.length + dayData.employeePayments.length + dayData.debts.length) > 2 && (
                    <div className="text-xs text-gray-600 font-bold bg-gray-200 rounded px-1 py-0.5">
                      +{(dayData.checks.length + dayData.installments.length + dayData.employeePayments.length + dayData.debts.length) - 2} mais
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded-lg shadow-sm"></div>
              <span className="font-medium">Dívidas a Pagar</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-purple-500 rounded-lg shadow-sm"></div>
              <span className="font-medium">Cheques Vencendo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded-lg shadow-sm"></div>
              <span className="font-medium">Parcelas a Receber</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-500 rounded-lg shadow-sm"></div>
              <span className="font-medium">Pagamento de Funcionários</span>
            </div>
          </div>
        </div>
      ) : (
        /* Daily View */
        <>
      {/* Date Navigator */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">
              {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
          </div>
          
          <button onClick={() => navigateDate('next')} className="p-2 hover:bg-gray-100 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Vencidos</h3>
              <p className="text-red-700">
                {overdueChecks.length + overdueInstallments.length} item(s)
              </p>
              <p className="text-sm text-red-600">
                Total: R$ {(
                  overdueChecks.reduce((sum, check) => sum + check.value, 0) +
                  overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0)
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Hoje</h3>
              <p className="text-blue-700">
                {checksForDate.length + installmentsForDate.length + employeesPaymentDueToday.length} item(s)
              </p>
              <p className="text-sm text-blue-600">
                Total: R$ {(
                  checksForDate.reduce((sum, check) => sum + check.value, 0) +
                  installmentsForDate.reduce((sum, inst) => sum + inst.amount, 0) +
                  employeesPaymentDueToday.reduce((sum, emp) => sum + emp.salary, 0)
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">Próximos 7 dias</h3>
              <p className="text-green-700">
                {upcomingChecks.length + upcomingInstallments.length} item(s)
              </p>
              <p className="text-sm text-green-600">
                Total: R$ {(
                  upcomingChecks.reduce((sum, check) => sum + check.value, 0) +
                  upcomingInstallments.reduce((sum, inst) => sum + inst.amount, 0)
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Items */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Vencimentos de Hoje
          </h3>
          
          <div className="space-y-3">
            {checksForDate.map(check => (
              <ItemCard
                key={`check-${check.id}`}
                title={check.client}
                value={check.value}
                type="check"
                status={check.status}
                dueDate={check.dueDate}
                description={check.usedFor}
              />
            ))}
            
            {installmentsForDate.map(installment => (
              <ItemCard
                key={`installment-${installment.id}`}
                title={installment.description}
                value={installment.amount}
                type="installment"
                status={installment.isPaid ? 'paid' : 'pending'}
                dueDate={installment.dueDate}
              />
            ))}
            
            {employeesPaymentDueToday.map(employee => (
              <div key={`employee-${employee.id}`} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Users className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-900">{employee.name}</h4>
                      <p className="text-sm text-orange-700">{employee.position}</p>
                      <p className="text-xs text-orange-600">Pagamento do funcionário</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-900">
                      R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                      Funcionário
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {checksForDate.length === 0 && installmentsForDate.length === 0 && employeesPaymentDueToday.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Nenhum vencimento para hoje!</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Items */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Itens Vencidos
          </h3>
          
          <div className="space-y-3">
            {overdueChecks.map(check => (
              <ItemCard
                key={`overdue-check-${check.id}`}
                title={`${check.client} (${new Date(check.dueDate).toLocaleDateString('pt-BR')})`}
                value={check.value}
                type="check"
                status={check.status}
                dueDate={check.dueDate}
                description={check.usedFor}
              />
            ))}
            
            {overdueInstallments.map(installment => (
              <ItemCard
                key={`overdue-installment-${installment.id}`}
                title={`${installment.description} (${new Date(installment.dueDate).toLocaleDateString('pt-BR')})`}
                value={installment.amount}
                type="installment"
                status={installment.isPaid ? 'paid' : 'pending'}
                dueDate={installment.dueDate}
              />
            ))}
            
            {overdueChecks.length === 0 && overdueInstallments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Nenhum item vencido!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Employee Payments */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Pagamentos de Funcionários
          </h3>
          
          <div className="space-y-3">
            {todayEmployeePayments.map(payment => {
              const employee = state.employees.find(e => e.id === payment.employeeId);
              return (
                <div key={payment.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-green-900">{employee?.name || 'Funcionário'}</h4>
                      <p className="text-sm text-green-700">{employee?.position || 'N/A'}</p>
                      <p className="text-xs text-green-600">
                        {payment.isPaid ? '✓ Pago' : 'Pendente'}
                      </p>
                      {payment.observations && (
                        <p className="text-xs text-green-600 mt-1">{payment.observations}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-900">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {employeesPaymentDueToday.map(employee => {
              const hasPayment = todayEmployeePayments.some(p => p.employeeId === employee.id);
              if (hasPayment) return null;
              
              return (
                <div key={`due-${employee.id}`} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-orange-900">{employee.name}</h4>
                      <p className="text-sm text-orange-700">{employee.position}</p>
                      <p className="text-xs text-orange-600">Pagamento devido hoje</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-900">
                        R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                        Devido
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {todayEmployeePayments.length === 0 && employeesPaymentDueToday.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum pagamento de funcionário hoje.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Items */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Próximos Vencimentos (7 dias)
        </h3>
        
        {(upcomingChecks.length > 0 || upcomingInstallments.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingChecks.map(check => (
              <ItemCard
                key={`upcoming-check-${check.id}`}
                title={`${check.client} (${new Date(check.dueDate).toLocaleDateString('pt-BR')})`}
                value={check.value}
                type="check"
                status={check.status}
                dueDate={check.dueDate}
                description={check.usedFor}
              />
            ))}
            
            {upcomingInstallments.map(installment => (
              <ItemCard
                key={`upcoming-installment-${installment.id}`}
                title={`${installment.description} (${new Date(installment.dueDate).toLocaleDateString('pt-BR')})`}
                value={installment.amount}
                type="installment"
                status={installment.isPaid ? 'paid' : 'pending'}
                dueDate={installment.dueDate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>Nenhum vencimento nos próximos 7 dias!</p>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}