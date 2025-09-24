import React, { useState } from 'react';
import { Download, Printer, FileText, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  filters: {
    startDate: string;
    endDate: string;
    categories?: string[];
    methods?: string[];
    status?: string;
  };
  data: any;
}

export function ExportButtons({ filters, data }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const buildQueryString = (autoprint: boolean = false) => {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status || 'all',
      user: 'Sistema RevGold',
      auto: autoprint ? '1' : '0'
    });

    if (filters.categories && filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }

    if (filters.methods && filters.methods.length > 0) {
      params.set('methods', filters.methods.join(','));
    }

    return params.toString();
  };

  const openClientPrint = () => {
    const queryString = buildQueryString(true);
    const printUrl = `/print/reports?${queryString}`;
    
    // Open in new window for printing
    const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes');
    
    if (printWindow) {
      printWindow.focus();
    } else {
      alert('Por favor, permita pop-ups para abrir a janela de impressão.');
    }
  };

  const exportServerPDF = async () => {
    setIsExporting(true);
    
    try {
      const queryString = buildQueryString(false);
      const response = await fetch(`/api/export/pdf?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Falha ao gerar PDF no servidor');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_RevGold_${filters.startDate}_${filters.endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erro ao exportar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsExporting(false);
    }
  };

  const previewReport = () => {
    const queryString = buildQueryString(false);
    const previewUrl = `/print/reports?${queryString}`;
    
    // Open in new tab for preview
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={previewReport}
        className="btn-secondary flex items-center gap-2"
        title="Visualizar Relatório Completo - Todas as informações detalhadas"
      >
        <FileText className="w-5 h-5" />
        Visualizar Relatório Completo
      </button>
      
      <button
        onClick={openClientPrint}
        className="btn-primary flex items-center gap-2"
        title="Exportar PDF Completo - Relatório detalhado com todas as informações"
      >
        <Printer className="w-5 h-5" />
        Exportar PDF Completo
      </button>
      
      <button
        onClick={exportServerPDF}
        disabled={isExporting}
        className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        title="Exportar PDF Profissional - Relatório completo gerado no servidor"
      >
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {isExporting ? 'Gerando Relatório...' : 'PDF Profissional'}
      </button>
    </div>
  );
}