import React from "react";
import { Sale, Product } from "@/app/lib/types/types";

interface ReportsTableProps {
  data: Sale[] | Product[];
  type: 'sales' | 'inventory';
  loading: boolean;
}

export function ReportsTable({ data, type, loading }: ReportsTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto py-2">
        <div className="flex items-center justify-center py-8">
          <span className="text-muted-foreground">Loading table data...</span>
        </div>
      </div>
    );
  }

  if (type === 'sales') {
    const salesData = data as Sale[];
    return (
      <div className="overflow-x-auto py-2">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Customer</th>
              <th className="px-4 py-2 border">Total</th>
              <th className="px-4 py-2 border">Payment Method</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((sale) => (
              <tr key={sale.id}>
                <td className="px-4 py-2 border">
                  {new Date(sale.timestamp.seconds * 1000).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border">{sale.id}</td>
                <td className="px-4 py-2 border">{sale.customerInfo?.name || 'N/A'}</td>
                <td className="px-4 py-2 border">${sale.finalTotal.toFixed(2)}</td>
                <td className="px-4 py-2 border">{sale.paymentMethod}</td>
                <td className="px-4 py-2 border">{sale.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else {
    const inventoryData = data as Product[];
    return (
      <div className="overflow-x-auto py-2">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Price</th>
              <th className="px-4 py-2 border">Stock</th>
              <th className="px-4 py-2 border">Min Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-2 border">{product.name}</td>
                <td className="px-4 py-2 border">{product.category}</td>
                <td className="px-4 py-2 border">${product.price.toFixed(2)}</td>
                <td className="px-4 py-2 border">{product.stock}</td>
                <td className="px-4 py-2 border">{product.minStockLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}