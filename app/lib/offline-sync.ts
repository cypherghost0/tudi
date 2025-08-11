import { createSale, getOfflineSales, markSaleAsSynced } from './firebase/sales';
import { getProducts, updateProduct } from './firebase/products';
import { offlineQueue } from './offline-queue';
import { SaleItem, CustomerInfo } from './types/types';

class OfflineSyncService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private queueStats = { pendingSales: 0, pendingOperations: 0, cachedItems: 0 };

  constructor() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.initializeEventListeners();
      this.updateQueueStats();
    }
  }

  private initializeEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App went offline - operations will be queued');
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineData();
      }
    });

    // Periodic cleanup of expired cache
    setInterval(() => {
      offlineQueue.clearExpiredCache().catch(console.error);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async updateQueueStats() {
    try {
      this.queueStats = await offlineQueue.getQueueStats();
    } catch (error) {
      console.error('Error updating queue stats:', error);
    }
  }

  async addSaleToQueue(saleData: {
    items: unknown[];
    total: number;
    tax: number;
    finalTotal: number;
    paymentMethod: 'cash' | 'card' | 'mobile';
    soldBy: string;
    soldByName: string;
    customerInfo: unknown;
  }): Promise<string> {
    try {
      const id = await offlineQueue.addPendingSale({
        ...saleData,
        timestamp: Date.now(),
        status: 'pending_sync',
      });
      await this.updateQueueStats();
      return id;
    } catch (error) {
      console.error('Error adding sale to queue:', error);
      throw error;
    }
  }

  async addOperationToQueue(operation: {
    type: 'sale' | 'product_update' | 'stock_update';
    data: Record<string, unknown>;
  }): Promise<string> {
    try {
      const id = await offlineQueue.addPendingOperation({
        ...operation,
        timestamp: Date.now(),
      });
      await this.updateQueueStats();
      return id;
    } catch (error) {
      console.error('Error adding operation to queue:', error);
      throw error;
    }
  }

  private async handleOnline() {
    console.log('App is back online - syncing offline data...');
    await this.syncOfflineData();
  }

  async syncOfflineData() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting offline data sync...');

    try {
      await this.syncPendingSales();
      await this.syncPendingOperations();
      await this.syncFirestoreOfflineSales();
      await this.updateQueueStats();
      console.log('Offline data sync completed successfully');
    } catch (error) {
      console.error('Error during offline data sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncPendingSales() {
    try {
      const pendingSales = await offlineQueue.getPendingSales();
      console.log(`Syncing ${pendingSales.length} pending sales...`);

      for (const sale of pendingSales) {
        try {
          // Attempt to create the sale in Firestore
          await createSale(
            sale.items as unknown as SaleItem[], // Type assertion for sale items
            sale.total,
            sale.tax,
            sale.finalTotal,
            sale.paymentMethod,
            sale.soldBy,
            sale.soldByName,
            sale.customerInfo as unknown as CustomerInfo, // Type assertion for customer info
            false // Mark as online sale since we're syncing
          );

          // Remove from queue on success
          await offlineQueue.removePendingSale(sale.id);
          console.log(`Successfully synced sale: ${sale.id}`);
        } catch (error) {
          console.error(`Error syncing sale ${sale.id}:`, error);
          
          // Update retry count
          await offlineQueue.updateSaleRetryCount(sale.id);
          
          // Remove from queue if too many retries (prevent infinite loops)
          if (sale.retryCount >= 5) {
            console.warn(`Removing sale ${sale.id} after 5 failed attempts`);
            await offlineQueue.removePendingSale(sale.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing pending sales:', error);
    }
  }

  private async syncPendingOperations() {
    try {
      const pendingOperations = await offlineQueue.getPendingOperations();
      console.log(`Syncing ${pendingOperations.length} pending operations...`);

      for (const operation of pendingOperations) {
        try {
          await this.processOperation(operation);
          await offlineQueue.removePendingOperation(operation.id);
          console.log(`Successfully synced operation: ${operation.id}`);
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
          
          // Update retry count
          await offlineQueue.updateOperationRetryCount(operation.id);
          
          // Remove from queue if too many retries
          if (operation.retryCount >= 5) {
            console.warn(`Removing operation ${operation.id} after 5 failed attempts`);
            await offlineQueue.removePendingOperation(operation.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing pending operations:', error);
    }
  }

  private async syncFirestoreOfflineSales() {
    try {
      const offlineSales = await getOfflineSales();
      
      for (const sale of offlineSales) {
        try {
          await markSaleAsSynced(sale.id);
          console.log(`Synced Firestore offline sale: ${sale.id}`);
        } catch (error) {
          console.error(`Error syncing Firestore sale ${sale.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing Firestore offline sales:', error);
    }
  }

  private async processOperation(operation: Record<string, unknown>) {
    const data = operation.data as Record<string, unknown>; // Type assertion for operation data
    switch (operation.type) {
      case 'product_update':
        if (data.id && typeof data.id === 'string') {
          await updateProduct(data.id, data);
        }
        break;
      case 'stock_update':
        if (data.productId && typeof data.productId === 'string' && typeof data.newStock === 'number') {
          await updateProduct(data.productId, {
            stock: data.newStock,
            updatedAt: new Date()
          });
        }
        break;
      default:
        console.warn('Unknown operation type:', operation.type);
    }
  }

  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queueStats.pendingSales + this.queueStats.pendingOperations,
      syncInProgress: this.syncInProgress,
      pendingSales: this.queueStats.pendingSales,
      pendingOperations: this.queueStats.pendingOperations,
      cachedItems: this.queueStats.cachedItems,
    };
  }

  getQueueLength() {
    return this.queueStats.pendingSales + this.queueStats.pendingOperations;
  }

  isOnlineStatus() {
    return this.isOnline;
  }

  // Cache management methods
  async cacheData(key: string, data: Record<string, unknown>, expiresInMs?: number) {
    await offlineQueue.setCachedData(key, data, expiresInMs);
  }

  async getCachedData(key: string) {
    return await offlineQueue.getCachedData(key);
  }

  async clearAllQueues() {
    await offlineQueue.clearAllQueues();
    await this.updateQueueStats();
  }
}

// Factory function to get a client-only instance
export function getOfflineSyncService() {
  if (typeof window === 'undefined') return null;
  return new OfflineSyncService();
}

// Enhanced cache products using IndexedDB
export const cacheProducts = async () => {
  if (typeof window === 'undefined') return;
  try {
    const products = await getProducts();
    await offlineQueue.setCachedData('products', products, 24 * 60 * 60 * 1000); // Cache for 24 hours
    console.log('Products cached for offline access');
  } catch (error) {
    console.error('Error caching products:', error);
    // Fallback to localStorage
    try {
      const products = await getProducts();
      localStorage.setItem('cachedProducts', JSON.stringify(products));
    } catch (fallbackError) {
      console.error('Fallback caching also failed:', fallbackError);
    }
  }
};

// Get cached products with IndexedDB fallback to localStorage
export const getCachedProducts = async () => {
  if (typeof window === 'undefined') return [];
  try {
    // Try IndexedDB first
    const cached = await offlineQueue.getCachedData('products');
    if (cached) return cached;
    
    // Fallback to localStorage
    const localCached = localStorage.getItem('cachedProducts');
    return localCached ? JSON.parse(localCached) : [];
  } catch (error) {
    console.error('Error getting cached products:', error);
    return [];
  }
};

// Clear all caches
export const clearCache = async () => {
  if (typeof window === 'undefined') return;
  try {
    await offlineQueue.clearAllQueues();
    localStorage.removeItem('cachedProducts');
    localStorage.removeItem('offlineSyncQueue');
    console.log('All caches cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Cache other data types
export const cacheCustomers = async () => {
  if (typeof window === 'undefined') return;
  try {
    // Import customers function when needed
    const { getCustomers } = await import('./firebase/customers');
    const customers = await getCustomers();
    await offlineQueue.setCachedData('customers', customers, 12 * 60 * 60 * 1000); // Cache for 12 hours
    console.log('Customers cached for offline access');
  } catch (error) {
    console.error('Error caching customers:', error);
  }
};

export const getCachedCustomers = async () => {
  if (typeof window === 'undefined') return [];
  try {
    return await offlineQueue.getCachedData('customers') || [];
  } catch (error) {
    console.error('Error getting cached customers:', error);
    return [];
  }
};