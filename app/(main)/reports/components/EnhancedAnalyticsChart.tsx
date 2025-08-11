'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Sale, Product } from '@/app/lib/types/types';

interface ProductSalesData {
  productName: string;
  category: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  salesCount: number;
}

interface EnhancedAnalyticsChartProps {
  salesData: Sale[];
  productsData: Product[];
  loading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function EnhancedAnalyticsChart({ salesData, productsData, loading }: EnhancedAnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (!salesData.length) return { productSales: [], categorySales: [], dailySales: [] };

    // Calculate sales per product
    const productSalesMap = new Map<string, ProductSalesData>();
    const categorySalesMap = new Map<string, { category: string; totalRevenue: number; totalQuantity: number }>();
    const dailySalesMap = new Map<string, { date: string; revenue: number; sales: number }>();

    salesData.forEach(sale => {
      // Handle different timestamp formats
      let saleDate;
      if (sale.timestamp && typeof sale.timestamp === 'object' && 'seconds' in sale.timestamp) {
        saleDate = new Date(sale.timestamp.seconds * 1000).toISOString().split('T')[0];
      } else if (sale.date) {
        saleDate = new Date(sale.date).toISOString().split('T')[0];
      } else {
        saleDate = new Date().toISOString().split('T')[0];
      }
      
      // Daily sales
      const existingDaily = dailySalesMap.get(saleDate);
      if (existingDaily) {
        existingDaily.revenue += sale.finalTotal;
        existingDaily.sales += 1;
      } else {
        dailySalesMap.set(saleDate, {
          date: saleDate,
          revenue: sale.finalTotal,
          sales: 1
        });
      }

      sale.items.forEach(item => {
        if (!item.productId) return;

        const product = productsData.find(p => p.id === item.productId);
        const category = product?.category || 'Unknown';

        // Product sales
        const existing = productSalesMap.get(item.productId);
        if (existing) {
          existing.totalQuantitySold += item.quantity;
          existing.totalRevenue += item.subtotal;
          existing.salesCount += 1;
          existing.averagePrice = existing.totalRevenue / existing.totalQuantitySold;
        } else {
          productSalesMap.set(item.productId, {
            productName: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
            category,
            totalQuantitySold: item.quantity,
            totalRevenue: item.subtotal,
            averagePrice: item.price,
            salesCount: 1,
          });
        }

        // Category sales
        const existingCategory = categorySalesMap.get(category);
        if (existingCategory) {
          existingCategory.totalRevenue += item.subtotal;
          existingCategory.totalQuantity += item.quantity;
        } else {
          categorySalesMap.set(category, {
            category,
            totalRevenue: item.subtotal,
            totalQuantity: item.quantity
          });
        }
      });
    });

    return {
      productSales: Array.from(productSalesMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10), // Top 10 products
      categorySales: Array.from(categorySalesMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue),
      dailySales: Array.from(dailySalesMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30) // Last 30 days
    };
  }, [salesData, productsData]);

  const totalRevenue = useMemo(() => {
    return chartData.productSales.reduce((sum, item) => sum + item.totalRevenue, 0);
  }, [chartData.productSales]);

  const totalQuantity = useMemo(() => {
    return chartData.productSales.reduce((sum, item) => sum + item.totalQuantitySold, 0);
  }, [chartData.productSales]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground">Chargement des analyses...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salesData.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground">Aucune donnée de vente disponible</span>
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
            <CardTitle className="text-sm font-medium">Produits totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.productSales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quantité totale vendue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenu moyen/produit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${chartData.productSales.length > 0 ? (totalRevenue / chartData.productSales.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="daily">Daily Sales</TabsTrigger>
          <TabsTrigger value="quantity">Quantity Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Principaux produits par chiffre d&apos;affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.productSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="productName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'totalRevenue' ? `$${Number(value).toFixed(2)}` : value,
                      name === 'totalRevenue' ? 'Revenue' : 'Quantity'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData.categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="totalRevenue"
                  >
                    {chartData.categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendance des ventes quotidiennes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'revenue' ? `$${Number(value).toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Sales Count'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                  <Line type="monotone" dataKey="sales" stroke="#82ca9d" name="Sales Count" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quantity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quantité vendue par produit</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.productSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="productName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalQuantitySold" fill="#82ca9d" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}