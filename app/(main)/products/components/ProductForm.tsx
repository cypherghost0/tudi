'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/app/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Loader2, X, Plus, Minus, Package, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/firebase';
import { Product } from '../types';
import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { AspectRatio } from '@/app/components/ui/aspect-ratio';

const formSchema = z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be a positive number'),
    cost: z.number().min(0, 'Cost must be a positive number'),
    barcode: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().optional(),
    condition: z.string().min(1, 'Condition is required'),
    specifications: z.string().optional(),
    warranty: z.string().optional(),
    stock: z.number().min(0, 'Stock cannot be negative').int(),
    minStock: z.number().min(0, 'Minimum stock cannot be negative').int(),
    unit: z.string().min(1, 'Unit is required'),
    isActive: z.boolean(),
    // New fields for pieces management
    piecesPerUnit: z.number().min(1, 'Pieces per unit must be at least 1').int(),
    totalPieces: z.number().min(0, 'Total pieces cannot be negative').int(),
    trackIndividualPieces: z.boolean(),
    pieceIdentifiers: z.array(z.string()).optional(),
    imageUrl: z.string().nullable().optional(), // Allow null for imageUrl
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
    initialData?: Product | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const stationeryCategories = [
    'Cahiers et Carnets',
    'Stylos et Crayons',
    'Marqueurs et Surligneurs',
    'Papier et Blocs-notes',
    'Classeurs et Rangement',
    'Fournitures de Bureau',
    'Matériel de Dessin',
    'Calculatrices',
    'Accessoires de Bureau',
    'Étiquettes et Autocollants',
    'Enveloppes et Courrier',
    'Matériel de Présentation',
    'Fournitures Scolaires',
    'Matériel d\'Art',
    'Outils de Mesure',
    'Agendas et Planificateurs',
    'Matériel de Reliure',
    'Fournitures d\'Impression',
    'Accessoires Informatiques',
    'Autres Fournitures'
];

const stationeryBrands = [
    'BIC',
    'Pilot',
    'Stabilo',
    'Faber-Castell',
    'Staedtler',
    'Papermate',
    'Sharpie',
    'Post-it',
    '3M',
    'Avery',
    'Oxford',
    'Clairefontaine',
    'Rhodia',
    'Moleskine',
    'Leuchtturm1917',
    'Pentel',
    'Uni-ball',
    'Sakura',
    'Copic',
    'Tombow',
    'Casio',
    'Canon',
    'HP',
    'Epson',
    'Brother',
    'Fellowes',
    'Leitz',
    'Esselte',
    'Autre'
];

const conditionOptions = [
    'Neuf',
    'Comme Neuf',
    'Excellent',
    'Bon',
    'Correct',
    'Mauvais',
    'Pour Pièces/Réparation'
];

