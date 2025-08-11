"use client";

import { useState, useEffect } from 'react';
import { AdminOnly } from '@/app/components/auth/protected-route';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ProductForm } from '@/app/components/admin/product-form';
import { Product } from '@/app/lib/types/types';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/app/lib/firebase/products';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Search, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import Image from 'next/image';

export default function AdminProductsPage() {
  return (
    <AdminOnly>
      <ProductManagementContent />
    </AdminOnly>
  );
}

function ProductManagementContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log("Product management page loaded");
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedProduct(undefined);
    setIsFormVisible(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsFormVisible(true);
  };

  const handleDeleteClick = async (productId: string, imageUrl?: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await deleteProduct(productId, imageUrl);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = async (values: any, imageFile?: File) => {
    try {
      if (selectedProduct) {
        // Update existing product
        await updateProduct(selectedProduct.id, values, imageFile);
      } else {
        // Add new product
        if (!imageFile) {
          alert('Please select an image for the new product.');
          return;
        }
        await addProduct(values, imageFile);
      }
      fetchProducts();
      setIsFormVisible(false);
      setSelectedProduct(undefined);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setSelectedProduct(undefined);
  };

  const getStockStatus = (stock: number, minStockLevel: number) => {
    if (stock === 0) return { status: 'out', color: 'destructive', text: 'Out of Stock' };
    if (stock <= minStockLevel) return { status: 'low', color: 'destructive', text: 'Low Stock' };
    return { status: 'ok', color: 'default', text: 'In Stock' };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion des produits</h1>
            <p className="text-muted-foreground">
              Gérez votre inventaire de composants électroniques
            </p>
          </div>
          <Button onClick={handleAddClick} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Product
          </Button>
        </div>

        {isFormVisible && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
              <CardDescription>
                {selectedProduct ? 'Update product information' : 'Add a new product to your inventory'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm
                product={selectedProduct}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>
                  {filteredProducts.length} of {products.length} products
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No products found matching your search.' : 'No products in inventory.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock, product.minStockLevel);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-md border"
                              width={64}
                              height={64}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {product.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              ${product.price.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.stock}</span>
                              <Badge variant={stockStatus.color as "default" | "destructive" | "outline" | "secondary"}>
                                {stockStatus.status === 'low' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {stockStatus.text}
                              </Badge>
                            </div>
                            {product.stock > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Min: {product.minStockLevel}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{product.supplier}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditClick(product)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteClick(product.id, product.imageUrl)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
