import { useState, useEffect, useRef } from 'react';
import { getOfflineSyncService, cacheProducts, getCachedProducts } from '../lib/offline-sync';
import { Product } from '../lib/types/types';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    queueLength: 0,
    syncInProgress: false,
    pendingSales: 0,
    pendingOperations: 0,
    cachedItems: 0
  });
  const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
  const offlineSyncRef = useRef<ReturnType<typeof getOfflineSyncService> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only instantiate in the browser
    if (!offlineSyncRef.current) {
      offlineSyncRef.current = getOfflineSyncService();
    }
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached products (now async)
    const loadCachedProducts = async () => {
      try {
        const cached = await getCachedProducts();
        setCachedProducts(cached || []);
      } catch (error) {
        console.error('Error loading cached products:', error);
        setCachedProducts([]);
      }
    };

    loadCachedProducts().catch(console.error);

    // Cache products when online
    if (isOnline) {
      cacheProducts().then(async () => {
        await loadCachedProducts();
      }).catch(console.error);
    }

    // Update sync status periodically
    const interval = setInterval(() => {
      if (offlineSyncRef.current) {
        setSyncStatus(offlineSyncRef.current.getSyncStatus());
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  const syncOfflineData = async () => {
    if (offlineSyncRef.current) {
      await offlineSyncRef.current.syncOfflineData();
      setSyncStatus(offlineSyncRef.current.getSyncStatus());
    }
  };

  const addSaleToOfflineQueue = async (saleData: {
    items: unknown[];
    total: number;
    tax: number;
    finalTotal: number;
    paymentMethod: 'cash' | 'card' | 'mobile';
    soldBy: string;
    soldByName: string;
    customerInfo: unknown;
  }): Promise<string> => {
    if (offlineSyncRef.current) {
      try {
        const saleId = await offlineSyncRef.current.addSaleToQueue(saleData);
        setSyncStatus(offlineSyncRef.current.getSyncStatus());
        return saleId;
      } catch (error) {
        console.error('Error adding sale to offline queue:', error);
        throw error;
      }
    }
    throw new Error('Offline sync service not available');
  };

  const addOperationToOfflineQueue = async (operation: {
    type: 'sale' | 'product_update' | 'stock_update';
    data: Record<string, unknown>
  }) => {
    if (offlineSyncRef.current) {
      try {
        await offlineSyncRef.current.addOperationToQueue(operation);
        setSyncStatus(offlineSyncRef.current.getSyncStatus());
      } catch (error) {
        console.error('Error adding operation to offline queue:', error);
        throw error;
      }
    }
  };

  return {
    isOnline,
    syncStatus,
    cachedProducts,
    syncOfflineData,
    addSaleToOfflineQueue,
    addOperationToOfflineQueue,
    queueLength: syncStatus.queueLength,
    pendingSales: syncStatus.pendingSales,
    pendingOperations: syncStatus.pendingOperations,
  };
}