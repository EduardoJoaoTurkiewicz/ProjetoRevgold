import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Eye, Users, DollarSign, Calendar, AlertCircle, X, Star, Clock, TrendingUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Employee } from '../types';
import { EmployeeForm } from './forms/EmployeeForm';
import { EmployeeAdvanceForm } from './forms/EmployeeAdvanceForm';
import { EmployeeOvertimeForm } from './forms/EmployeeOvertimeForm';
import { formatDateForDisplay, getCurrentDateString } from '../utils/dateUtils';
import { safeCurrency } from '../utils/numberUtils';

export function Employees() {
  const { 
    employees, 
    employeeCommissions, 
    employeePayments, 
    employeeAdvances, 
    employeeOvertimes,
    isLoading, 
    error, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee,
    createEmployeeAdvance,
    createEmployeeOvertime,
    createEmployeePayment
  } = useAppContext();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [advanceEmployee, setAdvanceEmployee] = useState<Employee | null>(null);
  const [overtimeEmployee, setOvertimeEmployee] = useState<Employee | null>(null);

  const activeEmployees = employees.filter(emp => emp.isActive);
  const sellers = employees.filter(emp => emp.isActive && emp.isSeller);

  const handleAddEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    createEmployee(employee).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar funcionário: ' + error.message);
    });
  };

  const handleEditEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    if (editingEmployee) {
      updateEmployee({ ...employee, id: editingEmployee.id, createdAt: editingEmployee.createdAt }).then(() => {
        setEditingEmployee(null);
      }).catch(error => {
        alert('Erro ao atualizar funcionário: ' + error.message);
      });
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.')) {
      deleteEmployee(id).catch(error => {
        alert('Erro ao excluir funcionário: ' + error.message);
      });
    }
  };

  const handleAdvanceSubmit = (advanceData: any) => {
    createEmployeeAdvance(advanceData).then(() => {
      setAdvanceEmployee(null);
    }).catch(error => {
      alert('Erro ao criar adiantamento: ' + error.message);
    });
  };

  const handleOvertimeSubmit = (overtimeData: any) => {
    createEmployeeOvertime(overtimeData).then(() => {
      setOvertimeEmployee(null);
    }).catch(error => {
      alert('Erro ao criar hora extra: ' + error.message);
    });
  };

  const handlePaySalary = (employee: Employee) => {
    const confirmMessage = `Pagar salário de ${employee.name}?\n\nValor: ${safeCurrency(employee.salary)}\n\nEste valor será descontado do caixa da empresa.`;
    
    if (window.confirm(confirmMessage)) {
      const paymentData = {
        employeeId: employee.id,
        amount: employee.salary,
        paymentDate: getCurrentDateString(),
        isPaid: true,
        observations: `Pagamento de salário - ${new Date().toLocaleDateString('pt-BR')}`
      };
      
      createEmployeePayment(paymentData).catch(error => {
        alert('Erro ao registrar pagamento: ' + error.message);
      });
    }
  };

  const getEmployeeCommissions = (employeeId: string) => {
    return employeeCommissions.filter(c => c.employeeId === employeeId);
  };

  const getEmployeePayments = (employeeId: string) => {
    return employeePayments.filter(p => p.employeeId === employeeId);
  };

  const getEmployeeAdvances = (employeeId: string) => {
    return employeeAdvances.filter(a => a.employeeId === employeeId);
  };

  const getEmployeeOvertimes = (employeeId: string) => {
    return employeeOvertimes.filter(o => o.employeeId === employeeId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 shadow-xl floating-animation">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Funcionários</h1>
            <p className="text-slate-600 text-lg">Controle completo de funcionários, salários e comissões</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Funcionário
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Erro no Sistema</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600 modern-shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-lg">Funcionários Ativos</h3>
              <p className="text-3xl font-black text-purple-700">{activeEmployees.length}</p>
              <p className="text-sm text-purple-600 font-semibold">
                {sellers.length} vendedor(es)
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Folha Mensal</h3>
              <p className="text-3xl font-black text-green-700">
                {safeCurrency(activeEmployees.reduce((sum, emp) => sum + emp.salary, 0))}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                Salários base
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-600 modern-shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-yellow-900 text-lg">Comissões Pendentes</h3>
              <p className="text-3xl font-black text-yellow-700">
                {safeCurrency(employeeCommissions.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.commissionAmount, 0))}
              </p>
              <p className="text-sm text-yellow-600 font-semibold">
                {employeeCommissions.filter(c => c.status === 'pendente').length} comissão(ões)
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Horas Extras</h3>
              <p className="text-3xl font-black text-blue-700">
                {safeCurrency(employeeOvertimes.filter(o => o.status === 'pendente').reduce((sum, o) => sum + o.totalAmount, 0))}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                {employeeOvertimes.filter(o => o.status === 'pendente').length} pendente(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="space-y-6">
        {activeEmployees.length > 0 ? (
          activeEmployees.map((employee) => {
            const commissions = getEmployeeCommissions(employee.id);
            const payments = getEmployeePayments(employee.id);
            const advances = getEmployeeAdvances(employee.id);
            const overtimes = getEmployeeOvertimes(employee.id);
            
            const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
            const pendingCommissions = commissions.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.commissionAmount, 0);
            const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
            const totalOvertimes = overtimes.reduce((sum, o) => sum + o.totalAmount, 0);
            
            return (
              <div key={employee.id} className="card modern-shadow-xl">
                {/* Employee Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-600">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{employee.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Contratado em {formatDateForDisplay(employee.hireDate)}
                        </span>
                        {employee.isSeller && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                            VENDEDOR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-black text-purple-600">
                      {safeCurrency(employee.salary)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Cargo: {employee.position}
                    </p>
                  </div>
                </div>

                {/* Employee Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Salário Mensal</h4>
                    <p className="text-2xl font-black text-purple-700">{safeCurrency(employee.salary)}</p>
                    <p className="text-sm text-purple-600">Pago dia {employee.paymentDay}</p>
                  </div>
                  
                  {employee.isSeller && (
                    <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <h4 className="font-bold text-yellow-900 mb-2">Comissões</h4>
                      <p className="text-2xl font-black text-yellow-700">{safeCurrency(totalCommissions)}</p>
                      <p className="text-sm text-yellow-600">
                        Pendente: {safeCurrency(pendingCommissions)}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2">Adiantamentos</h4>
                    <p className="text-2xl font-black text-orange-700">{safeCurrency(totalAdvances)}</p>
                    <p className="text-sm text-orange-600">{advances.length} adiantamento(s)</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">Horas Extras</h4>
                    <p className="text-2xl font-black text-blue-700">{safeCurrency(totalOvertimes)}</p>
                    <p className="text-sm text-blue-600">{overtimes.length} registro(s)</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={() => handlePaySalary(employee)}
                    className="btn-success flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Pagar Salário
                  </button>
                  
                  <button
                    onClick={() => setAdvanceEmployee(employee)}
                    className="btn-warning flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Adiantamento
                  </button>
                  
                  <button
                    onClick={() => setOvertimeEmployee(employee)}
                    className="btn-info flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Hora Extra
                  </button>
                </div>

                {/* Recent Activity */}
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="font-bold text-slate-900 mb-4">Atividade Recente</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Payments */}
                    <div>
                      <h5 className="font-semibold text-slate-800 mb-3">Últimos Pagamentos</h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {payments.slice(0, 3).map(payment => (
                          <div key={payment.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-700">
                                {formatDateForDisplay(payment.paymentDate)}
                              </span>
                              <span className="font-bold text-green-800">{safeCurrency(payment.amount)}</span>
                            </div>
                          </div>
                        ))}
                        {payments.length === 0 && (
                          <p className="text-sm text-slate-500 italic">Nenhum pagamento registrado</p>
                        )}
                      </div>
                    </div>

                    {/* Recent Commissions */}
                    {employee.isSeller && (
                      <div>
                        <h5 className="font-semibold text-slate-800 mb-3">Últimas Comissões</h5>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {commissions.slice(0, 3).map(commission => (
                            <div key={commission.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-yellow-700">
                                  {formatDateForDisplay(commission.date)} - {commission.commissionRate}%
                                </span>
                                <span className="font-bold text-yellow-800">{safeCurrency(commission.commissionAmount)}</span>
                              </div>
                            </div>
                          ))}
                          {commissions.length === 0 && (
                            <p className="text-sm text-slate-500 italic">Nenhuma comissão registrada</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setViewingEmployee(employee)}
                    className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition-modern"
                    title="Visualizar Detalhes Completos"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingEmployee(employee)}
                    className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <Users className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhum funcionário registrado</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando seu primeiro funcionário para gerenciar a equipe.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeiro funcionário
            </button>
          </div>
        )}
      </div>

      {/* Employee Form Modal */}
      {(isFormOpen || editingEmployee) && (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {/* Advance Form Modal */}
      {advanceEmployee && (
        <EmployeeAdvanceForm
          employeeId={advanceEmployee.id}
          employeeName={advanceEmployee.name}
          onSubmit={handleAdvanceSubmit}
          onCancel={() => setAdvanceEmployee(null)}
        />
      )}

      {/* Overtime Form Modal */}
      {overtimeEmployee && (
        <EmployeeOvertimeForm
          employeeId={overtimeEmployee.id}
          employeeName={overtimeEmployee.name}
          onSubmit={handleOvertimeSubmit}
          onCancel={() => setOvertimeEmployee(null)}
        />
      )}

      {/* View Employee Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 modern-shadow-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Detalhes Completos do Funcionário</h2>
                    <p className="text-slate-600">{viewingEmployee.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingEmployee(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nome:</strong> {viewingEmployee.name}</p>
                      <p><strong>Cargo:</strong> {viewingEmployee.position}</p>
                      <p><strong>Contratação:</strong> {formatDateForDisplay(viewingEmployee.hireDate)}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold border ${
                          viewingEmployee.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {viewingEmployee.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </p>
                      {viewingEmployee.isSeller && (
                        <p><strong>Vendedor:</strong> 
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            SIM
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Informações Financeiras</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Salário:</strong> {safeCurrency(viewingEmployee.salary)}</p>
                      <p><strong>Dia de Pagamento:</strong> {viewingEmployee.paymentDay}</p>
                      {viewingEmployee.nextPaymentDate && (
                        <p><strong>Próximo Pagamento:</strong> {formatDateForDisplay(viewingEmployee.nextPaymentDate)}</p>
                      )}
                      <p><strong>Total Comissões:</strong> <span className="text-yellow-600 font-bold">{safeCurrency(totalCommissions)}</span></p>
                      <p><strong>Comissões Pendentes:</strong> <span className="text-orange-600 font-bold">{safeCurrency(pendingCommissions)}</span></p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Resumo de Atividades</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Pagamentos:</strong> {payments.length}</p>
                      <p><strong>Adiantamentos:</strong> {advances.length} - {safeCurrency(totalAdvances)}</p>
                      <p><strong>Horas Extras:</strong> {overtimes.length} - {safeCurrency(totalOvertimes)}</p>
                      <p><strong>ID:</strong> <span className="font-mono text-xs">{viewingEmployee.id}</span></p>
                    </div>
                  </div>
                </div>

                {/* Detailed History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Payment History */}
                  <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-4">Histórico de Pagamentos</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {payments.map(payment => (
                        <div key={payment.id} className="p-3 bg-white rounded-lg border border-green-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-green-900">{formatDateForDisplay(payment.paymentDate)}</p>
                              {payment.observations && (
                                <p className="text-sm text-green-700">{payment.observations}</p>
                              )}
                            </div>
                            <span className="font-bold text-green-700">{safeCurrency(payment.amount)}</span>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && (
                        <p className="text-green-600 text-center py-4">Nenhum pagamento registrado</p>
                      )}
                    </div>
                  </div>

                  {/* Commission History */}
                  {employee.isSeller && (
                    <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                      <h4 className="font-bold text-yellow-900 mb-4">Histórico de Comissões</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {commissions.map(commission => (
                          <div key={commission.id} className="p-3 bg-white rounded-lg border border-yellow-100">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-yellow-900">{formatDateForDisplay(commission.date)}</p>
                                <p className="text-sm text-yellow-700">
                                  {commission.commissionRate}% sobre {safeCurrency(commission.saleValue)}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-yellow-700">{safeCurrency(commission.commissionAmount)}</span>
                                <span className={`block px-2 py-1 rounded-full text-xs font-bold border ${
                                  commission.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'
                                }`}>
                                  {commission.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {commissions.length === 0 && (
                          <p className="text-yellow-600 text-center py-4">Nenhuma comissão registrada</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Observations */}
                {viewingEmployee.observations && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Observações</h4>
                    <p className="text-slate-700">{viewingEmployee.observations}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setViewingEmployee(null)}
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