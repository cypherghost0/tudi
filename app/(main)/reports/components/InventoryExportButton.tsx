'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '@/app/lib/types/types';

interface InventoryExportButtonProps {
  productsData: Product[];
}

export function InventoryExportButton({ productsData }: InventoryExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const inventoryData = productsData.map(product => ({
        ...product,
        name: product.name || 'N/A',
        category: product.category || 'N/A',
        stock: product.stock ?? 0,
        minStockLevel: product.minStockLevel ?? 0,
        price: product.price ?? 0,
        stockValue: (product.stock ?? 0) * (product.price ?? 0),
        stockStatus: (product.stock ?? 0) <= 0 ? 'Out of Stock' :
                    (product.stock ?? 0) <= (product.minStockLevel ?? 0) ? 'Low Stock' : 'In Stock'
      }));

      const totalValue = inventoryData.reduce((sum, item) => sum + item.stockValue, 0);
      const totalStock = inventoryData.reduce((sum, item) => sum + item.stock, 0);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Inventory Report Sheet
      const inventoryReportData = [
        ['Inventory Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Product Name', 'Category', 'Current Stock', 'Min Stock Level', 'Unit Price', 'Stock Value', 'Status'],
        ...inventoryData.map(item => [
          item.name,
          item.category,
          item.stock,
          item.minStockLevel,
          item.price,
          item.stockValue,
          item.stockStatus
        ]),
        [''],
        ['TOTALS', '', '', totalStock, '', '', totalValue, '']
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(inventoryReportData);
      
      // Set column widths
      ws1['!cols'] = [
        { width: 30 }, // Product Name
        { width: 15 }, // Category
        { width: 15 }, // Current Stock
        { width: 15 }, // Min Stock Level
        { width: 12 }, // Unit Price
        { width: 15 }, // Stock Value
        { width: 15 }  // Status
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'Inventory Report');

      // Stock Status Summary Sheet
      const statusSummary = inventoryData.reduce((acc, item) => {
        acc[item.stockStatus] = (acc[item.stockStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusSummaryData = [
        ['Stock Status Summary'],
        [''],
        ['Status', 'Count'],
        ...Object.entries(statusSummary).map(([status, count]) => [status, count])
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(statusSummaryData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Stock Status');

      // Category Summary Sheet
      const categoryMap = new Map<string, { count: number; totalValue: number; totalStock: number }>();
      inventoryData.forEach(item => {
        const existing = categoryMap.get(item.category);
        if (existing) {
          existing.count += 1;
          existing.totalValue += item.stockValue;
          existing.totalStock += item.stock;
        } else {
          categoryMap.set(item.category, {
            count: 1,
            totalValue: item.stockValue,
            totalStock: item.stock
          });
        }
      });

      const categorySummaryData = [
        ['Category Summary'],
        [''],
        ['Category', 'Product Count', 'Total Stock', 'Total Value'],
        ...Array.from(categoryMap.entries()).map(([category, data]) => [
          category, data.count, data.totalStock, data.totalValue
        ])
      ];

      const ws3 = XLSX.utils.aoa_to_sheet(categorySummaryData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Category Summary');

      // Generate filename
      const filename = `inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      toast.success('Excel inventory report exported successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const inventoryData = productsData.map(product => ({
        ...product,
        name: product.name || 'N/A',
        category: product.category || 'N/A',
        stock: product.stock ?? 0,
        minStockLevel: product.minStockLevel ?? 0,
        price: product.price ?? 0,
        stockValue: (product.stock ?? 0) * (product.price ?? 0),
        stockStatus: (product.stock ?? 0) <= 0 ? 'Out of Stock' :
                    (product.stock ?? 0) <= (product.minStockLevel ?? 0) ? 'Low Stock' : 'In Stock'
      }));

      const totalValue = inventoryData.reduce((sum, item) => sum + item.stockValue, 0);
      const totalStock = inventoryData.reduce((sum, item) => sum + item.stock, 0);

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Inventory Report', 20, 20);
      
      // Date info
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

      // Inventory Table
      autoTable(doc, {
        startY: 45,
        head: [['Product Name', 'Category', 'Stock', 'Min Stock', 'Unit Price', 'Stock Value', 'Status']],
        body: inventoryData.map(item => [
          item.name && item.name.length > 20 ? item.name.substring(0, 20) + '...' : (item.name || 'N/A'),
          item.category || 'N/A',
          (item.stock ?? 0).toString(),
          (item.minStockLevel ?? 0).toString(),
          `$${(item.price ?? 0).toFixed(2)}`,
          `$${(item.stockValue ?? 0).toFixed(2)}`,
          item.stockStatus || 'Unknown'
        ]),
        foot: [['TOTALS', '', '', totalStock.toString(), '', '', `$${totalValue.toFixed(2)}`, '']],
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 18 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        }
      });

      // Summary section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = ((doc as any).lastAutoTable?.finalY || 200) + 20;
      doc.setFontSize(14);
      doc.text('Summary', 20, finalY);
      doc.setFontSize(10);
      
      const inStock = inventoryData.filter(item => item.stockStatus === 'In Stock').length;
      const lowStock = inventoryData.filter(item => item.stockStatus === 'Low Stock').length;
      const outOfStock = inventoryData.filter(item => item.stockStatus === 'Out of Stock').length;
      
      doc.text(`Total Products: ${inventoryData.length}`, 20, finalY + 15);
      doc.text(`Total Stock Items: ${totalStock}`, 20, finalY + 25);
      doc.text(`Total Stock Value: $${totalValue.toFixed(2)}`, 20, finalY + 35);
      doc.text(`In Stock: ${inStock} | Low Stock: ${lowStock} | Out of Stock: ${outOfStock}`, 20, finalY + 45);

      // Generate filename
      const filename = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save file
      doc.save(filename);
      
      toast.success('PDF inventory report exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportChartData = () => {
    setIsExporting(true);
    try {
      const inventoryData = productsData.map(product => ({
        ...product,
        name: product.name || 'N/A',
        category: product.category || 'N/A',
        stock: product.stock ?? 0,
        minStockLevel: product.minStockLevel ?? 0,
        price: product.price ?? 0,
        stockValue: (product.stock ?? 0) * (product.price ?? 0),
        stockStatus: (product.stock ?? 0) <= 0 ? 'Out of Stock' :
                    (product.stock ?? 0) <= (product.minStockLevel ?? 0) ? 'Low Stock' : 'In Stock'
      }));
      
      // Create chart data in JSON format
      const chartData = {
        title: 'Inventory Analysis',
        generatedOn: new Date().toISOString(),
        data: inventoryData,
        summary: {
          totalProducts: inventoryData.length,
          totalStock: inventoryData.reduce((sum, item) => sum + item.stock, 0),
          totalValue: inventoryData.reduce((sum, item) => sum + item.stockValue, 0),
          inStock: inventoryData.filter(item => item.stockStatus === 'In Stock').length,
          lowStock: inventoryData.filter(item => item.stockStatus === 'Low Stock').length,
          outOfStock: inventoryData.filter(item => item.stockStatus === 'Out of Stock').length,
        }
      };

      // Download as JSON for chart applications
      const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-chart-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Chart data exported successfully!');
    } catch (error) {
      console.error('Chart export error:', error);
      toast.error('Failed to export chart data');
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = productsData.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={!hasData || isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Export to PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportChartData} disabled={isExporting}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Export Chart Data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}