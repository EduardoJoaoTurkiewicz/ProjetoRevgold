import React from 'react';
import { FileText, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Visualize e analise os dados do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas do Mês</p>
              <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Boletos Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crescimento</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Período</p>
              <p className="text-2xl font-bold text-gray-900">30d</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Disponíveis</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Relatório de Vendas</h3>
              <p className="text-sm text-gray-600">Análise detalhada das vendas por período</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Gerar
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Relatório Financeiro</h3>
              <p className="text-sm text-gray-600">Resumo das movimentações financeiras</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Gerar
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Relatório de Funcionários</h3>
              <p className="text-sm text-gray-600">Dados sobre funcionários e folha de pagamento</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Gerar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}