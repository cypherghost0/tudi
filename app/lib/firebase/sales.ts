import {
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Sale, SaleItem, CustomerInfo } from '../types/types';
import { createActivity } from './activities';

const salesCollection = collection(db, 'sales');

// Create a new sale
export const createSale = async (
  items: SaleItem[],
  total: number,
  tax: number,
  finalTotal: number,
  paymentMethod: 'cash' | 'card' | 'mobile',
  soldBy: string,
  soldByName: string,
  customerInfo: CustomerInfo,
  isOfflineSale: boolean = false
): Promise<string> => {
  const batch = writeBatch(db);

  // Create sale document - filter out undefined values
  const saleData: Omit<Sale, 'id'> = {
    items: items || [],
    total: total || 0,
    tax: tax || 0,
    finalTotal: finalTotal || 0,
    paymentMethod: paymentMethod || 'cash',
    soldBy: soldBy || '',
    soldByName: soldByName || '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    timestamp: serverTimestamp() as any,
    isOfflineSale: isOfflineSale || false,
    status: isOfflineSale ? 'pending_sync' : 'completed',
    customerInfo: {
      name: customerInfo?.name || '',
      phone: customerInfo?.phone || '',
      email: customerInfo?.email || '',
      address: customerInfo?.address || '',
      customerId: customerInfo?.customerId || ''
    },
    date: Date.now(),
    cashierId: soldBy || '',
    products: items || [],
  };

  // Remove any undefined values from the sale data
  const cleanSaleData = Object.fromEntries(
    Object.entries(saleData).filter(([, value]) => value !== undefined)
  );

  const saleRef = doc(salesCollection);
  batch.set(saleRef, cleanSaleData);

  // Update stock levels for each product
  for (const item of items) {
    if (!item.productId) continue;
    
    try {
      const productRef = doc(db, 'products', item.productId);
      const productDoc = await getDoc(productRef);
      
      if (productDoc.exists()) {
        const currentStock = productDoc.data().stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        
        batch.update(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp(),
        });
      } else {
        console.warn(`Product with ID ${item.productId} not found, skipping stock update`);
      }
    } catch (error) {
      console.error(`Error updating stock for product ${item.productId}:`, error);
      // Continue with other products even if one fails
    }
  }

  // Commit the batch
  await batch.commit();

  // Create activity for the sale
  try {
    await createActivity(
      'sale',
      'Nouvelle vente terminée',
      `Vente n° ${saleRef.id.slice(-6)} - $${finalTotal.toFixed(2)} - ${items.length} article${items.length > 1 ? 's' : ''}`,
      soldBy,
      soldByName,
      saleRef.id,
      {
        total: finalTotal,
        itemCount: items.length,
        paymentMethod,
        customerName: customerInfo?.name
      }
    );
  } catch (error) {
    console.error('Error creating sale activity:', error);
    // Don't fail the sale if activity creation fails
  }

  return saleRef.id;
};

// Get all sales
export const getSales = async (): Promise<Sale[]> => {
  const q = query(salesCollection, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sale));
};

// Get sales by user
export const getSalesByUser = async (userId: string): Promise<Sale[]> => {
  const q = query(
    salesCollection, 
    where('soldBy', '==', userId), 
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sale));
};

// Get offline sales that need to be synced
export const getOfflineSales = async (): Promise<Sale[]> => {
  const q = query(
    salesCollection, 
    where('isOfflineSale', '==', true), 
    where('status', '==', 'pending_sync')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sale));
};

// Mark offline sale as synced
export const markSaleAsSynced = async (saleId: string): Promise<void> => {
  await updateDoc(doc(db, 'sales', saleId), {
    status: 'completed',
    updatedAt: serverTimestamp(),
  });
};

// Get sales statistics
export const getSalesStats = async (startDate?: Date, endDate?: Date) => {
  const q = query(salesCollection, where('status', '==', 'completed'), orderBy('date', 'desc'));

  const snapshot = await getDocs(q);
  let sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sale));

  // Filter by date range if provided (client-side filtering for more reliable results)
  if (startDate || endDate) {
    sales = sales.filter((sale) => {
      let saleDate: Date;
      if (sale.date) {
        saleDate = new Date(sale.date);
      } else if (sale.timestamp && typeof sale.timestamp === 'object' && 'seconds' in sale.timestamp) {
        saleDate = new Date(sale.timestamp.seconds * 1000);
      } else {
        saleDate = new Date();
      }
      
      if (startDate && saleDate < startDate) {
        return false;
      }
      
      if (endDate) {
        // Set end date to end of day for inclusive filtering
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (saleDate > endOfDay) {
          return false;
        }
      }
      
      return true;
    });
  }

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalTotal, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return {
    totalSales,
    totalRevenue,
    averageOrderValue,
    sales,
  };
};