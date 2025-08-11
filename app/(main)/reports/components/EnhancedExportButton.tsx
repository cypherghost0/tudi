'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, Product } from '@/app/lib/types/types';

interface ProductSalesData {
  productId: string;
  productName: string;
  category: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  salesCount: number;
}

interface EnhancedExportButtonProps {
  salesData: Sale[];
  productsData: Product[];
}

export function EnhancedExportButton({ salesData, productsData }: EnhancedExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Calculate sales per product
  const calculateProductSales = (): ProductSalesData[] => {
    const productSalesMap = new Map<string, ProductSalesData>();

    salesData.forEach(sale => {
      sale.items.forEach(item => {
        if (!item.productId) return;

        const existing = productSalesMap.get(item.productId);
        const product = productsData.find(p => p.id === item.productId);

        if (existing) {
          existing.totalQuantitySold += item.quantity;
          existing.totalRevenue += item.subtotal;
          existing.salesCount += 1;
          existing.averagePrice = existing.totalRevenue / existing.totalQuantitySold;
        } else {
          productSalesMap.set(item.productId, {
            productId: item.productId,
            productName: item.name,
            category: product?.category || 'Unknown',
            totalQuantitySold: item.quantity,
            totalRevenue: item.subtotal,
            averagePrice: item.price,
            salesCount: 1,
          });
        }
      });
    });

    return Array.from(productSalesMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const productSales = calculateProductSales();
      const totalRevenue = productSales.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalQuantity = productSales.reduce((sum, item) => sum + item.totalQuantitySold, 0);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Product Sales Sheet
      const productSalesData = [
        ['Product Sales Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Product Name', 'Category', 'Quantity Sold', 'Total Revenue', 'Average Price', 'Sales Count'],
        ...productSales.map(item => [
          item.productName,
          item.category,
          item.totalQuantitySold,
          item.totalRevenue,
          item.averagePrice,
          item.salesCount
        ]),
        [''],
        ['TOTALS', '', totalQuantity, totalRevenue, '', '']
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(productSalesData);
      
      // Set column widths
      ws1['!cols'] = [
        { width: 30 }, // Product Name
        { width: 15 }, // Category
        { width: 15 }, // Quantity
        { width: 15 }, // Revenue
        { width: 15 }, // Average Price
        { width: 12 }  // Sales Count
      ];

      // Style the header row
      const headerRow = 5; // 0-indexed
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
        const cellRef = `${col}${headerRow}`;
        if (!ws1[cellRef]) ws1[cellRef] = { t: 's', v: '' };
        ws1[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'CCCCCC' } }
        };
      });

      XLSX.utils.book_append_sheet(wb, ws1, 'Product Sales');

      // Sales Details Sheet
      const salesDetailsData = [
        ['Sales Details'],
        [''],
        ['Date', 'Sale ID', 'Customer', 'Product', 'Quantity', 'Price', 'Subtotal', 'Payment Method'],
        ...salesData.flatMap(sale =>
          sale.items.map(item => {
            // Handle different timestamp formats
            let saleDate;
            if (sale.timestamp && typeof sale.timestamp === 'object' && 'seconds' in sale.timestamp) {
              saleDate = new Date(sale.timestamp.seconds * 1000);
            } else if (sale.date) {
              saleDate = new Date(sale.date);
            } else {
              saleDate = new Date();
            }
            
            return [
              saleDate.toLocaleDateString(),
              sale.id,
              sale.customerInfo?.name || 'Walk-in',
              item.name,
              item.quantity,
              item.price,
              item.subtotal,
              sale.paymentMethod
            ];
          })
        )
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(salesDetailsData);
      ws2['!cols'] = [
        { width: 12 }, // Date
        { width: 15 }, // Sale ID
        { width: 20 }, // Customer
        { width: 30 }, // Product
        { width: 10 }, // Quantity
        { width: 12 }, // Price
        { width: 12 }, // Subtotal
        { width: 15 }  // Payment Method
      ];

      XLSX.utils.book_append_sheet(wb, ws2, 'Sales Details');

      // Generate filename
      const filename = `sales-report-all-time-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      toast.success('Excel report exported successfully!');
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
      const productSales = calculateProductSales();
      const totalRevenue = productSales.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalQuantity = productSales.reduce((sum, item) => sum + item.totalQuantitySold, 0);

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Product Sales Report', 20, 20);
      
      // Date info
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

      // Product Sales Table
      autoTable(doc, {
        startY: 45,
        head: [['Product Name', 'Category', 'Qty Sold', 'Total Revenue', 'Avg Price', 'Sales Count']],
        body: productSales.map(item => [
          item.productName,
          item.category,
          item.totalQuantitySold.toString(),
          `$${item.totalRevenue.toFixed(2)}`,
          `$${item.averagePrice.toFixed(2)}`,
          item.salesCount.toString()
        ]),
        foot: [['TOTALS', '', totalQuantity.toString(), `$${totalRevenue.toFixed(2)}`, '', '']],
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        }
      });

      // Summary section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = ((doc as any).lastAutoTable?.finalY || 200) + 20;
      doc.setFontSize(14);
      doc.text('Summary', 20, finalY);
      doc.setFontSize(10);
      doc.text(`Total Products Sold: ${productSales.length}`, 20, finalY + 15);
      doc.text(`Total Quantity Sold: ${totalQuantity}`, 20, finalY + 25);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, finalY + 35);
      doc.text(`Average Revenue per Product: $${(totalRevenue / productSales.length).toFixed(2)}`, 20, finalY + 45);

      // Generate filename
      const filename = `sales-report-all-time-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save file
      doc.save(filename);
      
      toast.success('PDF report exported successfully!');
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
      const productSales = calculateProductSales();
      
      // Create chart data in JSON format
      const chartData = {
        title: 'Product Sales Analysis',
        generatedOn: new Date().toISOString(),
        data: productSales,
        summary: {
          totalProducts: productSales.length,
          totalQuantity: productSales.reduce((sum, item) => sum + item.totalQuantitySold, 0),
          totalRevenue: productSales.reduce((sum, item) => sum + item.totalRevenue, 0),
        }
      };

      // Download as JSON for chart applications
      const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-chart-data-${new Date().toISOString().split('T')[0]}.json`;
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

  const hasData = salesData.length > 0;

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