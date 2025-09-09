import React, { useState } from 'react';
import { Play, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SalesDebugger } from '../lib/debugUtils';
import { isValidUUID } from '../lib/debugUtils';
import { ErrorHandler } from '../lib/errorHandler';

interface TestSaleCreationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TestSaleCreation({ isOpen, onClose }: TestSaleCreationProps) {
  const { employees, createSale } = useAppContext();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Venda Básica - Dinheiro',
        payload: {
          client: 'Cliente Teste 1',
          date: new Date().toISOString().split('T')[0],
          totalValue: 100.00,
          paymentMethods: [
            { type: 'dinheiro', amount: 100.00 }
          ],
          receivedAmount: 100.00,
          pendingAmount: 0,
          status: 'pago'
        }
      },
      {
        name: 'Venda com Vendedor',
        payload: {
          client: 'Cliente Teste 2',
          date: new Date().toISOString().split('T')[0],
          sellerId: employees.find(e => e.isSeller && e.isActive)?.id || null,
          totalValue: 250.00,
          paymentMethods: [
            { type: 'pix', amount: 250.00 }
          ],
          receivedAmount: 250.00,
          pendingAmount: 0,
          status: 'pago',
          customCommissionRate: 5.00
        }
      },
      {
        name: 'Venda Parcelada - Cartão',
        payload: {
          client: 'Cliente Teste 3',
          date: new Date().toISOString().split('T')[0],
          totalValue: 500.00,
          paymentMethods: [
            { 
              type: 'cartao_credito', 
              amount: 500.00,
              installments: 3,
              installmentValue: 166.67,
              installmentInterval: 30
            }
          ],
          receivedAmount: 0,
          pendingAmount: 500.00,
          status: 'pendente'
        }
      },
      {
        name: 'Venda Mista - Múltiplos Métodos',
        payload: {
          client: 'Cliente Teste 4',
          date: new Date().toISOString().split('T')[0],
          totalValue: 1000.00,
          paymentMethods: [
            { type: 'dinheiro', amount: 300.00 },
            { type: 'pix', amount: 200.00 },
            { type: 'cheque', amount: 500.00, installments: 2, installmentValue: 250.00 }
          ],
          receivedAmount: 500.00,
          pendingAmount: 500.00,
          status: 'parcial'
        }
      },
      {
        name: 'Teste de Erro - Cliente Vazio',
        payload: {
          client: '',
          date: new Date().toISOString().split('T')[0],
          totalValue: 100.00,
          paymentMethods: [
            { type: 'dinheiro', amount: 100.00 }
          ]
        },
        shouldFail: true
      },
      {
        name: 'Teste de Erro - UUID Inválido',
        payload: {
          client: 'Cliente Teste 5',
          sellerId: 'invalid-uuid-string',
          date: new Date().toISOString().split('T')[0],
          totalValue: 100.00,
          paymentMethods: [
            { type: 'dinheiro', amount: 100.00 }
          ]
        },
        shouldFail: true
      }
    ];

    for (const test of tests) {
      try {
        console.log(`🧪 Running test: ${test.name}`);
        
        const startTime = Date.now();
        const result = await createSale(test.payload);
        const duration = Date.now() - startTime;
        
        setTestResults(prev => [...prev, {
          name: test.name,
          success: !test.shouldFail,
          result: result,
          duration: duration,
          payload: test.payload,
          error: test.shouldFail ? 'Expected to fail but succeeded' : null
        }]);
        
      } catch (error) {
        ErrorHandler.logProjectError(error, `Test: ${test.name}`);
        const duration = Date.now() - Date.now();
        
        setTestResults(prev => [...prev, {
          name: test.name,
          success: test.shouldFail,
          result: null,
          duration: duration,
          payload: test.payload,
          error: ErrorHandler.handleSupabaseError(error)
        }]);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[200] backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Teste de Criação de Vendas</h2>
                <p className="text-slate-600">Executa testes automatizados para validar o sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="btn-primary flex items-center gap-2"
            >
              <Play className={`w-5 h-5 ${isRunning ? 'animate-pulse' : ''}`} />
              {isRunning ? 'Executando Testes...' : 'Executar Testes'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Resultados dos Testes</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl border ${
                      result.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900">{result.name}</h4>
                          <p className="text-sm text-slate-600">
                            Duração: {result.duration}ms
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        result.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.success ? 'PASSOU' : 'FALHOU'}
                      </span>
                    </div>

                    {result.result && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-green-800">
                          Sale ID criado: {result.result}
                        </p>
                      </div>
                    )}

                    {result.error && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-red-800 mb-2">Erro:</p>
                        <p className="text-sm text-red-700 bg-red-100 p-3 rounded-lg font-mono">
                          {result.error}
                        </p>
                      </div>
                    )}

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-slate-900">
                        Ver Payload do Teste
                      </summary>
                      <pre className="mt-2 text-xs bg-slate-100 p-4 rounded-lg overflow-x-auto text-slate-700 font-mono">
                        {JSON.stringify(result.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Resumo dos Testes</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-black text-blue-700">
                      {testResults.length}
                    </p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-green-700">
                      {testResults.filter(r => r.success).length}
                    </p>
                    <p className="text-sm text-green-600">Passou</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-red-700">
                      {testResults.filter(r => !r.success).length}
                    </p>
                    <p className="text-sm text-red-600">Falhou</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}