'use client';

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Search, ArrowUpDown } from 'lucide-react';
import { Sale, Product } from '@/app/lib/types/types';

interface ProductSalesData {
  productId: string;
  productName: string;
  category: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  salesCount: number;
  lastSaleDate: string;
}

interface EnhancedReportsTableProps {
  salesData: Sale[];
  productsData: Product[];
  loading: boolean;
}

type SortField = 'productName' | 'category' | 'totalQuantitySold' | 'totalRevenue' | 'averagePrice' | 'salesCount';
type SortOrder = 'asc' | 'desc';

export function EnhancedReportsTable({ salesData, productsData, loading }: EnhancedReportsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const productSalesData = useMemo(() => {
    if (!salesData.length) return [];

    const productSalesMap = new Map<string, ProductSalesData>();

    salesData.forEach(sale => {
      sale.items.forEach(item => {
        if (!item.productId) return;

        const product = productsData.find(p => p.id === item.productId);
        const category = product?.category || 'Unknown';
        
        // Handle different timestamp formats
        let saleDate;
        if (sale.timestamp && typeof sale.timestamp === 'object' && 'seconds' in sale.timestamp) {
          saleDate = new Date(sale.timestamp.seconds * 1000).toISOString().split('T')[0];
        } else if (sale.date) {
          saleDate = new Date(sale.date).toISOString().split('T')[0];
        } else {
          saleDate = new Date().toISOString().split('T')[0];
        }

        const existing = productSalesMap.get(item.productId);
        if (existing) {
          existing.totalQuantitySold += item.quantity;
          existing.totalRevenue += item.subtotal;
          existing.salesCount += 1;
          existing.averagePrice = existing.totalRevenue / existing.totalQuantitySold;
          if (saleDate > existing.lastSaleDate) {
            existing.lastSaleDate = saleDate;
          }
        } else {
          productSalesMap.set(item.productId, {
            productId: item.productId,
            productName: item.name,
            category,
            totalQuantitySold: item.quantity,
            totalRevenue: item.subtotal,
            averagePrice: item.price,
            salesCount: 1,
            lastSaleDate: saleDate,
          });
        }
      });
    });

    return Array.from(productSalesMap.values());
  }, [salesData, productsData]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = productSalesData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [productSalesData, searchTerm, categoryFilter, sortField, sortOrder]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(productSalesData.map(item => item.category))];
    return uniqueCategories.sort();
  }, [productSalesData]);

  const totals = useMemo(() => {
    return filteredAndSortedData.reduce(
      (acc, item) => ({
        totalQuantity: acc.totalQuantity + item.totalQuantitySold,
        totalRevenue: acc.totalRevenue + item.totalRevenue,
        totalSales: acc.totalSales + item.salesCount,
      }),
      { totalQuantity: 0, totalRevenue: 0, totalSales: 0 }
    );
  }, [filteredAndSortedData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground">Loading sales data...</span>
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
            <span className="text-muted-foreground">No sales data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Report by Product</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('productName')}
                    className="h-auto p-0 font-semibold"
                  >
                    Product Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('category')}
                    className="h-auto p-0 font-semibold"
                  >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('totalQuantitySold')}
                    className="h-auto p-0 font-semibold"
                  >
                    Qty Sold
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('totalRevenue')}
                    className="h-auto p-0 font-semibold"
                  >
                    Total Revenue
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('averagePrice')}
                    className="h-auto p-0 font-semibold"
                  >
                    Avg Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('salesCount')}
                    className="h-auto p-0 font-semibold"
                  >
                    Sales Count
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Last Sale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.totalQuantitySold}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${item.totalRevenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${item.averagePrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{item.salesCount}</TableCell>
                  <TableCell>
                    {new Date(item.lastSaleDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={2}>TOTALS</TableCell>
                <TableCell className="text-right">{totals.totalQuantity}</TableCell>
                <TableCell className="text-right">${totals.totalRevenue.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  ${filteredAndSortedData.length > 0 ? (totals.totalRevenue / totals.totalQuantity).toFixed(2) : '0.00'}
                </TableCell>
                <TableCell className="text-right">{totals.totalSales}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Products:</span>
              <span className="ml-2 font-semibold">{filteredAndSortedData.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Quantity:</span>
              <span className="ml-2 font-semibold">{totals.totalQuantity}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Revenue:</span>
              <span className="ml-2 font-semibold">${totals.totalRevenue.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Sales:</span>
              <span className="ml-2 font-semibold">{totals.totalSales}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}