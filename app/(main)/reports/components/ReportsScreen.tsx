import React, { useEffect, useState } from "react";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { EnhancedReportsTable } from "./EnhancedReportsTable";
import { EnhancedExportButton } from "./EnhancedExportButton";
import { EnhancedAnalyticsChart } from "./EnhancedAnalyticsChart";
import { InventoryReportTable } from "./InventoryReportTable";
import { InventoryAnalyticsChart } from "./InventoryAnalyticsChart";
import { InventoryExportButton } from "./InventoryExportButton";
import { getSalesStats } from "@/app/lib/firebase/sales";
import { getProducts } from "@/app/lib/firebase/products";
import { Sale, Product } from "@/app/lib/types/types";

export function ReportsScreen() {
  const [reportType, setReportType] = useState<'sales' | 'inventory'>('sales');
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Always fetch products data for both sales and inventory analysis
        const products = await getProducts();
        setProductsData(products);
        
        if (reportType === 'sales') {
          // Fetch all sales data without date filtering
          const stats = await getSalesStats();
          setSalesData(stats.sales);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportType]);

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {reportType === 'sales' ? 'Analyses et rapports de ventes' : 'Inventory Analytics & Reports'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <ReportTypeSelector
            value={reportType}
            onChange={setReportType}
          />
          {reportType === 'sales' ? (
            <EnhancedExportButton
              salesData={salesData}
              productsData={productsData}
            />
          ) : (
            <InventoryExportButton
              productsData={productsData}
            />
          )}
        </div>
      </div>

      {reportType === 'sales' ? (
        <>
          <EnhancedAnalyticsChart
            salesData={salesData}
            productsData={productsData}
            loading={loading}
          />
          <EnhancedReportsTable
            salesData={salesData}
            productsData={productsData}
            loading={loading}
          />
        </>
      ) : (
        <>
          <InventoryAnalyticsChart
            productsData={productsData}
            loading={loading}
          />
          <InventoryReportTable
            productsData={productsData}
            loading={loading}
          />
        </>
      )}
    </div>
  );
} 