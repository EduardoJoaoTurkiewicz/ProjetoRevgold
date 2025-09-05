import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Users, DollarSign, Calendar, Upload, Clock, TrendingUp, CreditCard, Star, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission } from '../types';
import { EmployeeForm } from './forms/EmployeeForm';
import { EmployeeAdvanceForm } from './forms/EmployeeAdvanceForm';
import { EmployeeOvertimeForm } from './forms/EmployeeOvertimeForm';

export function Employees() {
  const { 
    employees,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    employeeCommissions,
    sales,
    createEmployee, 
    updateEmployee, 
    deleteEmployee, 
    loadAllData,
    createEmployeeAdvance,
    updateEmployeeAdvance,
    createEmployeeOvertime,
    updateEmployeeOvertime,
    createEmployeePayment,
    updateEmployeeCommission,
    createCashTransaction
  } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [paymentEmployee, setPaymentEmployee] = useState<Employee | null>(null);
  const [advanceEmployee, setAdvanceEmployee] = useState<Employee | null>(null);
  const [overtimeEmployee, setOvertimeEmployee] = useState<Employee | null>(null);
  const [viewingPayrollEmployee, setViewingPayrollEmployee] = useState<Employee | null>(null);

  const handleAddEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    console.log('🔄 Adicionando novo funcionário:', employee);
    
    // Validate employee data before submitting
    if (!employee.name || !employee.name.trim()) {
      alert('Por favor, informe o nome do funcionário.');
      return;
    }
    
    if (!employee.position || !employee.position.trim()) {
      alert('Por favor, informe o cargo do funcionário.');
      return;
    }
    
    if (employee.salary <= 0) {
      alert('O salário deve ser maior que zero.');
      return;
    }
    
    createEmployee(employee).then(() => {
      console.log('✅ Funcionário adicionado com sucesso');
      setIsFormOpen(false);
    }).catch(error => {
      console.error('❌ Erro ao adicionar funcionário:', error);
      let errorMessage = 'Erro ao criar funcionário';
      
      if (error.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint') || error.message.includes('já existe')) {
          errorMessage = 'Este funcionário já existe no sistema. O sistema previne duplicatas automaticamente.';
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          errorMessage = 'Dados inválidos ou duplicados. Verifique as informações inseridas.';
        } else if (error.message.includes('invalid input syntax')) {
          errorMessage = 'Formato de dados inválido. Verifique os valores inseridos.';
        } else if (error.message.includes('null value')) {
          errorMessage = 'Campos obrigatórios não preenchidos. Verifique todos os campos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert('Erro ao criar funcionário: ' + errorMessage);
    });
  };

  const handleEditEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    if (editingEmployee) {
      const updatedEmployee: Employee = {
        ...employee,
        id: editingEmployee.id,
        createdAt: editingEmployee.createdAt
      };
      updateEmployee(updatedEmployee).then(() => {
        setEditingEmployee(null);
      }).catch(error => {
        alert('Erro ao atualizar funcionário: ' + error.message);
      });
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      deleteEmployee(id).catch(error => {
        alert('Erro ao excluir funcionário: ' + error.message);
      });
    }
  };

  const handleAddAdvance = (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => {
    // Validate advance data
    if (advance.amount <= 0) {
      alert('O valor do adiantamento deve ser maior que zero.');
      return;
    }
    
    createEmployeeAdvance(advance).then(() => {
      // Cash transaction is handled automatically by database trigger
      console.log('✅ Adiantamento criado, transação de caixa será criada automaticamente');
      setAdvanceEmployee(null);
    }).catch(error => {
      alert('Erro ao criar adiantamento: ' + error.message);
    });
  };

  const handleAddOvertime = (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => {
    createEmployeeOvertime(overtime).then(() => {
      setOvertimeEmployee(null);
    }).catch(error => {
      alert('Erro ao criar hora extra: ' + error.message);
    });
  };
  const handlePayment = (payment: { amount: number; observations: string; receipt?: string }) => {
    if (paymentEmployee) {
      const newPayment: EmployeePayment = {
        employeeId: paymentEmployee.id,
        amount: payment.amount,
        paymentDate: new Date().toLocaleDateString('en-CA'), // Format: YYYY-MM-DD
        isPaid: true,
        receipt: payment.receipt,
        observations: payment.observations
      };
      
      createEmployeePayment(newPayment).then(() => {
        // Cash transaction will be handled automatically by database trigger
        console.log('✅ Pagamento registrado, transação de caixa será criada automaticamente');
        
        // Marcar adiantamentos como descontados
        const pendingAdvances = getEmployeeAdvances(paymentEmployee.id).filter(a => a.status === 'pendente');
        pendingAdvances.forEach(advance => {
          updateEmployeeAdvance({ ...advance, status: 'descontado' as const } as EmployeeAdvance).catch(error => {
            console.error('Erro ao atualizar adiantamento:', error);
          });
        });
        
        // Marcar horas extras como pagas
        const pendingOvertimes = getEmployeeOvertimes(paymentEmployee.id).filter(o => o.status === 'pendente');
        pendingOvertimes.forEach(overtime => {
          updateEmployeeOvertime({ ...overtime, status: 'pago' } as EmployeeOvertime).catch(error => {
            console.error('Erro ao atualizar hora extra:', error);
          });
        });
        
        // Marcar comissões como pagas
        const pendingCommissions = getEmployeeCommissions(paymentEmployee.id).filter(c => c.status === 'pendente');
        pendingCommissions.forEach(commission => {
          updateEmployeeCommission({ ...commission, status: 'pago' } as EmployeeCommission).catch(error => {
            console.error('Erro ao atualizar comissão:', error);
          });
        });
        
        setPaymentEmployee(null);
      }).catch(error => {
        alert('Erro ao registrar pagamento: ' + error.message);
      });
    }
  };

  const getEmployeePayments = (employeeId: string) => {
    return (employeePayments || []).filter(payment => payment.employeeId === employeeId);
  };

  const getEmployeeAdvances = (employeeId: string) => {
    return (employeeAdvances || []).filter(advance => advance.employeeId === employeeId);
  };

  const getEmployeeOvertimes = (employeeId: string) => {
    return (employeeOvertimes || []).filter(overtime => overtime.employeeId === employeeId);
  };

  const getEmployeeCommissions = (employeeId: string) => {
    return (employeeCommissions || []).filter(commission => commission.employeeId === employeeId);
  };

  const calculateEmployeePayroll = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Salário base
    const baseSalary = employee.salary;

    // Comissões do mês atual
    const monthlyCommissions = getEmployeeCommissions(employeeId).filter(c => {
      const commissionDate = new Date(c.date);
      return commissionDate.getMonth() === currentMonth && 
             commissionDate.getFullYear() === currentYear &&
             c.status === 'pendente';
    });
    const totalCommissions = monthlyCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    
    // Comissões totais acumuladas (todas as pendentes, não só do mês)
    const allPendingCommissions = getEmployeeCommissions(employeeId).filter(c => c.status === 'pendente');
    const totalPendingCommissions = allPendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    // Horas extras pendentes
    const pendingOvertimes = getEmployeeOvertimes(employeeId).filter(o => o.status === 'pendente');
    const totalOvertimes = pendingOvertimes.reduce((sum, o) => sum + o.totalAmount, 0);

    // Adiantamentos pendentes
    const pendingAdvances = getEmployeeAdvances(employeeId).filter(a => a.status === 'pendente');
    const totalAdvances = pendingAdvances.reduce((sum, a) => sum + a.amount, 0);

    // Total a pagar
    const totalToPay = baseSalary + totalCommissions + totalOvertimes - totalAdvances;

    return {
      baseSalary,
      totalCommissions,
      totalPendingCommissions,
      totalOvertimes,
      totalAdvances,
      totalToPay,
      monthlyCommissions,
      allPendingCommissions,
      pendingOvertimes,
      pendingAdvances
    };
  };
  const getLastPayment = (employeeId: string) => {
    const payments = getEmployeePayments(employeeId);
    return payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
  };

  const getNextPaymentDate = (employee: Employee) => {
    const today = new Date();
    
    // Se há uma data específica definida para o próximo pagamento, use ela
    if (employee.nextPaymentDate) {
      return new Date(employee.nextPaymentDate);
    }
    
    // Caso contrário, calcule baseado no dia do pagamento
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let nextPaymentDate = new Date(currentYear, currentMonth, employee.paymentDay);

    if (nextPaymentDate <= today) {
      nextPaymentDate = new Date(currentYear, currentMonth + 1, employee.paymentDay);
    }
    
    return nextPaymentDate;
  };

  const canEdit = true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 shadow-xl floating-animation">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Funcionários</h1>
            <p className="text-slate-600 text-lg">Gestão de equipe e folha de pagamento</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Funcionário
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Total de Funcionários</h3>
              <p className="text-blue-700">{employees.filter(e => e.isActive).length} ativos</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">Vendedores</h3>
              <p className="text-green-700">{employees.filter(e => e.isActive && e.isSeller).length} ativos</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">Folha de Pagamento</h3>
              <p className="text-green-700">
                R$ {employees
                  .filter(e => e.isActive)
                  .reduce((sum, e) => sum + e.salary, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-medium text-orange-900">Próximos Pagamentos</h3>
              <p className="text-orange-700">
                {employees.filter(e => {
                  const nextPayment = getNextPaymentDate(e);
                  const today = new Date();
                  const diffDays = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays <= 7 && e.isActive;
                }).length} esta semana
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="card">
        {employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cargo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Salário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Dia do Pagamento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Próximo Pagamento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => {
                  const nextPayment = getNextPaymentDate(employee);
                  const lastPayment = getLastPayment(employee.id);
                  const today = new Date();
                  const paymentDate = nextPayment;
                  const diffDays = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const payroll = calculateEmployeePayroll(employee.id);
                  
                  return (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{employee.name}</td>
                      <td className="py-3 px-4 text-sm">{employee.position}</td>
                      <td className="py-3 px-4 text-sm">
                        {employee.isSeller ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                            Vendedor
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                            Funcionário
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <span className="font-medium">R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          {payroll && payroll.totalToPay !== payroll.baseSalary && (
                            <div className="text-xs text-green-600 font-bold">
                              Total: R$ {payroll.totalToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">Dia {employee.paymentDay}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={
                          diffDays <= 3 ? 'text-red-600 font-medium' :
                          diffDays <= 7 ? 'text-orange-600 font-medium' :
                          'text-gray-900'
                        }>
                          {paymentDate.toLocaleDateString('pt-BR')}
                          {diffDays <= 7 && (
                            <span className="text-xs block">
                              {diffDays === 0 ? 'Hoje!' : 
                               diffDays === 1 ? 'Amanhã' : 
                               `${diffDays} dias`}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          employee.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {employee.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingEmployee(employee)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewingPayrollEmployee(employee)}
                            className="text-purple-600 hover:text-purple-800 p-1 rounded"
                            title="Ver Folha de Pagamento"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAdvanceEmployee(employee)}
                            className="text-orange-600 hover:text-orange-800 p-1 rounded"
                            title="Adiantamento"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOvertimeEmployee(employee)}
                            className="text-green-600 hover:text-green-800 p-1 rounded"
                            title="Horas Extras"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => setEditingEmployee(employee)}
                                className="text-emerald-600 hover:text-emerald-800 p-1 rounded"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setPaymentEmployee(employee)}
                                className="text-indigo-600 hover:text-indigo-800 p-1 rounded"
                                title="Registrar Pagamento"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhum funcionário cadastrado ainda.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary"
            >
              Cadastrar primeiro funcionário
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
          onSubmit={handleAddAdvance}
          onCancel={() => setAdvanceEmployee(null)}
        />
      )}

      {/* Overtime Form Modal */}
      {overtimeEmployee && (
        <EmployeeOvertimeForm
          employeeId={overtimeEmployee.id}
          employeeName={overtimeEmployee.name}
          onSubmit={handleAddOvertime}
          onCancel={() => setOvertimeEmployee(null)}
        />
      )}
      {/* View Employee Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Detalhes do Funcionário</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Nome</label>
                  <p className="text-sm text-gray-900">{viewingEmployee.name}</p>
                </div>
                <div>
                  <label className="form-label">Cargo</label>
                  <p className="text-sm text-gray-900">{viewingEmployee.position}</p>
                </div>
                <div>
                  <label className="form-label">Tipo</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    viewingEmployee.isSeller ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingEmployee.isSeller ? 'Vendedor (5% comissão)' : 'Funcionário'}
                  </span>
                </div>
                <div>
                  <label className="form-label">Salário</label>
                  <p className="text-sm text-gray-900">
                    R$ {viewingEmployee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Dia do Pagamento</label>
                  <p className="text-sm text-gray-900">Dia {viewingEmployee.paymentDay}</p>
                </div>
                <div>
                  <label className="form-label">Data de Contratação</label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingEmployee.hireDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Data do Próximo Pagamento</label>
                  <p className="text-sm text-gray-900">
                    {getNextPaymentDate(viewingEmployee).toLocaleDateString('pt-BR')}
                  </p>
                  {viewingEmployee.nextPaymentDate && (
                    <p className="text-xs text-blue-600 mt-1">
                      ✓ Data específica definida para próximo pagamento
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    viewingEmployee.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingEmployee.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {viewingEmployee.observations && (
                <div className="mb-6">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                    {viewingEmployee.observations}
                  </p>
                </div>
              )}

              {/* Payment History */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Histórico de Pagamentos</h3>
                {getEmployeePayments(viewingEmployee.id).length > 0 ? (
                  <div className="space-y-2">
                    {getEmployeePayments(viewingEmployee.id)
                      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                      .map(payment => (
                        <div key={payment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                              </p>
                              {payment.observations && (
                                <p className="text-sm text-gray-700 mt-1">{payment.observations}</p>
                              )}
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Pago
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum pagamento registrado.</p>
                )}
              </div>

              <div className="flex justify-end">
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

      {/* Payroll Details Modal */}
      {viewingPayrollEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Folha de Pagamento Detalhada</h2>
                <button
                  onClick={() => setViewingPayrollEmployee(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {(() => {
                const payroll = calculateEmployeePayroll(viewingPayrollEmployee.id);
                if (!payroll) return null;

                return (
                  <div className="space-y-8">
                    {/* Employee Info */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <h3 className="text-2xl font-bold text-blue-900 mb-2">{viewingPayrollEmployee.name}</h3>
                      <p className="text-blue-700 font-semibold">{viewingPayrollEmployee.position}</p>
                      {viewingPayrollEmployee.isSeller && (
                        <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                          Vendedor - Comissão 5%
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-200">
                        <h4 className="font-bold text-green-900 mb-2">Salário Base</h4>
                        <p className="text-2xl font-black text-green-700">
                          R$ {payroll.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-2">Comissões</h4>
                        <p className="text-2xl font-black text-blue-700">
                          R$ {payroll.totalPendingCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {payroll.allPendingCommissions.length} comissão(ões) pendente(s)
                        </p>
                      </div>
                      <div className="text-center p-6 bg-purple-50 rounded-2xl border border-purple-200">
                        <h4 className="font-bold text-purple-900 mb-2">Horas Extras</h4>
                        <p className="text-2xl font-black text-purple-700">
                          R$ {payroll.totalOvertimes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-200">
                        <h4 className="font-bold text-red-900 mb-2">Adiantamentos</h4>
                        <p className="text-2xl font-black text-red-700">
                          - R$ {payroll.totalAdvances.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Total to Pay */}
                    <div className="p-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl border-2 border-green-300 text-center">
                      <h3 className="text-2xl font-bold text-green-900 mb-4">Total a Pagar</h3>
                      <p className="text-5xl font-black text-green-700">
                        R$ {(payroll.baseSalary + payroll.totalPendingCommissions + payroll.totalOvertimes - payroll.totalAdvances).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-600 font-bold mt-2">
                        Inclui TODAS as comissões pendentes acumuladas
                      </p>
                    </div>

                    {/* Detailed Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Commissions */}
                      {payroll.allPendingCommissions.length > 0 && (
                        <div className="card">
                          <h4 className="font-bold text-slate-900 mb-4">Todas as Comissões Pendentes</h4>
                          <div className="space-y-3">
                            {payroll.allPendingCommissions.map(commission => {
                              const sale = sales.find(s => s.id === commission.saleId);
                              return (
                                <div key={commission.id} className="p-3 bg-blue-50 rounded-xl">
                                  <p className="font-semibold text-blue-900">
                                    {sale ? sale.client : 'Venda não encontrada'}
                                  </p>
                                  <p className="text-sm text-blue-700">
                                    Venda: R$ {commission.saleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-sm font-bold text-blue-800">
                                    Comissão: R$ {commission.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({commission.commissionRate}%)
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    {new Date(commission.date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Overtime */}
                      {payroll.pendingOvertimes.length > 0 && (
                        <div className="card">
                          <h4 className="font-bold text-slate-900 mb-4">Horas Extras</h4>
                          <div className="space-y-3">
                            {payroll.pendingOvertimes.map(overtime => (
                              <div key={overtime.id} className="p-3 bg-purple-50 rounded-xl">
                                <p className="font-semibold text-purple-900">{overtime.description}</p>
                                <p className="text-sm text-purple-700">
                                  {overtime.hours}h × R$ {overtime.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm font-bold text-purple-800">
                                  Total: R$ {overtime.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-purple-600">
                                  {new Date(overtime.date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advances */}
                      {payroll.pendingAdvances.length > 0 && (
                        <div className="card">
                          <h4 className="font-bold text-slate-900 mb-4">Adiantamentos</h4>
                          <div className="space-y-3">
                            {payroll.pendingAdvances.map(advance => (
                              <div key={advance.id} className="p-3 bg-red-50 rounded-xl">
                                <p className="font-semibold text-red-900">{advance.description}</p>
                                <p className="text-sm text-red-700">
                                  Método: {advance.paymentMethod.replace('_', ' ')}
                                </p>
                                <p className="text-sm font-bold text-red-800">
                                  Valor: R$ {advance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-red-600">
                                  {new Date(advance.date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setViewingPayrollEmployee(null)}
                        className="btn-secondary"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {paymentEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Registrar Pagamento</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const payroll = calculateEmployeePayroll(paymentEmployee.id);
                const suggestedAmount = payroll ? payroll.totalToPay : paymentEmployee.salary;
                handlePayment({
                  amount: parseFloat(formData.get('amount') as string) || suggestedAmount,
                  observations: formData.get('observations') as string || '',
                  receipt: formData.get('receipt') ? 'receipt-uploaded' : undefined
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Funcionário</label>
                    <p className="text-sm text-gray-900 font-medium">{paymentEmployee.name}</p>
                    {paymentEmployee.isSeller && (
                      <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                        Vendedor - Comissão 5%
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Valor do Pagamento</label>
                    {(() => {
                      const payroll = calculateEmployeePayroll(paymentEmployee.id);
                      return payroll ? (
                        <div className="mb-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <h4 className="font-bold text-blue-900 mb-2">Cálculo Automático</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Salário Base:</span>
                              <span className="font-bold">R$ {payroll.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {payroll.totalCommissions > 0 && (
                              <div className="flex justify-between text-green-700">
                                <span>+ Comissões:</span>
                                <span className="font-bold">R$ {payroll.totalPendingCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {payroll.totalOvertimes > 0 && (
                              <div className="flex justify-between text-purple-700">
                                <span>+ Horas Extras:</span>
                                <span className="font-bold">R$ {payroll.totalOvertimes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {payroll.totalAdvances > 0 && (
                              <div className="flex justify-between text-red-700">
                                <span>- Adiantamentos:</span>
                                <span className="font-bold">R$ {payroll.totalAdvances.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t pt-2 text-lg font-black text-green-700">
                              <span>Total:</span>
                              <span>R$ {(payroll.baseSalary + payroll.totalPendingCommissions + payroll.totalOvertimes - payroll.totalAdvances).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      defaultValue={(() => {
                        const payroll = calculateEmployeePayroll(paymentEmployee.id);
                        return payroll ? payroll.totalToPay : paymentEmployee.salary;
                      })()}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Observações</label>
                    <textarea
                      name="observations"
                      className="input-field"
                      rows={3}
                      placeholder="Observações sobre o pagamento..."
                    />
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Data de Contratação:</strong> {new Date(paymentEmployee.hireDate).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Próximo Pagamento:</strong> {getNextPaymentDate(paymentEmployee).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Recibo de Comprovação</label>
                    <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-green-500 mb-3" />
                      <p className="text-sm text-green-700 font-semibold mb-2">Anexar recibo (opcional)</p>
                      <p className="text-xs text-green-600">PDF, JPG, PNG (máx. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      name="receipt"
                      accept="image/*,.pdf,.doc,.docx"
                      className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('Arquivo de recibo selecionado:', file.name, file.size);
                          if (file.size > 10 * 1024 * 1024) {
                            alert('Arquivo muito grande. Máximo 10MB.');
                            e.target.value = '';
                            return;
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setPaymentEmployee(null)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Registrar Pagamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}