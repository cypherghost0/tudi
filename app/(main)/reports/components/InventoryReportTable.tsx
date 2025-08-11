'use client';

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Search, ArrowUpDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Product } from '@/app/lib/types/types';

interface InventoryReportTableProps {
  productsData: Product[];
  loading: boolean;
}

type SortField = 'name' | 'category' | 'stock' | 'minStockLevel' | 'price' | 'stockValue';
type SortOrder = 'asc' | 'desc';

export function InventoryReportTable({ productsData, loading }: InventoryReportTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const inventoryData = useMemo(() => {
    return productsData.map(product => ({
      ...product,
      name: product.name || 'N/A',
      category: product.category || 'N/A',
      stock: product.stock ?? 0,
      minStockLevel: product.minStockLevel ?? 0,
      price: product.price ?? 0,
      stockValue: (product.stock ?? 0) * (product.price ?? 0),
      stockStatus: (product.stock ?? 0) <= 0 ? 'out-of-stock' :
                  (product.stock ?? 0) <= (product.minStockLevel ?? 0) ? 'low-stock' : 'in-stock'
    }));
  }, [productsData]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = inventoryData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply stock status filter
    if (stockStatusFilter !== 'all') {
      filtered = filtered.filter(item => item.stockStatus === stockStatusFilter);
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
  }, [inventoryData, searchTerm, categoryFilter, stockStatusFilter, sortField, sortOrder]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(inventoryData.map(item => item.category))];
    return uniqueCategories.sort();
  }, [inventoryData]);

  const summary = useMemo(() => {
    const totalProducts = filteredAndSortedData.length;
    const totalStockValue = filteredAndSortedData.reduce((sum, item) => sum + item.stockValue, 0);
    const totalItems = filteredAndSortedData.reduce((sum, item) => sum + item.stock, 0);
    const outOfStock = filteredAndSortedData.filter(item => item.stockStatus === 'out-of-stock').length;
    const lowStock = filteredAndSortedData.filter(item => item.stockStatus === 'low-stock').length;
    const inStock = filteredAndSortedData.filter(item => item.stockStatus === 'in-stock').length;

    return {
      totalProducts,
      totalStockValue,
      totalItems,
      outOfStock,
      lowStock,
      inStock
    };
  }, [filteredAndSortedData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'out-of-stock':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Out of Stock
          </Badge>
        );
      case 'low-stock':
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            In Stock
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground">Loading inventory data...</span>
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
    <Card>
      <CardHeader>
        <CardTitle>Inventory Report</CardTitle>
        
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
          <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
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
                    onClick={() => handleSort('name')}
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
                    onClick={() => handleSort('stock')}
                    className="h-auto p-0 font-semibold"
                  >
                    Current Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('minStockLevel')}
                    className="h-auto p-0 font-semibold"
                  >
                    Min Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('price')}
                    className="h-auto p-0 font-semibold"
                  >
                    Unit Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('stockValue')}
                    className="h-auto p-0 font-semibold"
                  >
                    Stock Value
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{item.stock}</TableCell>
                  <TableCell className="text-right">{item.minStockLevel}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${item.stockValue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {getStockStatusBadge(item.stockStatus)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalProducts}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.totalItems}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">${summary.totalStockValue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Stock Value</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{summary.inStock}</div>
            <div className="text-sm text-muted-foreground">In Stock</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.lowStock}</div>
            <div className="text-sm text-muted-foreground">Low Stock</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{summary.outOfStock}</div>
            <div className="text-sm text-muted-foreground">Out of Stock</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}