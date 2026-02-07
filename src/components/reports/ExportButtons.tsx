import React, { useState } from 'react';
import { Download, Printer, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
    try {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status || 'all',
      reportType: (filters as any).reportType || 'comprehensive',
      user: 'Sistema Montreal Tintas',
      auto: autoprint ? '1' : '0'
    });

    if (filters.categories && filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }

    if (filters.methods && filters.methods.length > 0) {
      params.set('methods', filters.methods.join(','));
    }

    return params.toString();
    } catch (error) {
      console.error('Error building query string:', error);
      toast.error('Erro ao preparar parâmetros do relatório');
      return '';
    }
  };

  const openClientPrint = () => {
    try {
      const queryString = buildQueryString(true);
      if (!queryString) return;
      
      const printUrl = `/print/reports?${queryString}`;
      
      // Create a temporary iframe to load and print the report
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.src = printUrl;
      
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          // Wait for content to fully load
          setTimeout(() => {
            // Open the content in a new window for printing
            const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            if (printWindow) {
              printWindow.document.write(iframe.contentDocument?.documentElement.outerHTML || '');
              printWindow.document.close();
              
              // Wait for images and content to load in the new window
              setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                
                // Close the window after printing
                printWindow.addEventListener('afterprint', () => {
                  printWindow.close();
                });
              }, 1000);
              
              toast.success('Relatório aberto para impressão');
            } else {
              toast.error('Por favor, permita pop-ups para abrir a janela de impressão.');
            }
            
            // Clean up the iframe
            document.body.removeChild(iframe);
          }, 2000);
        } catch (error) {
          console.error('Error in print process:', error);
          toast.error('Erro ao preparar impressão');
          document.body.removeChild(iframe);
        }
      };
      
      iframe.onerror = () => {
        toast.error('Erro ao carregar relatório');
        document.body.removeChild(iframe);
      };
      
      toast.success('Preparando relatório para impressão...');
    } catch (error) {
      console.error('Error opening print window:', error);
      toast.error('Erro ao abrir janela de impressão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const exportServerPDF = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      const queryString = buildQueryString(false);
      if (!queryString) {
        throw new Error('Falha ao preparar parâmetros do relatório');
      }
      
      const response = await fetch(`/api/export/pdf?${queryString}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Resposta inválida do servidor');
        throw new Error(`Falha ao gerar PDF no servidor: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('PDF gerado está vazio');
      }
      
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_MontrealTintas_${filters.startDate.replace(/-/g, '')}_${filters.endDate.replace(/-/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast.success('PDF exportado com sucesso!');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao exportar PDF: ' + errorMessage);
      
      // Fallback to client-side print if server export fails
      if (errorMessage.includes('servidor') || errorMessage.includes('fetch')) {
        toast.info('Tentando exportação alternativa...');
        setTimeout(() => {
          openClientPrint();
        }, 1000);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const previewReport = () => {
    try {
      const queryString = buildQueryString(false);
      if (!queryString) return;
      
      const previewUrl = `/print/reports?${queryString}`;
      
      // Create a more reliable preview window
      const previewWindow = window.open('about:blank', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes');
      
      if (previewWindow) {
        // Set the location after the window is created
        previewWindow.location.href = previewUrl;
        
        // Focus the window
        setTimeout(() => {
          previewWindow.focus();
        }, 500);
        
        toast.success('Visualização do relatório aberta');
      } else {
        toast.error('Por favor, permita pop-ups para visualizar o relatório');
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      toast.error('Erro ao abrir visualização: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={previewReport}
        className="btn-secondary flex items-center gap-2"
        title="Visualizar como ficará o PDF"
      >
        <FileText className="w-5 h-5" />
        Visualizar PDF
      </button>
      
      <button
        onClick={openClientPrint}
        className="btn-primary flex items-center gap-2"
        title="Exportar PDF (Cliente) - Abre janela de impressão do navegador"
      >
        <Printer className="w-5 h-5" />
        Exportar PDF (Cliente)
      </button>
      
      <button
        onClick={exportServerPDF}
        disabled={isExporting}
        className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        title="Exportar PDF (Servidor) - Gera PDF profissional no servidor"
      >
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {isExporting ? 'Gerando...' : 'Exportar PDF (Servidor)'}
      </button>
    </div>
  );
}