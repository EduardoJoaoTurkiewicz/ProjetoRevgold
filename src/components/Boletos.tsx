import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BoletoForm } from './forms/BoletoForm';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
import { Boleto } from '../types';

export function Boletos() {
  const { state, createBoleto, updateBoleto } = useApp();
  const [showForm, setShowForm] = useState(false);

  const boletos = state.boletos || [];

  const handleAddBoleto = async (boletoData: Omit<Boleto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createBoleto(boletoData);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating boleto:', error);
    }
  };

  const toggleStatus = async (id: string) => {
    const boleto = boletos.find(b => b.id === id);
    if (!boleto) return;

    const newStatus = boleto.status === 'pendente' ? 'compensado' : 'pendente';
    const updatedBoleto = { ...boleto, status: newStatus };
    try {
      await updateBoleto(updatedBoleto);
    } catch (error) {
      console.error('Error updating boleto status:', error);
    }
  };

  const totalPending = boletos
    .filter(boleto => boleto.status === 'pendente')
    .reduce((sum, boleto) => sum + boleto.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Boletos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Boleto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Boletos</p>
              <p className="text-2xl font-bold text-gray-900">{boletos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {boletos.filter(b => b.status === 'pendente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Pendente</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalPending.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Lista de Boletos
          </h3>
          
          {boletos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum boleto cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boletos.map((boleto) => (
                    <tr key={boleto.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {boleto.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {boleto.value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(boleto.due_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          boleto.status === 'compensado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {boleto.status === 'compensado' ? 'Compensado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleStatus(boleto.id)}
                          className={`${
                            boleto.status === 'compensado' 
                              ? 'text-yellow-600 hover:text-yellow-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {boleto.status === 'compensado' ? 'Marcar Pendente' : 'Marcar Compensado'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <BoletoForm
          onSubmit={handleAddBoleto}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}