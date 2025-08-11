'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Product } from '@/app/lib/types/types';

interface InventoryAnalyticsChartProps {
  productsData: Product[];
  loading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];
const STATUS_COLORS = {
  'In Stock': '#22c55e',
  'Low Stock': '#f59e0b', 
  'Out of Stock': '#ef4444'
};

export function InventoryAnalyticsChart({ productsData, loading }: InventoryAnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (!productsData.length) return { categoryData: [], stockStatusData: [], topValueProducts: [] };

    // Calculate data by category
    const categoryMap = new Map<string, { category: string; totalProducts: number; totalStock: number; totalValue: number }>();
    
    // Calculate stock status data
    const stockStatusMap = new Map<string, number>();
    stockStatusMap.set('In Stock', 0);
    stockStatusMap.set('Low Stock', 0);
    stockStatusMap.set('Out of Stock', 0);

    productsData.forEach(product => {
      const stock = product.stock ?? 0;
      const price = product.price ?? 0;
      const minStockLevel = product.minStockLevel ?? 0;
      const category = product.category || 'Unknown';
      const stockValue = stock * price;
      
      // Category data
      const existing = categoryMap.get(category);
      if (existing) {
        existing.totalProducts += 1;
        existing.totalStock += stock;
        existing.totalValue += stockValue;
      } else {
        categoryMap.set(category, {
          category,
          totalProducts: 1,
          totalStock: stock,
          totalValue: stockValue
        });
      }

      // Stock status data
      let status: string;
      if (stock <= 0) {
        status = 'Out of Stock';
      } else if (stock <= minStockLevel) {
        status = 'Low Stock';
      } else {
        status = 'In Stock';
      }
      stockStatusMap.set(status, (stockStatusMap.get(status) || 0) + 1);
    });

    return {
      categoryData: Array.from(categoryMap.values()).sort((a, b) => b.totalValue - a.totalValue),
      stockStatusData: Array.from(stockStatusMap.entries()).map(([name, value]) => ({ name, value })),
      topValueProducts: productsData
        .map(product => ({
          name: product.name && product.name.length > 20 ? product.name.substring(0, 20) + '...' : (product.name || 'N/A'),
          stock: product.stock ?? 0,
          value: (product.stock ?? 0) * (product.price ?? 0),
          price: product.price ?? 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    };
  }, [productsData]);

  const totalStats = useMemo(() => {
    const totalProducts = productsData.length;
    const totalStock = productsData.reduce((sum, product) => sum + (product.stock ?? 0), 0);
    const totalValue = productsData.reduce((sum, product) => sum + ((product.stock ?? 0) * (product.price ?? 0)), 0);
    const avgStockPerProduct = totalProducts > 0 ? totalStock / totalProducts : 0;
    const lowStockItems = productsData.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.minStockLevel ?? 0)).length;
    const outOfStockItems = productsData.filter(p => (p.stock ?? 0) <= 0).length;

    return {
      totalProducts,
      totalStock,
      totalValue,
      avgStockPerProduct,
      lowStockItems,
      outOfStockItems
    };
  }, [productsData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground">Loading inventory analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!productsData.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground">No inventory data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Stock/Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgStockPerProduct.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalStats.lowStockItems}</div>
            <div className="text-sm text-yellow-700">Products need restocking</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Out of Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalStats.outOfStockItems}</div>
            <div className="text-sm text-red-700">Products out of stock</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="status">Stock Status</TabsTrigger>
          <TabsTrigger value="value">Top Value</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'totalValue' ? `$${Number(value).toFixed(2)}` : value,
                      name === 'totalValue' ? 'Total Value' : 
                      name === 'totalProducts' ? 'Products' : 'Stock Items'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="totalProducts" fill="#8884d8" name="Products" />
                  <Bar dataKey="totalStock" fill="#82ca9d" name="Stock Items" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData.stockStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.topValueProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'value' ? `$${Number(value).toFixed(2)}` : value,
                      name === 'value' ? 'Stock Value' : name === 'stock' ? 'Stock Quantity' : 'Unit Price'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Stock Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Quantity by Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.topValueProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" fill="#82ca9d" name="Stock Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}