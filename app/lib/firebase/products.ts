import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types/types';
import { uploadImage, deleteImage, getPublicIdFromUrl } from '../cloudinary';
import { createActivity, createNotification } from './activities';

const productsCollection = collection(db, 'products');

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(productsCollection);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Product;
  });
};

// Add a new product
export const addProduct = async (
  productData: Omit<Product, 'id' | 'updatedAt' | 'createdAt'>,
  imageFile: File,
  userId?: string,
  userName?: string
): Promise<Product> => {
  // Upload image to Cloudinary
  const imageUrl = await uploadImage(imageFile);

  // Add product to Firestore
  const docRef = await addDoc(productsCollection, {
    ...productData,
    imageUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create activity for product addition
  try {
    await createActivity(
      'product_added',
      'Nouveau produit ajouté',
      `${productData.name} a été ajouté au catalogue - Stock: ${productData.stock}`,
      userId,
      userName,
      docRef.id,
      {
        productName: productData.name,
        category: productData.category,
        price: productData.price,
        stock: productData.stock
      }
    );
  } catch (error) {
    console.error('Error creating product addition activity:', error);
  }

  return {
    id: docRef.id,
    ...productData,
    imageUrl,
    createdAt: Timestamp.now().toDate(),
    updatedAt: Timestamp.now().toDate()
  } as Product;
};

// Update an existing product
export const updateProduct = async (
  productId: string,
  productData: Partial<Omit<Product, 'id' | 'createdAt'>>,
  newImageFile?: File,
  userId?: string,
  userName?: string
): Promise<void> => {
  const productRef = doc(db, 'products', productId);

  // Get current product data to compare stock changes
  const currentProductDoc = await getDoc(productRef);
  const currentProductData = currentProductDoc.exists() ? currentProductDoc.data() as Product : null;

  let imageUrl = productData.imageUrl;
  if (newImageFile) {
    // Delete old image if it exists
    if (imageUrl) {
      try {
        const publicId = getPublicIdFromUrl(imageUrl);
        await deleteImage(publicId);
      } catch (error) {
        console.warn("Old image not found or couldn't be deleted:", error);
      }
    }
    // Upload new image
    imageUrl = await uploadImage(newImageFile);
  }

  await updateDoc(productRef, {
    ...productData,
    ...(imageUrl && { imageUrl }),
    updatedAt: serverTimestamp(),
  });

  // Create activities and notifications for stock changes
  try {
    if (currentProductData && productData.stock !== undefined) {
      const oldStock = currentProductData.stock || 0;
      const newStock = productData.stock;
      const stockDiff = newStock - oldStock;

      if (stockDiff !== 0) {
        // Create stock update activity
        await createActivity(
          'stock_update',
          'Stock de produits mis à jour',
          `${productData.name || currentProductData.name} - Stock ${stockDiff > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(stockDiff)} unité${Math.abs(stockDiff) > 1 ? 's' : ''} (${oldStock} → ${newStock})`,
          userId,
          userName,
          productId,
          {
            productName: productData.name || currentProductData.name,
            oldStock,
            newStock,
            stockDiff
          }
        );

        // Create notifications for stock alerts
        const minStockLevel = productData.minStockLevel || currentProductData.minStockLevel || 5;
        
        if (newStock === 0) {
          await createNotification(
            'out_of_stock',
            'Produit en rupture de stock',
            `${productData.name || currentProductData.name} est en rupture de stock`,
            'error',
            undefined,
            productId,
            {
              productName: productData.name || currentProductData.name,
              stock: newStock
            }
          );
        } else if (newStock <= minStockLevel && oldStock > minStockLevel) {
          await createNotification(
            'low_stock',
            'Stock faible',
            `${productData.name || currentProductData.name} a un stock faible (${newStock} restant)`,
            'warning',
            undefined,
            productId,
            {
              productName: productData.name || currentProductData.name,
              stock: newStock,
              minStockLevel
            }
          );
        }
      }
    }

    // Create general product update activity if not just a stock change
    if (Object.keys(productData).some(key => key !== 'stock')) {
      await createActivity(
        'product_updated',
        'Produit mis à jour',
        `${productData.name || currentProductData?.name || 'Produit'} a été modifié`,
        userId,
        userName,
        productId,
        {
          productName: productData.name || currentProductData?.name,
          updatedFields: Object.keys(productData)
        }
      );
    }
  } catch (error) {
    console.error('Error creating product update activities:', error);
  }
};

// Delete a product
export const deleteProduct = async (productId: string, imageUrl?: string): Promise<void> => {
  // Delete image from Cloudinary
  if (imageUrl) {
    try {
      const publicId = getPublicIdFromUrl(imageUrl);
      await deleteImage(publicId);
    } catch (error) {
      console.error("Error deleting product image:", error);
    }
  }

  // Delete product from Firestore
  await deleteDoc(doc(db, 'products', productId));
}; 