const warrantyOptions = [
    'Aucune Garantie',
    '1 Semaine (7 jours)',
    '30 Jours',
    '90 Jours',
    '6 Mois',
    '1 An',
    '2 Ans',
    '3 Ans',
    'Garantie Étendue'
];

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [pieceIds, setPieceIds] = useState<string[]>([]);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(initialData?.imageUrl || null);

    const title = initialData ? 'Modifier le produit' : 'Ajouter un nouveau produit';
    const action = initialData ? 'Modifier le produit' : 'Créer le produit';

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            price: initialData?.price || 0,
            cost: initialData?.cost || 0,
            barcode: initialData?.barcode || '',
            category: initialData?.category || '',
            brand: initialData?.brand || '',
            model: initialData?.model || '',
            condition: initialData?.condition || 'Bon',
            specifications: initialData?.specifications || '',
            warranty: initialData?.warranty || 'Aucune Garantie',
            stock: initialData?.stock || 0,
            minStock: initialData?.minStock || 0,
            unit: initialData?.unit || 'pcs',
            isActive: initialData?.isActive ?? true,
            piecesPerUnit: initialData?.piecesPerUnit || 1,
            totalPieces: initialData?.totalPieces || 0,
            trackIndividualPieces: initialData?.trackIndividualPieces ?? false,
            pieceIdentifiers: initialData?.pieceIdentifiers || [],
            imageUrl: initialData?.imageUrl || null, // Initialize imageUrl with null
        },
    });

    const watchStock = form.watch('stock');
    const watchPiecesPerUnit = form.watch('piecesPerUnit');
    const watchTrackIndividualPieces = form.watch('trackIndividualPieces');

    useEffect(() => {
        setIsMounted(true);
        if (initialData?.imageUrl) {
            setUploadedImageUrl(initialData.imageUrl);
            form.setValue('imageUrl', initialData.imageUrl);
        }
        return () => setIsMounted(false);
    }, [initialData, form]);

    const generatePieceId = useCallback(() => {
        const name = form.getValues('name') || 'ITEM';
        const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }, [form]);

    // Calculate total pieces when stock or pieces per unit changes
    useEffect(() => {
        const totalPieces = watchStock * watchPiecesPerUnit;
        form.setValue('totalPieces', totalPieces);

        // Update piece identifiers array if tracking individual pieces
        if (watchTrackIndividualPieces) {
            const currentIds = pieceIds.slice(0, totalPieces);
            const newIds = Array.from({ length: totalPieces }, (_, i) =>
                currentIds[i] || generatePieceId()
            );
            setPieceIds(newIds);
            form.setValue('pieceIdentifiers', newIds);
        }
    }, [watchStock, watchPiecesPerUnit, watchTrackIndividualPieces, form, pieceIds, generatePieceId]);

    const addPiece = () => {
        const newId = generatePieceId();
        const updatedIds = [...pieceIds, newId];
        setPieceIds(updatedIds);
        form.setValue('pieceIdentifiers', updatedIds);
        form.setValue('totalPieces', updatedIds.length);
        form.setValue('stock', Math.ceil(updatedIds.length / watchPiecesPerUnit));
    };

    const removePiece = (index: number) => {
        const updatedIds = pieceIds.filter((_, i) => i !== index);
        setPieceIds(updatedIds);
        form.setValue('pieceIdentifiers', updatedIds);
        form.setValue('totalPieces', updatedIds.length);
        form.setValue('stock', Math.ceil(updatedIds.length / watchPiecesPerUnit));
    };

    const updatePieceId = (index: number, newId: string) => {
        const updatedIds = [...pieceIds];
        updatedIds[index] = newId;
        setPieceIds(updatedIds);
        form.setValue('pieceIdentifiers', updatedIds);
    };

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);

            // Prepare the product data with pieces information
            const productData = {
                ...data,
                imageUrl: uploadedImageUrl, // Include the uploaded image URL
                updatedAt: serverTimestamp(),
                // Inventory tracking
                inventoryDetails: {
                    totalPieces: data.totalPieces,
                    piecesPerUnit: data.piecesPerUnit,
                    trackIndividualPieces: data.trackIndividualPieces,
                    pieceIdentifiers: data.trackIndividualPieces ? data.pieceIdentifiers : [],
                    lastStockUpdate: serverTimestamp(),
                },
                // Calculate profit margin
                profitMargin: data.price > 0 ? ((data.price - data.cost) / data.price) * 100 : 0,
                // Stock status
                stockStatus: data.stock <= data.minStock ? 'Low Stock' : 'In Stock',
            };

            if (initialData) {
                // Update existing product with transaction to ensure consistency
                await runTransaction(db, async (transaction) => {
                    const productRef = doc(db, 'products', initialData.id);
                    transaction.update(productRef, productData);

                    // Log stock change if pieces tracking is enabled
                    if (data.trackIndividualPieces) {
                        const stockLogRef = doc(collection(db, 'stockLogs'));
                        transaction.set(stockLogRef, {
                            productId: initialData.id,
                            productName: data.name,
                            action: 'UPDATE',
                            previousStock: initialData.stock || 0,
                            newStock: data.stock,
                            previousPieces: initialData.totalPieces || 0,
                            newPieces: data.totalPieces,
                            pieceIdentifiers: data.pieceIdentifiers,
                            timestamp: serverTimestamp(),
                            updatedBy: 'system', // You can replace with actual user ID
                        });
                    }
                });

                toast.success('Produit mis à jour avec succès');
            } else {
                // Create new product with transaction
                await runTransaction(db, async (transaction) => {
                    const productRef = doc(collection(db, 'products'));
                    transaction.set(productRef, {
                        ...productData,
                        createdAt: serverTimestamp(),
                    });

                    // Log initial stock entry if pieces tracking is enabled
                    if (data.trackIndividualPieces && data.totalPieces > 0) {
                        const stockLogRef = doc(collection(db, 'stockLogs'));
                        transaction.set(stockLogRef, {
                            productId: productRef.id,
                            productName: data.name,
                            action: 'CREATE',
                            previousStock: 0,
                            newStock: data.stock,
                            previousPieces: 0,
                            newPieces: data.totalPieces,
                            pieceIdentifiers: data.pieceIdentifiers,
                            timestamp: serverTimestamp(),
                            updatedBy: 'system', // You can replace with actual user ID
                        });
                    }
                });

                toast.success('Produit créé avec succès');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Échec de la sauvegarde du produit');
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{title}</h3>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Annuler</span>
                </Button>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Basic Product Information */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom du produit</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Entrez le nom du produit" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Category and Brand */}
                        <Controller
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catégorie</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une catégorie" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stationeryCategories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Controller
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Marque</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une marque" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stationeryBrands.map((brand) => (
                                                <SelectItem key={brand} value={brand}>
                                                    {brand}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Model and Condition */}
                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Modèle</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Entrez le numéro/nom du modèle" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Controller
                            control={form.control}
                            name="condition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condition</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une condition" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {conditionOptions.map((condition) => (
                                                <SelectItem key={condition} value={condition}>
                                                    {condition}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Pricing */}
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prix de vente ($)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Entrez le prix de vente"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prix de revient($)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Entrez le prix de revient"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Inventory Management */}
                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unité</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une unité" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="pcs">Pièces</SelectItem>
                                            <SelectItem value="set">Ensemble</SelectItem>
                                            <SelectItem value="pair">Paire</SelectItem>
                                            <SelectItem value="pack">Paquet</SelectItem>
                                            <SelectItem value="box">Boîte</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="piecesPerUnit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pièces par unité</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Combien de pièces dans une unité?"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Pour les articles individuels, conservez ceci comme 1
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="stock"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stock (unités)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Entrez le stock en unités"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="totalPieces"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pièces totales</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            disabled
                                            className="bg-gray-50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Calculated: {watchStock} units × {watchPiecesPerUnit} pieces = {watchStock * watchPiecesPerUnit} pieces
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="minStock"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alerte de stock minimum</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Entrez le niveau de stock minimum"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Controller
                            control={form.control}
                            name="warranty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Période de garantie</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner une période de garantie" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {warrantyOptions.map((warranty) => (
                                                <SelectItem key={warranty} value={warranty}>
                                                    {warranty}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Controller
                            control={form.control}
                            name="barcode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code-barres/Numéro de série</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Entrez le code-barres ou numéro de série"
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Track Individual Pieces Toggle */}
                        <FormField
                            control={form.control}
                            name="trackIndividualPieces"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Suivre des pièces individuelles
                                        </FormLabel>
                                        <FormDescription>
                                            Générer des identifiants uniques pour chaque pièce
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <div className="flex items-center space-x-2">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="trackIndividualPieces"
                                                    checked={field.value}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`block h-6 w-10 rounded-full transition-colors duration-200 ${field.value ? 'bg-blue-500' : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${field.value ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Product Status */}
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Statu</FormLabel>
                                        <FormDescription>
                                            {field.value ? 'Actif' : 'Inactif'}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">
                                                {field.value ? 'Le produit est actif' : 'Le produit est inactif'}
                                            </span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="isActive"
                                                    checked={field.value}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`block h-6 w-10 rounded-full transition-colors duration-200 ${field.value ? 'bg-green-500' : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${field.value ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Individual Piece Tracking */}
                        {watchTrackIndividualPieces && (
                            <div className="md:col-span-2">
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Identificateurs de pièces individuelles
                                    </FormLabel>
                                    <FormDescription>
                                        Chaque pièce reçoit un identifiant unique pour le suivi
                                    </FormDescription>
                                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                        {pieceIds.map((id, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                    #{index + 1}
                                                </span>
                                                <Input
                                                    value={id}
                                                    onChange={(e) => updatePieceId(index, e.target.value)}
                                                    className="flex-1 text-sm"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removePiece(index)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addPiece}
                                            className="w-full"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Ajouter un Piece
                                        </Button>
                                    </div>
                                </FormItem>
                            </div>
                        )}

                        {/* Technical Specifications */}
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="specifications"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Spécifications techniques</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter specifications (e.g., RAM: 16GB, Storage: 512GB SSD, CPU: Intel i7-12700H, GPU: RTX 3060)"
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter product description, condition details, included accessories, etc."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Image du produit</FormLabel>
                                <FormControl>
                                    <CldUploadWidget
                                        uploadPreset="GodWinn"
                                        config={{
                                            cloud: {
                                                cloudName: "djiouitp6"
                                            }
                                        }}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        onSuccess={(result: any) => {
                                            if (result?.info?.secure_url) {
                                                setUploadedImageUrl(result.info.secure_url);
                                                form.setValue('imageUrl', result.info.secure_url);
                                                toast.success('Image uploaded successfully');
                                            }
                                        }}
                                        onError={(error: unknown) => {
                                            console.error('Cloudinary upload error:', error);
                                            toast.error('Image upload failed');
                                        }}
                                    >
                                        {({ open }) => {
                                            function handleOnClick(e: React.MouseEvent<HTMLButtonElement>) {
                                                e.preventDefault();
                                                open();
                                            }
                                            return (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleOnClick}
                                                    disabled={loading}
                                                    className="w-full"
                                                >
                                                    <ImageIcon className="h-4 w-4 mr-2" />
                                                    Télécharger une image
                                                </Button>
                                            );
                                        }}
                                    </CldUploadWidget>
                                </FormControl>
                                {uploadedImageUrl && (
                                    <div className="mt-4 w-full max-w-xs mx-auto">
                                        <AspectRatio ratio={16 / 9}>
                                            <CldImage
                                                width="900"
                                                height="600"
                                                src={uploadedImageUrl}
                                                alt="Product Image"
                                                className="rounded-md object-cover"
                                                config={{
                                                    cloud: {
                                                        cloudName: "djiouitp6"
                                                    }
                                                }}
                                            />
                                        </AspectRatio>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                setUploadedImageUrl(null);
                                                form.setValue('imageUrl', '');
                                                toast.info('Image removed');
                                            }}
                                            className="mt-2 w-full"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Supprimer l'image
                                        </Button>
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {action}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
