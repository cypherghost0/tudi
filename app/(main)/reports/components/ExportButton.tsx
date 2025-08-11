import React from "react";
import { toast } from "sonner";
import { Sale, Product } from "@/app/lib/types/types";

function toCSV(rows: Sale[] | Product[], type: 'sales' | 'inventory'): string {
  if (!rows.length) return '';
  let headers: string[] = [];
  let csvRows: string[] = [];

  if (type === 'sales') {
    headers = [
      'Date', 'ID', 'Total', 'Tax', 'Final Total', 'Payment Method', 'Sold By', 'Customer', 'Status'
    ];
    csvRows = (rows as Sale[]).map((row) => [
      new Date(row.timestamp.seconds * 1000).toISOString().slice(0, 10),
      row.id,
      row.total,
      row.tax,
      row.finalTotal,
      row.paymentMethod,
      row.soldByName,
      row.customerInfo?.name || '',
      row.status
    ].join(','));
  } else {
    headers = [
      'ID', 'Name', 'Category', 'Price', 'Stock', 'Min Stock', 'Supplier'
    ];
    csvRows = (rows as Product[]).map((row) => [
      row.id,
      row.name,
      row.category,
      row.price,
      row.stock,
      row.minStockLevel,
      row.supplier || ''
    ].join(','));
  }
  return [headers.join(','), ...csvRows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ data, type }: { data: Sale[] | Product[]; type: 'sales' | 'inventory' }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export!');
      console.warn('Export attempted with empty data:', data);
      return;
    }
    const csv = toCSV(data, type);
    const filename = type === 'sales' ? 'sales-report.csv' : 'inventory-report.csv';
    downloadCSV(csv, filename);
    toast.success('Export started!');
    console.log('Exported data:', data);
  };

  return (
    <div className="py-2">
      <button
        className="rounded border px-4 py-2 bg-primary text-primary-foreground font-medium hover:bg-primary/80"
        onClick={handleExport}
        disabled={!data || data.length === 0}
      >
        Export
      </button>
    </div>
  );
} 