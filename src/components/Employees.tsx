import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Users, DollarSign, Calendar, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Employee, EmployeePayment } from '../types';
import { EmployeeForm } from './forms/EmployeeForm';

export function Employees() {
  const { state, dispatch } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [paymentEmployee, setPaymentEmployee] = useState<Employee | null>(null);

  const handleAddEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_EMPLOYEE', payload: newEmployee });
    setIsFormOpen(false);
  };

  const handleEditEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    if (editingEmployee) {
      const updatedEmployee: Employee = {
        ...employee,
        id: editingEmployee.id,
        createdAt: editingEmployee.createdAt
      };
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });
      setEditingEmployee(null);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
    }
  };

  const handlePayment = (payment: { amount: number; observations: string; receipt?: string }) => {
    if (paymentEmployee) {
      const newPayment: EmployeePayment = {
        id: Date.now().toString(),
        employeeId: paymentEmployee.id,
        amount: payment.amount,
        paymentDate: new Date().toISOString().split('T')[0],
        isPaid: true,
        receipt: payment.receipt,
        observations: payment.observations,
        createdAt: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_EMPLOYEE_PAYMENT', payload: newPayment });
      setPaymentEmployee(null);
    }
  };

  const getEmployeePayments = (employeeId: string) => {
    return state.employeePayments.filter(payment => payment.employeeId === employeeId);
  };

  const getLastPayment = (employeeId: string) => {
    const payments = getEmployeePayments(employeeId);
    return payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
  };

  const getNextPaymentDate = (employee: Employee) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let nextPaymentDate = new Date(currentYear, currentMonth, employee.paymentDay);
    
    if (nextPaymentDate <= today) {
      nextPaymentDate = new Date(currentYear, currentMonth + 1, employee.paymentDay);
    }
    
    return nextPaymentDate;
  };

  const canEdit = state.user?.role === 'admin' || state.user?.role === 'financeiro';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
        {canEdit && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Funcionário
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Total de Funcionários</h3>
              <p className="text-blue-700">{state.employees.filter(e => e.isActive).length} ativos</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">Folha de Pagamento</h3>
              <p className="text-green-700">
                R$ {state.employees
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
                {state.employees.filter(e => {
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
        {state.employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cargo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Salário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Dia do Pagamento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Próximo Pagamento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.employees.map(employee => {
                  const nextPayment = getNextPaymentDate(employee);
                  const lastPayment = getLastPayment(employee.id);
                  const today = new Date();
                  const diffDays = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{employee.name}</td>
                      <td className="py-3 px-4 text-sm">{employee.position}</td>
                      <td className="py-3 px-4 text-sm">
                        R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm">Dia {employee.paymentDay}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={
                          diffDays <= 3 ? 'text-red-600 font-medium' :
                          diffDays <= 7 ? 'text-orange-600 font-medium' :
                          'text-gray-900'
                        }>
                          {nextPayment.toLocaleDateString('pt-BR')}
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
                          {canEdit && (
                            <>
                              <button
                                onClick={() => setEditingEmployee(employee)}
                                className="text-green-600 hover:text-green-800"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setPaymentEmployee(employee)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Registrar Pagamento"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-red-600 hover:text-red-800"
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
            {canEdit && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="btn-primary"
              >
                Cadastrar primeiro funcionário
              </button>
            )}
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
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getEmployeePayments(viewingEmployee.id).map(payment => (
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
                            <p className="text-sm text-gray-600">{payment.observations}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payment.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.isPaid ? 'Pago' : 'Pendente'}
                          </span>
                          {payment.receipt && (
                            <p className="text-xs text-blue-600 mt-1">✓ Recibo anexado</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getEmployeePayments(viewingEmployee.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum pagamento registrado.</p>
                  )}
                </div>
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

      {/* Payment Modal */}
      {paymentEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Registrar Pagamento</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handlePayment({
                  amount: parseFloat(formData.get('amount') as string) || paymentEmployee.salary,
                  observations: formData.get('observations') as string || '',
                  receipt: formData.get('receipt') ? 'receipt-uploaded' : undefined
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Funcionário</label>
                    <p className="text-sm text-gray-900 font-medium">{paymentEmployee.name}</p>
                  </div>
                  
                  <div>
                    <label className="form-label">Valor do Pagamento</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      defaultValue={paymentEmployee.salary}
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valor base: R$ {paymentEmployee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. 
                      Edite para incluir comissões, horas extras, etc.
                    </p>
                  </div>
                  
                  <div>
                    <label className="form-label">Observações {formData.amount !== paymentEmployee.salary ? '*' : ''}</label>
                    <textarea
                      name="observations"
                      className="input-field"
                      rows={3}
                      placeholder={
                        "Observações sobre o pagamento..." + 
                        (formData.amount !== paymentEmployee.salary ? " (obrigatório explicar alteração no valor)" : "")
                      }
                      required={formData.amount !== paymentEmployee.salary}
                    />
                    {formData.amount !== paymentEmployee.salary && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Como o valor foi alterado, é obrigatório explicar o motivo (comissão, horas extras, desconto, etc.)
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Recibo de Comprovação</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Anexar recibo (opcional)</p>
                      <input
                        type="file"
                        name="receipt"
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                    </div>
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