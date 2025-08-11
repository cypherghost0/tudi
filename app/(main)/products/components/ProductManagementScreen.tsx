'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, where, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/firebase';
import { Product, ProductFilters } from '../types';
import { ProductsTable } from './ProductsTable';
import { ProductDetailsDrawer } from './ProductDetailsDrawer';
import { ProductEditDialog } from './ProductEditDialog';
import { toast } from 'sonner';

interface ProductManagementScreenProps {
    isCashier?: boolean;
}

const PRODUCTS_PER_PAGE = 20;

export function ProductManagementScreen({ isCashier = false }: ProductManagementScreenProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    
    // Dialog states
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState<ProductFilters>({
        sortBy: 'updatedAt',
        sortOrder: 'desc',
    });

    const buildQuery = useCallback((isInitial = false) => {
        const q = collection(db, 'products');
        const constraints: Parameters<typeof query>[1][] = [];

        // Apply filters
        if (filters.search) {
            // For search, we'll filter client-side since Firestore doesn't support full-text search
            // In a production app, you'd want to use Algolia or similar for better search
        }

        if (filters.category) {
            constraints.push(where('category', '==', filters.category));
        }

        if (filters.isActive !== undefined) {
            constraints.push(where('isActive', '==', filters.isActive));
        }

        // Apply sorting
        const sortField = filters.sortBy || 'updatedAt';
        const sortDirection = filters.sortOrder || 'desc';
        constraints.push(orderBy(sortField, sortDirection));

        // Apply pagination
        constraints.push(limit(PRODUCTS_PER_PAGE));
        
        if (!isInitial && lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        return query(q, ...constraints);
    }, [filters.category, filters.isActive, filters.sortBy, filters.sortOrder, lastDoc]);

    const loadProducts = useCallback(async (isInitial = false) => {
        try {
            setLoading(true);
            
            const q = buildQuery(isInitial);
            const snapshot = await getDocs(q);
            
            let newProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];

            // Client-side search filtering
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                newProducts = newProducts.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.brand.toLowerCase().includes(searchTerm) ||
                    product.category.toLowerCase().includes(searchTerm) ||
                    (product.model && product.model.toLowerCase().includes(searchTerm)) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm))
                );
            }

            if (isInitial) {
                setProducts(newProducts);
                setLastDoc(null); // Reset pagination for initial load
            } else {
                setProducts(prev => [...prev, ...newProducts]);
            }

            setHasMore(snapshot.docs.length === PRODUCTS_PER_PAGE);
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
            
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [buildQuery, filters.search]);

    const loadCategories = useCallback(async () => {
        try {
            const q = query(collection(db, 'products'));
            const snapshot = await getDocs(q);
            
            const categorySet = new Set<string>();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.category) {
                    categorySet.add(data.category);
                }
            });
            
            setCategories(Array.from(categorySet).sort());
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        setLastDoc(null); // Reset pagination when filters change
        loadProducts(true);
    }, [filters.category, filters.isActive, filters.sortBy, filters.sortOrder, filters.search]);

    const handleFilterChange = (newFilters: ProductFilters) => {
        setFilters(newFilters);
        setLastDoc(null);
    };

    const handleView = (productId: string) => {
        setSelectedProductId(productId);
        setIsDetailsOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsEditDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setIsEditDialogOpen(true);
    };

    const handleDelete = (productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast.success('Product deleted successfully');
    };

    const handleEditSuccess = () => {
        // Reload products to get the latest data
        setLastDoc(null);
        loadProducts(true);
        toast.success('Product saved successfully');
    };

    const handleDetailsClose = () => {
        setIsDetailsOpen(false);
        setSelectedProductId(null);
    };

    const handleEditDialogClose = () => {
        setIsEditDialogOpen(false);
        setEditingProduct(null);
    };

    const handleEditFromDetails = (product: Product) => {
        setIsDetailsOpen(false);
        setEditingProduct(product);
        setIsEditDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <ProductsTable
                products={products}
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onAddNew={handleAddNew}
                onFilterChange={handleFilterChange}
                filters={filters}
                hasMore={hasMore}
                loadMore={() => loadProducts(false)}
                loading={loading}
                isCashier={isCashier}
            />

            <ProductDetailsDrawer
                productId={selectedProductId}
                isOpen={isDetailsOpen}
                onClose={handleDetailsClose}
                onEdit={handleEditFromDetails}
                isCashier={isCashier}
            />

            <ProductEditDialog
                product={editingProduct}
                isOpen={isEditDialogOpen}
                onClose={handleEditDialogClose}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}