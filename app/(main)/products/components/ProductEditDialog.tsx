'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Product } from '../types';
import { ProductForm } from './ProductForm';

interface ProductEditDialogProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProductEditDialog({ 
    product, 
    isOpen, 
    onClose, 
    onSuccess 
}: ProductEditDialogProps) {
    const handleSuccess = () => {
        onSuccess();
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-screen max-w-none max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {product ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                    <DialogDescription>
                        {product 
                            ? 'Update the product information below.' 
                            : 'Fill in the details to create a new product.'
                        }
                    </DialogDescription>
                </DialogHeader>
                
                <ProductForm
                    initialData={product}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </DialogContent>
        </Dialog>
    );
}