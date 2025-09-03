// Legacy PDF export - replaced with new comprehensive system
// See src/components/reports/PrintableReport.tsx for the new implementation

export function openPrintPreview(filters: any) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    status: filters.status || 'all',
    user: 'Sistema RevGold'
  });

  if (filters.categories && filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }

  if (filters.methods && filters.methods.length > 0) {
    params.set('methods', filters.methods.join(','));
  }

  const printUrl = `/print/reports?${params.toString()}`;
  window.open(printUrl, '_blank');
}