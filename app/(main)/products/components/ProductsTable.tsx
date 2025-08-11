'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Plus, Pencil, Trash2, Eye, Package } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/firebase';
import { Product, ProductFilters } from '../types';
import { toast } from 'sonner';

interface ProductsTableProps {
    products: Product[];
    categories: string[];
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    onView: (productId: string) => void;
    onAddNew: () => void;
    onFilterChange: (filters: ProductFilters) => void;
    filters: ProductFilters;
    hasMore: boolean;
    loadMore: () => void;
    loading: boolean;
    isCashier: boolean;
}

export function ProductsTable({
    products,
    categories,
    onEdit,
    onDelete: onDeleteProp,
    onView,
    onAddNew,
    onFilterChange,
    filters,
    hasMore,
    loadMore,
    loading,
    isCashier,
}: ProductsTableProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange({ ...filters, search: searchTerm });
    };

    const handleCategoryChange = (value: string) => {
        onFilterChange({ ...filters, category: value === 'all' ? undefined : value });
    };

    const handleStatusChange = (checked: boolean) => {
        onFilterChange({ ...filters, isActive: checked ? undefined : false });
    };

    const handleSortChange = (value: string) => {
        const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc'];
        onFilterChange({ ...filters, sortBy: sortBy as "name" | "price" | "stock" | "updatedAt", sortOrder });
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) {
            return;
        }

        try {
            setDeletingId(productId);
            await deleteDoc(doc(db, 'products', productId));
            toast.success('Produit supprimé avec succès');
            onDeleteProp(productId);
        } catch (error) {
            console.error('Erreur lors de la suppression du produit :', error);
            toast.error('Échec de la suppression du produit. Veuillez réessayer.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    const formatDate = (date: Date) => {
        return format(date, 'd MMM yyyy');
    };

    if (loading && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un produit..."
                            className="pl-9 w-full md:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </form>
                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={filters.category || 'all'}
                        onValueChange={handleCategoryChange}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrer par catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={`${filters.sortBy || 'name'}-${filters.sortOrder || 'asc'}`}
                        onValueChange={handleSortChange}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
                            <SelectItem value="price-asc">Prix croissant</SelectItem>
                            <SelectItem value="price-desc">Prix décroissant</SelectItem>
                            <SelectItem value="stock-asc">Stock croissant</SelectItem>
                            <SelectItem value="stock-desc">Stock décroissant</SelectItem>
                            <SelectItem value="updatedAt-desc">Dernière mise à jour</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 px-3 py-2 border rounded-md">
                        <Checkbox
                            id="active-only"
                            checked={filters.isActive === undefined}
                            onCheckedChange={(checked) => handleStatusChange(checked === true)}
                        />
                        <label
                            htmlFor="active-only"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Actifs uniquement
                        </label>
                    </div>
                    {!isCashier && (
                        <Button onClick={onAddNew} className="ml-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un produit
                        </Button>
                    )}
                </div>
            </div>
            <div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right">Prix</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Mis à jour</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Aucun produit trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-sm text-muted-foreground">{product.brand} - {product.model}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(product.price)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={product.stock <= product.minStock ? 'text-red-500 font-medium' : ''}>
                                            {product.stock} {product.unit}
                                        </span>
                                        {product.stock <= product.minStock && (
                                            <span className="text-xs text-red-500 block">Stock faible</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                            {product.isActive ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {formatDate(product.updatedAt.toDate())}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Ouvrir le menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onView(product.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Voir
                                                </DropdownMenuItem>
                                                {!isCashier && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => onEdit(product)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(product.id)}
                                                            disabled={deletingId === product.id}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {deletingId === product.id ? 'Suppression...' : 'Supprimer'}
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        {loading ? 'Chargement...' : 'Voir plus'}
                    </Button>
                </div>
            )}
        </div>
    );
}
