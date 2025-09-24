import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Users, DollarSign, Calendar, Upload, Clock, TrendingUp, CreditCard, Star, X, Award, Building2, UserCheck, UserX, Briefcase, Phone, Mail, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission } from '../types';
import { EmployeeForm } from './forms/EmployeeForm';
import { EmployeeAdvanceForm } from './forms/EmployeeAdvanceForm';
import { EmployeeOvertimeForm } from './forms/EmployeeOvertimeForm';
import { safeNumber, safeCurrency, logMonetaryValues } from '../utils/numberUtils';
import { DeduplicationService } from '../lib/deduplicationService';
import { UUIDManager } from '../lib/uuidManager';

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
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  // Ensure employees data is deduplicated in the UI
  const deduplicatedEmployees = React.useMemo(() => {
    return DeduplicationService.removeDuplicatesById(employees || []);
  }, [employees]);

  // Separar funcionários ativos e inativos
  const activeEmployees = deduplicatedEmployees.filter(emp => emp.isActive);
  const inactiveEmployees = deduplicatedEmployees.filter(emp => !emp.isActive);
  const sellers = activeEmployees.filter(emp => emp.isSeller);

  // Calcular estatísticas
  const totalPayroll = activeEmployees.reduce((sum, emp) => sum + safeNumber(emp.salary, 0), 0);
  const averageSalary = activeEmployees.length > 0 ? totalPayroll / activeEmployees.length : 0;

  const handleAddEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    console.log('🔄 Adicionando novo funcionário:', employee);
    logMonetaryValues(employee, 'Add Employee');
    
    // Clean UUID fields before submission
    const cleanedEmployee = UUIDManager.cleanObjectUUIDs(employee);
    
    // Validate employee data before submitting
    if (!cleanedEmployee.name || !cleanedEmployee.name.trim()) {
      alert('Por favor, informe o nome do funcionário.');
      return;
    }
    
    if (!cleanedEmployee.position || !cleanedEmployee.position.trim()) {
      alert('Por favor, informe o cargo do funcionário.');
      return;
    }
    
    const salary = safeNumber(cleanedEmployee.salary, 0);
    if (salary <= 0) {
      alert('O salário deve ser maior que zero.');
      return;
    }
    
    const sanitizedEmployee = {
      ...cleanedEmployee,
      salary: salary,
      paymentDay: safeNumber(cleanedEmployee.paymentDay, 5)
    };
    
    createEmployee(sanitizedEmployee).then(() => {
      console.log('✅ Funcionário adicionado com sucesso');
      setIsFormOpen(false);
    }).catch(error => {
      console.error('❌ Erro ao adicionar funcionário:', error);
      let errorMessage = 'Erro ao criar funcionário';
      
      if (error?.message) {
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
    const amount = safeNumber(advance.amount, 0);
    if (amount <= 0) {
      alert('O valor do adiantamento deve ser maior que zero.');
      return;
    }
    
    const sanitizedAdvance = {
      ...advance,
      amount: amount
    };
    
    logMonetaryValues(sanitizedAdvance, 'Add Employee Advance');
    
    createEmployeeAdvance(sanitizedAdvance).then(() => {
      // Cash transaction is handled automatically by database trigger
      console.log('✅ Adiantamento criado, transação de caixa será criada automaticamente');
      setAdvanceEmployee(null);
    }).catch(error => {
      alert('Erro ao criar adiantamento: ' + error.message);
    });
  };

  const handleAddOvertime = (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => {
    const sanitizedOvertime = {
      ...overtime,
      hours: safeNumber(overtime.hours, 0),
      hourlyRate: safeNumber(overtime.hourlyRate, 0),
      totalAmount: safeNumber(overtime.totalAmount, 0)
    };
    
    logMonetaryValues(sanitizedOvertime, 'Add Employee Overtime');
    
    createEmployeeOvertime(sanitizedOvertime).then(() => {
      setOvertimeEmployee(null);
    }).catch(error => {
      alert('Erro ao criar hora extra: ' + error.message);
    });
  };

  const handlePayment = (payment: { amount: number; observations: string; receipt?: string }) => {
    if (paymentEmployee) {
      const amount = safeNumber(payment.amount, 0);
      
      const newPayment: EmployeePayment = {
        employeeId: paymentEmployee.id,
        amount: amount,
        paymentDate: new Date().toLocaleDateString('en-CA'), // Format: YYYY-MM-DD
        isPaid: true,
        receipt: payment.receipt,
        observations: payment.observations
      };
      
      logMonetaryValues(newPayment, 'Employee Payment');
      
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
    const totalCommissions = monthlyCommissions.reduce((sum, c) => sum + safeNumber(c.commissionAmount, 0), 0);
    
    // Comissões totais acumuladas (todas as pendentes, não só do mês)
    const allPendingCommissions = getEmployeeCommissions(employeeId).filter(c => c.status === 'pendente');
    const totalPendingCommissions = allPendingCommissions.reduce((sum, c) => sum + safeNumber(c.commissionAmount, 0), 0);

    // Horas extras pendentes
    const pendingOvertimes = getEmployeeOvertimes(employeeId).filter(o => o.status === 'pendente');
    const totalOvertimes = pendingOvertimes.reduce((sum, o) => sum + safeNumber(o.totalAmount, 0), 0);

    // Adiantamentos pendentes
    const pendingAdvances = getEmployeeAdvances(employeeId).filter(a => a.status === 'pendente');
    const totalAdvances = pendingAdvances.reduce((sum, a) => sum + safeNumber(a.amount, 0), 0);

    // Total a pagar
    const totalToPay = safeNumber(baseSalary, 0) + totalCommissions + totalOvertimes - totalAdvances;

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

  const toggleEmployeeExpansion = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const canEdit = true;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 shadow-xl floating-animation">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Funcionários</h1>
            <p className="text-slate-600 text-lg">Controle completo da equipe e folha de pagamento</p>
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
                {inactiveEmployees.length} inativo(s)
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Vendedores</h3>
              <p className="text-3xl font-black text-green-700">{sellers.length}</p>
              <p className="text-sm text-green-600 font-semibold">
                Comissão 5%
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Folha Total</h3>
              <p className="text-3xl font-black text-blue-700">
                {safeCurrency(totalPayroll)}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                Mensal
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Salário Médio</h3>
              <p className="text-3xl font-black text-orange-700">
                {safeCurrency(averageSalary)}
              </p>
              <p className="text-sm text-orange-600 font-semibold">
                Por funcionário
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Funcionários Ativos */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-purple-600">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Funcionários Ativos</h3>
            <p className="text-slate-600 font-semibold">{activeEmployees.length} funcionário(s) ativo(s)</p>
          </div>
        </div>

        {activeEmployees.length > 0 ? (
          <div className="space-y-4">
            {activeEmployees.map(employee => {
              // Additional safety check for duplicates in render
              if (!employee.id || !UUIDManager.isValidUUID(employee.id)) {
                console.warn('⚠️ Invalid employee ID detected in render:', employee.id);
                return null;
              }
              
              const nextPayment = getNextPaymentDate(employee);
              const lastPayment = getLastPayment(employee.id);
              const today = new Date();
              const paymentDate = nextPayment;
              const diffDays = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const payroll = calculateEmployeePayroll(employee.id);
              const isExpanded = expandedEmployees.has(employee.id);
              
              return (
                <div key={employee.id} className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Employee Header */}
                  <div 
                    className="p-6 bg-gradient-to-r from-purple-50 to-transparent hover:from-purple-100 cursor-pointer transition-modern"
                    onClick={() => toggleEmployeeExpansion(employee.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="p-2 rounded-lg bg-purple-600 text-white modern-shadow">
                          {isExpanded ? 
                            <ChevronDown className="w-5 h-5" /> : 
                            <ChevronRight className="w-5 h-5" />
                          }
                        </button>
                        
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl modern-shadow-lg ${
                            employee.isSeller ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          }`}>
                            {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{employee.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-slate-600 font-semibold">{employee.position}</span>
                              {employee.isSeller && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                                  <Star className="w-3 h-3 inline mr-1" />
                                  VENDEDOR
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Contratado em {new Date(employee.hireDate).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                Paga dia {employee.paymentDay}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-slate-600 font-semibold">Salário Base</p>
                            <p className="text-2xl font-black text-purple-600">
                              {safeCurrency(employee.salary)}
                            </p>
                          </div>
                          
                          {payroll && payroll.totalToPay !== payroll.baseSalary && (
                            <div>
                              <p className="text-sm text-slate-600 font-semibold">Total a Pagar</p>
                              <p className="text-2xl font-black text-green-600">
                                {safeCurrency(payroll.totalToPay)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            diffDays <= 3 ? 'bg-red-100 text-red-800 border border-red-200' :
                            diffDays <= 7 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {diffDays === 0 ? 'PAGAR HOJE!' : 
                             diffDays === 1 ? 'Pagar amanhã' : 
                             diffDays <= 7 ? `${diffDays} dias` : 'No prazo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employee Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white">
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Informações Básicas */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-purple-600" />
                              Informações Básicas
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-sm text-purple-600 font-semibold">Nome Completo</p>
                                <p className="text-purple-900 font-bold">{employee.name}</p>
                              </div>
                              
                              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-sm text-purple-600 font-semibold">Cargo</p>
                                <p className="text-purple-900 font-bold">{employee.position}</p>
                              </div>
                              
                              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-sm text-purple-600 font-semibold">Tipo</p>
                                <div className="flex items-center gap-2">
                                  {employee.isSeller ? (
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                                      <Star className="w-3 h-3 inline mr-1" />
                                      Vendedor (5% comissão)
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
                                      <Briefcase className="w-3 h-3 inline mr-1" />
                                      Funcionário
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-sm text-purple-600 font-semibold">Data de Contratação</p>
                                <p className="text-purple-900 font-bold">
                                  {new Date(employee.hireDate).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Informações Financeiras */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-green-600" />
                              Informações Financeiras
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                <p className="text-sm text-green-600 font-semibold">Salário Base</p>
                                <p className="text-2xl font-black text-green-700">
                                  {safeCurrency(employee.salary)}
                                </p>
                              </div>
                              
                              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm text-blue-600 font-semibold">Dia do Pagamento</p>
                                <p className="text-blue-900 font-bold">Todo dia {employee.paymentDay}</p>
                              </div>
                              
                              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                                <p className="text-sm text-orange-600 font-semibold">Próximo Pagamento</p>
                                <p className={`font-bold ${
                                  diffDays <= 3 ? 'text-red-700' :
                                  diffDays <= 7 ? 'text-orange-700' :
                                  'text-orange-900'
                                }`}>
                                  {paymentDate.toLocaleDateString('pt-BR')}
                                </p>
                                {diffDays <= 7 && (
                                  <p className="text-xs text-orange-600 font-bold">
                                    {diffDays === 0 ? 'HOJE!' : 
                                     diffDays === 1 ? 'Amanhã' : 
                                     `${diffDays} dias`}
                                  </p>
                                )}
                              </div>
                              
                              {payroll && payroll.totalToPay !== payroll.baseSalary && (
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                  <p className="text-sm text-emerald-600 font-semibold">Total a Pagar</p>
                                  <p className="text-2xl font-black text-emerald-700">
                                    {safeCurrency(payroll.totalToPay)}
                                  </p>
                                  <p className="text-xs text-emerald-600">
                                    Inclui comissões e extras
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Ações Rápidas */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              <Award className="w-5 h-5 text-indigo-600" />
                              Ações Rápidas
                            </h4>
                            
                            <div className="space-y-3">
                              <button
                                onClick={() => setViewingEmployee(employee)}
                                className="w-full p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-3"
                              >
                                <Eye className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-800">Ver Detalhes Completos</span>
                              </button>
                              
                              <button
                                onClick={() => setViewingPayrollEmployee(employee)}
                                className="w-full p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-3"
                              >
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-800">Folha de Pagamento</span>
                              </button>
                              
                              <button
                                onClick={() => setAdvanceEmployee(employee)}
                                className="w-full p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors flex items-center gap-3"
                              >
                                <CreditCard className="w-5 h-5 text-orange-600" />
                                <span className="font-semibold text-orange-800">Dar Adiantamento</span>
                              </button>
                              
                              <button
                                onClick={() => setOvertimeEmployee(employee)}
                                className="w-full p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-3"
                              >
                                <Clock className="w-5 h-5 text-purple-600" />
                                <span className="font-semibold text-purple-800">Registrar Horas Extras</span>
                              </button>
                              
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => setPaymentEmployee(employee)}
                                    className="w-full p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-3"
                                  >
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    <span className="font-semibold text-emerald-800">Registrar Pagamento</span>
                                  </button>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => setEditingEmployee(employee)}
                                      className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Edit className="w-4 h-4 text-yellow-600" />
                                      <span className="font-semibold text-yellow-800 text-sm">Editar</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => handleDeleteEmployee(employee.id)}
                                      className="p-3 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                      <span className="font-semibold text-red-800 text-sm">Excluir</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Resumo de Comissões e Extras (se for vendedor) */}
                        {employee.isSeller && payroll && (
                          <div className="mt-6 pt-6 border-t border-slate-200">
                            <h5 className="font-bold text-slate-900 mb-4">Resumo de Comissões</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                                <p className="text-green-600 font-semibold text-sm">Comissões Pendentes</p>
                                <p className="text-xl font-black text-green-700">
                                  {safeCurrency(payroll.totalPendingCommissions)}
                                </p>
                                <p className="text-xs text-green-600">
                                  {payroll.allPendingCommissions.length} comissão(ões)
                                </p>
                              </div>
                              
                              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-purple-600 font-semibold text-sm">Horas Extras</p>
                                <p className="text-xl font-black text-purple-700">
                                  {safeCurrency(payroll.totalOvertimes)}
                                </p>
                                <p className="text-xs text-purple-600">
                                  {payroll.pendingOvertimes.length} registro(s)
                                </p>
                              </div>
                              
                              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                                <p className="text-red-600 font-semibold text-sm">Adiantamentos</p>
                                <p className="text-xl font-black text-red-700">
                                  -{safeCurrency(payroll.totalAdvances)}
                                </p>
                                <p className="text-xs text-red-600">
                                  {payroll.pendingAdvances.length} adiantamento(s)
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <Users className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhum funcionário ativo</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece adicionando seu primeiro funcionário para gerenciar a equipe.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Adicionar primeiro funcionário
            </button>
          </div>
        )}
      </div>

      {/* Funcionários Inativos */}
      {inactiveEmployees.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gray-600">
              <UserX className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Funcionários Inativos</h3>
              <p className="text-slate-600 font-semibold">{inactiveEmployees.length} funcionário(s) inativo(s)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveEmployees.map(employee => (
              <div key={employee.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center text-white font-bold">
                    {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{employee.name}</h4>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {safeCurrency(employee.salary)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingEmployee(employee)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setEditingEmployee(employee)}
                        className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl modern-shadow-xl ${
                    viewingEmployee.isSeller ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-purple-600 to-violet-700'
                  }`}>
                    {viewingEmployee.isSeller ? <Star className="w-8 h-8 text-white" /> : <Users className="w-8 h-8 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{viewingEmployee.name}</h2>
                    <p className="text-slate-600 text-lg">{viewingEmployee.position}</p>
                    {viewingEmployee.isSeller && (
                      <span className="inline-block mt-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-200">
                        <Star className="w-4 h-4 inline mr-2" />
                        Vendedor - Comissão 5%
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingEmployee(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Informações Pessoais */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">Informações Pessoais</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="form-label">Nome Completo</label>
                      <p className="text-sm text-slate-900 font-semibold">{viewingEmployee.name}</p>
                    </div>
                    <div>
                      <label className="form-label">Cargo</label>
                      <p className="text-sm text-slate-900 font-semibold">{viewingEmployee.position}</p>
                    </div>
                    <div>
                      <label className="form-label">Data de Contratação</label>
                      <p className="text-sm text-slate-900 font-semibold">
                        {new Date(viewingEmployee.hireDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <label className="form-label">Status</label>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        viewingEmployee.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {viewingEmployee.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informações Financeiras */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Informações Financeiras</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="form-label">Salário</label>
                      <p className="text-lg font-black text-green-700">
                        {safeCurrency(viewingEmployee.salary)}
                      </p>
                    </div>
                    <div>
                      <label className="form-label">Dia do Pagamento</label>
                      <p className="text-sm text-slate-900 font-semibold">Dia {viewingEmployee.paymentDay}</p>
                    </div>
                    <div>
                      <label className="form-label">Próximo Pagamento</label>
                      <p className="text-sm text-slate-900 font-semibold">
                        {getNextPaymentDate(viewingEmployee).toLocaleDateString('pt-BR')}
                      </p>
                      {viewingEmployee.nextPaymentDate && (
                        <p className="text-xs text-blue-600 mt-1 font-semibold">
                          ✓ Data específica definida
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {viewingEmployee.observations && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Observações</h3>
                  <p className="text-slate-700 text-lg">{viewingEmployee.observations}</p>
                </div>
              )}

              {/* Histórico de Pagamentos */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Histórico de Pagamentos</h3>
                {getEmployeePayments(viewingEmployee.id).length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto modern-scrollbar">
                    {getEmployeePayments(viewingEmployee.id)
                      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                      .map(payment => (
                        <div key={payment.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-green-900">
                                {safeCurrency(payment.amount)}
                              </p>
                              <p className="text-sm text-green-700">
                                {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                              </p>
                              {payment.observations && (
                                <p className="text-sm text-green-600 mt-1">{payment.observations}</p>
                              )}
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold border border-green-200">
                              <DollarSign className="w-3 h-3 inline mr-1" />
                              PAGO
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">Nenhum pagamento registrado ainda.</p>
                  </div>
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
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Folha de Pagamento Detalhada</h2>
                    <p className="text-slate-600 text-lg">{viewingPayrollEmployee.name}</p>
                  </div>
                </div>
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
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl modern-shadow-lg ${
                          viewingPayrollEmployee.isSeller ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {viewingPayrollEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-blue-900">{viewingPayrollEmployee.name}</h3>
                          <p className="text-blue-700 font-semibold text-lg">{viewingPayrollEmployee.position}</p>
                          {viewingPayrollEmployee.isSeller && (
                            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-200">
                              <Star className="w-4 h-4 inline mr-1" />
                              Vendedor - Comissão 5%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-200 modern-shadow-lg">
                        <div className="p-3 rounded-xl bg-green-600 w-fit mx-auto mb-4">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-green-900 mb-2">Salário Base</h4>
                        <p className="text-2xl font-black text-green-700">
                          {safeCurrency(payroll.baseSalary)}
                        </p>
                      </div>
                      
                      <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-200 modern-shadow-lg">
                        <div className="p-3 rounded-xl bg-blue-600 w-fit mx-auto mb-4">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-blue-900 mb-2">Comissões</h4>
                        <p className="text-2xl font-black text-blue-700">
                          {safeCurrency(payroll.totalPendingCommissions)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {payroll.allPendingCommissions.length} comissão(ões) pendente(s)
                        </p>
                      </div>
                      
                      <div className="text-center p-6 bg-purple-50 rounded-2xl border border-purple-200 modern-shadow-lg">
                        <div className="p-3 rounded-xl bg-purple-600 w-fit mx-auto mb-4">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-purple-900 mb-2">Horas Extras</h4>
                        <p className="text-2xl font-black text-purple-700">
                          {safeCurrency(payroll.totalOvertimes)}
                        </p>
                      </div>
                      
                      <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-200 modern-shadow-lg">
                        <div className="p-3 rounded-xl bg-red-600 w-fit mx-auto mb-4">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-red-900 mb-2">Adiantamentos</h4>
                        <p className="text-2xl font-black text-red-700">
                          - {safeCurrency(payroll.totalAdvances)}
                        </p>
                      </div>
                    </div>

                    {/* Total to Pay */}
                    <div className="p-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl border-2 border-green-300 text-center modern-shadow-xl">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="p-4 rounded-2xl bg-green-600 modern-shadow-lg">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-green-900">Total a Pagar</h3>
                      </div>
                      <p className="text-6xl font-black text-green-700 mb-4">
                        {safeCurrency(safeNumber(payroll.baseSalary, 0) + safeNumber(payroll.totalPendingCommissions, 0) + safeNumber(payroll.totalOvertimes, 0) - safeNumber(payroll.totalAdvances, 0))}
                      </p>
                      <p className="text-lg text-green-600 font-bold">
                        Inclui TODAS as comissões pendentes acumuladas
                      </p>
                    </div>

                    {/* Detailed Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Commissions */}
                      {payroll.allPendingCommissions.length > 0 && (
                        <div className="card modern-shadow-lg">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-blue-600" />
                            Todas as Comissões Pendentes
                          </h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto modern-scrollbar">
                            {payroll.allPendingCommissions.map(commission => {
                              const sale = sales.find(s => s.id === commission.saleId);
                              return (
                                <div key={commission.id} className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                  <p className="font-semibold text-blue-900">
                                    {sale ? sale.client : 'Venda não encontrada'}
                                  </p>
                                  <p className="text-sm text-blue-700">
                                    Venda: {safeCurrency(commission.saleValue)}
                                  </p>
                                  <p className="text-sm font-bold text-blue-800">
                                    Comissão: {safeCurrency(commission.commissionAmount)} ({safeNumber(commission.commissionRate, 5)}%)
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
                        <div className="card modern-shadow-lg">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            Horas Extras
                          </h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto modern-scrollbar">
                            {payroll.pendingOvertimes.map(overtime => (
                              <div key={overtime.id} className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="font-semibold text-purple-900">{overtime.description}</p>
                                <p className="text-sm text-purple-700">
                                  {safeNumber(overtime.hours, 0)}h × {safeCurrency(overtime.hourlyRate)}
                                </p>
                                <p className="text-sm font-bold text-purple-800">
                                  Total: {safeCurrency(overtime.totalAmount)}
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
                        <div className="card modern-shadow-lg">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-red-600" />
                            Adiantamentos
                          </h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto modern-scrollbar">
                            {payroll.pendingAdvances.map(advance => (
                              <div key={advance.id} className="p-3 bg-red-50 rounded-xl border border-red-200">
                                <p className="font-semibold text-red-900">{advance.description}</p>
                                <p className="text-sm text-red-700">
                                  Método: {advance.paymentMethod.replace('_', ' ')}
                                </p>
                                <p className="text-sm font-bold text-red-800">
                                  Valor: {safeCurrency(advance.amount)}
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Registrar Pagamento</h2>
                    <p className="text-slate-600">{paymentEmployee.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPaymentEmployee(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const payroll = calculateEmployeePayroll(paymentEmployee.id);
                const suggestedAmount = payroll ? safeNumber(payroll.totalToPay, 0) : safeNumber(paymentEmployee.salary, 0);
                handlePayment({
                  amount: safeNumber(formData.get('amount') as string, suggestedAmount),
                  observations: formData.get('observations') as string || '',
                  receipt: formData.get('receipt') ? 'receipt-uploaded' : undefined
                });
              }}>
                <div className="space-y-6">
                  {/* Employee Info Card */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl modern-shadow-lg ${
                        paymentEmployee.isSeller ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-purple-500 to-violet-600'
                      }`}>
                        {paymentEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900">{paymentEmployee.name}</h3>
                        <p className="text-purple-700 font-semibold">{paymentEmployee.position}</p>
                        {paymentEmployee.isSeller && (
                          <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                            <Star className="w-3 h-3 inline mr-1" />
                            Vendedor - Comissão 5%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Valor do Pagamento</label>
                    {(() => {
                      const payroll = calculateEmployeePayroll(paymentEmployee.id);
                      return payroll ? (
                        <div className="mb-4 p-6 bg-blue-50 rounded-2xl border border-blue-200">
                          <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Cálculo Automático da Folha
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Salário Base:</span>
                                <span className="font-bold">{safeCurrency(payroll.baseSalary)}</span>
                              </div>
                              {payroll.totalCommissions > 0 && (
                                <div className="flex justify-between text-green-700">
                                  <span>+ Comissões:</span>
                                  <span className="font-bold">{safeCurrency(payroll.totalPendingCommissions)}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              {payroll.totalOvertimes > 0 && (
                                <div className="flex justify-between text-purple-700">
                                  <span>+ Horas Extras:</span>
                                  <span className="font-bold">{safeCurrency(payroll.totalOvertimes)}</span>
                                </div>
                              )}
                              {payroll.totalAdvances > 0 && (
                                <div className="flex justify-between text-red-700">
                                  <span>- Adiantamentos:</span>
                                  <span className="font-bold">{safeCurrency(payroll.totalAdvances)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between border-t border-blue-200 pt-4 mt-4 text-lg font-black text-green-700">
                            <span>TOTAL A PAGAR:</span>
                            <span>{safeCurrency(safeNumber(payroll.baseSalary, 0) + safeNumber(payroll.totalPendingCommissions, 0) + safeNumber(payroll.totalOvertimes, 0) - safeNumber(payroll.totalAdvances, 0))}</span>
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
                        return payroll ? safeNumber(payroll.totalToPay, 0) : safeNumber(paymentEmployee.salary, 0);
                      })()}
                      className="input-field text-center text-2xl font-bold"
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
                    <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-700 font-semibold">Data de Contratação:</p>
                          <p className="text-blue-900">{new Date(paymentEmployee.hireDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-semibold">Próximo Pagamento:</p>
                          <p className="text-blue-900">{getNextPaymentDate(paymentEmployee).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Comprovante de Pagamento</label>
                    <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-green-500 mb-3" />
                      <p className="text-sm text-green-700 font-semibold mb-2">Anexar comprovante (opcional)</p>
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
                          console.log('Arquivo de comprovante selecionado:', file.name, file.size);
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
                
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
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