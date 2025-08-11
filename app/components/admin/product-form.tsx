"use client";

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Product } from '@/app/lib/types/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import Image from 'next/image';

interface ProductFormValues {
  name: string;
  price: number;
  stock: number;
  minStockLevel: number;
  category: string;
  supplier: string;
  description: string;
  imageUrl: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (values: ProductFormValues, imageFile?: File) => Promise<void>;
  onCancel: () => void;
}

const ProductSchema = Yup.object().shape({
  name: Yup.string().required('Product name is required'),
  price: Yup.number().positive('Price must be positive').required('Price is required'),
  stock: Yup.number().integer('Stock must be an integer').min(0, 'Stock cannot be negative').required('Stock is required'),
  minStockLevel: Yup.number().integer('Min stock level must be an integer').min(0, 'Min stock level cannot be negative').required('Min stock level is required'),
  category: Yup.string().required('Category is required'),
  supplier: Yup.string().required('Supplier is required'),
  description: Yup.string().required('Description is required'),
});

const categories = [
  'Microcontrollers',
  'Single Board Computers',
  'Prototyping',
  'LEDs & Lighting',
  'Connectors',
  'Sensors',
  'Motors & Actuators',
  'Power Supply',
  'Tools & Equipment',
  'Other'
];

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: product?.name || '',
      price: product?.price || 0,
      stock: product?.stock || 0,
      minStockLevel: product?.minStockLevel || 0,
      category: product?.category || '',
      supplier: product?.supplier || '',
      description: product?.description || '',
      imageUrl: product?.imageUrl || '',
    },
    validationSchema: ProductSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      await onSubmit(values, imageFile);
      setIsSubmitting(false);
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) {
      setImageFile(event.currentTarget.files[0]);
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Product Name *</label>
          <Input 
            id="name" 
            {...formik.getFieldProps('name')} 
            placeholder="e.g., Arduino Uno R3"
          />
          {formik.touched.name && formik.errors.name ? (
            <div className="text-destructive text-sm">{formik.errors.name}</div>
          ) : null}
        </div>


        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">Price ($) *</label>
          <Input 
            id="price" 
            type="number" 
            step="0.01"
            {...formik.getFieldProps('price')} 
            placeholder="0.00"
          />
          {formik.touched.price && formik.errors.price ? (
            <div className="text-destructive text-sm">{formik.errors.price}</div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="stock" className="text-sm font-medium">Current Stock *</label>
          <Input 
            id="stock" 
            type="number" 
            {...formik.getFieldProps('stock')} 
            placeholder="0"
          />
          {formik.touched.stock && formik.errors.stock ? (
            <div className="text-destructive text-sm">{formik.errors.stock}</div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="minStockLevel" className="text-sm font-medium">Min Stock Level *</label>
          <Input 
            id="minStockLevel" 
            type="number" 
            {...formik.getFieldProps('minStockLevel')} 
            placeholder="0"
          />
          {formik.touched.minStockLevel && formik.errors.minStockLevel ? (
            <div className="text-destructive text-sm">{formik.errors.minStockLevel}</div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Category *</label>
          <Select 
            value={formik.values.category} 
            onValueChange={(value) => formik.setFieldValue('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formik.touched.category && formik.errors.category ? (
            <div className="text-destructive text-sm">{formik.errors.category}</div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="supplier" className="text-sm font-medium">Supplier *</label>
          <Input 
            id="supplier" 
            {...formik.getFieldProps('supplier')} 
            placeholder="e.g., Arduino, Raspberry Pi Foundation"
          />
          {formik.touched.supplier && formik.errors.supplier ? (
            <div className="text-destructive text-sm">{formik.errors.supplier}</div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="image" className="text-sm font-medium">Product Image</label>
          <Input 
            id="image" 
            type="file" 
            accept="image/*"
            onChange={handleImageChange} 
          />
          {product?.imageUrl && !imageFile && (
            <div className="mt-2">
              <Image src={product.imageUrl} alt={product.name} width={96} height={96} className="object-cover rounded-md" />
              <p className="text-xs text-muted-foreground mt-1">Current image</p>
            </div>
          )}
          {imageFile && (
            <div className="mt-2">
              <Image src={URL.createObjectURL(imageFile)} alt="Preview" width={96} height={96} className="object-cover rounded-md" />
              <p className="text-xs text-muted-foreground mt-1">New image preview</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description *</label>
        <Textarea 
          id="description" 
          {...formik.getFieldProps('description')} 
          placeholder="Describe the product features, specifications, and use cases..."
          rows={4}
        />
        {formik.touched.description && formik.errors.description ? (
          <div className="text-destructive text-sm">{formik.errors.description}</div>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
        </Button>
      </div>
    </form>
  );
}
