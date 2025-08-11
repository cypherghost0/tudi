'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { AspectRatio } from '@/app/components/ui/aspect-ratio';
import { 
    Package, 
    DollarSign, 
    Calendar, 
    Shield, 
    BarChart3, 
    Edit, 
    Image as ImageIcon,
    AlertTriangle
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/firebase';
import { Product } from '../types';
import { CldImage } from 'next-cloudinary';
import { toast } from 'sonner';

interface ProductDetailsDrawerProps {
    productId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (product: Product) => void;
    isCashier?: boolean;
}

export function ProductDetailsDrawer({ 
    productId, 
    isOpen, 
    onClose, 
    onEdit,
    isCashier = false 
}: ProductDetailsDrawerProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchProduct = useCallback(async () => {
        if (!productId) return;
        
        try {
            setLoading(true);
            const productDoc = await getDoc(doc(db, 'products', productId));
            
            if (productDoc.exists()) {
                setProduct({ id: productDoc.id, ...productDoc.data() } as Product);
            } else {
                toast.error('Product not found');
                onClose();
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    }, [productId, onClose]);

    useEffect(() => {
        if (productId && isOpen) {
            fetchProduct();
        }
    }, [productId, isOpen, fetchProduct]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    const formatDate = (date: Date) => {
        return format(date, 'dd/MM/yyyy à HH:mm');
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'Low Stock':
                return 'destructive';
            case 'In Stock':
                return 'default';
            default:
                return 'secondary';
        }
    };

    if (loading) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-full sm:max-w-2xl">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading product details...</p>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    if (!product) {
        return null;
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-2xl">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle className="text-xl">{product.name}</SheetTitle>
                            <SheetDescription>
                                {product.brand} {product.model && `- ${product.model}`}
                            </SheetDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isCashier && onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(product)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    <div className="space-y-6">
                        {/* Product Image */}
                        {product.imageUrl ? (
                            <Card>
                                <CardContent className="p-4">
                                    <AspectRatio ratio={16 / 9}>
                                        <CldImage
                                            width="800"
                                            height="450"
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="rounded-md object-cover w-full h-full"
                                            config={{
                                                cloud: {
                                                    cloudName: "djiouitp6"
                                                }
                                            }}
                                        />
                                    </AspectRatio>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-8">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 mb-2" />
                                        <p>No image available</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                                        <Badge variant="outline">{product.category}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Condition</p>
                                        <p className="font-medium">{product.condition}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                            {product.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Unit</p>
                                        <p className="font-medium">{product.unit}</p>
                                    </div>
                                </div>
                                
                                {product.description && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                                        <p className="text-sm leading-relaxed">{product.description}</p>
                                    </div>
                                )}

                                {product.specifications && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Specifications</p>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.specifications}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pricing Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Pricing
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Prix de vente</p>
                                        <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Prix de revient</p>
                                        <p className="text-xl font-semibold text-muted-foreground">{formatCurrency(product.cost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Marge bénéficiaire</p>
                                        <p className="text-lg font-semibold text-green-600">
                                            {product.profitMargin.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Bénéfice par unité</p>
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(product.price - product.cost)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inventory Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Inventory
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Stock actuel</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-bold">{product.stock}</p>
                                            <span className="text-muted-foreground">{product.unit}</span>
                                            {product.stock <= product.minStock && (
                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Stock minimum</p>
                                        <p className="text-xl font-semibold">{product.minStock} {product.unit}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">État des stocks</p>
                                        <Badge variant={getStockStatusColor(product.stockStatus)}>
                                            {product.stockStatus}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Valeur totale</p>
                                        <p className="text-xl font-semibold">
                                            {formatCurrency(product.stock * product.cost)}
                                        </p>
                                    </div>
                                </div>

                                {/* Pieces Management */}
                                <Separator className="my-4" />
                                <div className="space-y-3">
                                    <h4 className="font-medium">Gestion des pièces</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Pièces par unité</p>
                                            <p className="font-semibold">{product.piecesPerUnit}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Pièces totales</p>
                                            <p className="font-semibold">{product.totalPieces}</p>
                                        </div>
                                    </div>
                                    
                                    {product.trackIndividualPieces && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                                Individual Piece Tracking: <Badge variant="outline">Enabled</Badge>
                                            </p>
                                            {product.pieceIdentifiers && product.pieceIdentifiers.length > 0 && (
                                                <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                                        {product.pieceIdentifiers.map((id, index) => (
                                                            <div key={index} className="font-mono bg-muted px-2 py-1 rounded">
                                                                {id}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Additional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {product.warranty && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Garantie</p>
                                            <p className="font-medium">{product.warranty}</p>
                                        </div>
                                    )}
                                    {product.barcode && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Code-barres/Numéro de série</p>
                                            <p className="font-mono text-sm">{product.barcode}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Créé</p>
                                        <p className="font-medium">{formatDate(product.createdAt.toDate())}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                                        <p className="font-medium">{formatDate(product.updatedAt.toDate())}</p>
                                    </div>
                                    {product.inventoryDetails?.lastStockUpdate && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour des stocks</p>
                                            <p className="font-medium">{formatDate(product.inventoryDetails.lastStockUpdate.toDate())}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}