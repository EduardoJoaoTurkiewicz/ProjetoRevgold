import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Receipt, Download, FileText } from 'lucide-react';

export const Reports: React.FC = () => {
  const { state } = useApp();
  const { sales, debts, checks, employees, boletos } = state;

  const today = new Date().toDateString();
  
  // Recebimentos de hoje
  const todayReceipts = [
    ...sales.filter(sale => new Date(sale.date).toDateString() === today),
    ...checks.filter(check => new Date(check.dueDate).toDateString() === today && check.status === 'compensado')
  ];

  // Gastos de hoje
  const todayExpenses = [
    ...debts.filter(debt => new Date(debt.date).toDateString() === today),
    ...state.employeePayments.filter(payment => new Date(payment.paymentDate).toDateString() === today)
  ];

  const totalReceipts = todayReceipts.reduce((sum, item) => {
    if ('totalValue' in item) return sum + item.totalValue;
    if ('value' in item) return sum + item.value;
    return sum;
  }, 0);

  const totalExpenses = todayExpenses.reduce((sum, item) => {
    if ('totalValue' in item) return sum + item.totalValue;
    if ('amount' in item) return sum + item.amount;
    return sum;
  }, 0);

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('reports-content');
      if (!element) return;

      // Create a temporary container with better styling for PDF
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '20px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Clone the content
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Remove interactive elements and adjust styles for PDF
      const buttons = clonedElement.querySelectorAll('button');
      buttons.forEach(btn => btn.remove());
      
      // Adjust card styles for PDF
      const cards = clonedElement.querySelectorAll('.card');
      cards.forEach(card => {
        (card as HTMLElement).style.backgroundColor = 'white';
        (card as HTMLElement).style.border = '1px solid #d1d5db';
        (card as HTMLElement).style.borderRadius = '8px';
        (card as HTMLElement).style.padding = '16px';
        (card as HTMLElement).style.marginBottom = '16px';
        (card as HTMLElement).style.boxShadow = 'none';
      });
      
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Generate canvas from the temporary container
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white'
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(21, 128, 61); // Green color
      pdf.text('RevGold - Relatório Financeiro', 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 30);
      pdf.text(`Usuário: ${state.user?.username}`, 20, 40);
      
      // Add content
      pdf.addImage(imgData, 'PNG', 0, 50, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `RevGold_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      alert('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 rounded-lg p-6 text-white professional-shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm animate-gentle-float">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Relatórios</h1>
              <p className="text-green-100 text-lg">Análise financeira detalhada</p>
            </div>
          </div>
          <div>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium professional-shadow transition-all duration-300 professional-hover"
            >
              <Download className="w-5 h-5" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      <div id="reports-content">
      {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recebimentos de Hoje */}
          <div className="card professional-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg animate-gentle-float">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
                <h3 className="text-lg font-bold text-gray-800">Recebimentos de Hoje</h3>
            </div>
              <span className="text-xl font-bold text-green-600">
              R$ {totalReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-3">
            {todayReceipts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum recebimento hoje</p>
            ) : (
              todayReceipts.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg professional-hover">
                  <div>
                    <p className="font-medium text-gray-800">
                      {'client' in item ? item.client : 'Cliente'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {'products' in item ? 'Venda' : 'Cheque'}
                    </p>
                  </div>
                  <span className="font-bold text-green-600">
                    R$ {('totalValue' in item ? item.totalValue : item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
          </div>

        {/* Gastos de Hoje */}
          <div className="card professional-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg animate-gentle-float">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
                <h3 className="text-lg font-bold text-gray-800">Gastos de Hoje</h3>
            </div>
              <span className="text-xl font-bold text-red-600">
              R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-3">
            {todayExpenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum gasto hoje</p>
            ) : (
              todayExpenses.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg professional-hover">
                  <div>
                    <p className="font-medium text-gray-800">
                      {'company' in item ? item.company : 'Pagamento'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {'description' in item ? item.description : 'Salário'}
                    </p>
                  </div>
                  <span className="font-bold text-red-600">
                    R$ {('totalValue' in item ? item.totalValue : item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
          </div>
      </div>

      {/* Relatórios Detalhados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas do Mês */}
          <div className="card">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg animate-gentle-float">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
              <h3 className="text-lg font-bold text-gray-800">Vendas do Mês</h3>
          </div>
          
          <div className="space-y-3">
            {sales.slice(0, 5).map((sale, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg professional-hover">
                <div>
                  <p className="font-medium text-gray-800">{sale.client}</p>
                  <p className="text-sm text-gray-600">
                    {Array.isArray(sale.products) 
                      ? sale.products.map(p => p.name).join(', ')
                      : 'Produtos'}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="font-bold text-blue-600">
                  R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
          </div>

        {/* Dívidas Pendentes */}
          <div className="card">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg animate-gentle-float">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
              <h3 className="text-lg font-bold text-gray-800">Dívidas Pendentes</h3>
          </div>
          
          <div className="space-y-3">
            {debts.filter(debt => !debt.isPaid).slice(0, 5).map((debt, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg professional-hover">
                <div>
                  <p className="font-medium text-gray-800">{debt.company}</p>
                  <p className="text-sm text-gray-600">{debt.description}</p>
                  <p className="text-xs text-gray-500">Data: {new Date(debt.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="font-bold text-orange-600">
                  R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
          </div>
      </div>

      {/* Resumo Mensal */}
        <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-200 rounded-lg animate-gentle-float">
              <Users className="w-6 h-6 text-green-700" />
          </div>
            <h3 className="text-lg font-bold text-green-900">Resumo Mensal</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
              {sales.length}
            </p>
              <p className="text-green-700 font-medium">Vendas</p>
          </div>
          <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
              {debts.length}
            </p>
              <p className="text-green-700 font-medium">Dívidas</p>
          </div>
          <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
              {checks.length}
            </p>
              <p className="text-green-700 font-medium">Cheques</p>
          </div>
          <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
              {employees.length}
            </p>
              <p className="text-green-700 font-medium">Funcionários</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};