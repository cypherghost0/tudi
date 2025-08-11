import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface OfflineQueueDB extends DBSchema {
  'pending-sales': {
    key: string;
    value: {
      id: string;
      items: unknown[];
      total: number;
      tax: number;
      finalTotal: number;
      paymentMethod: 'cash' | 'card' | 'mobile';
      soldBy: string;
      soldByName: string;
      customerInfo: unknown;
      timestamp: number;
      status: 'pending_sync';
      retryCount: number;
      lastRetry?: number;
    };
    indexes: {
      'timestamp': number;
      'status': 'pending_sync';
    };
  };
  'pending-operations': {
    key: string;
    value: {
      id: string;
      type: 'sale' | 'product_update' | 'stock_update';
      data: Record<string, unknown>;
      timestamp: number;
      retryCount: number;
      lastRetry?: number;
    };
    indexes: {
      'type': 'sale' | 'product_update' | 'stock_update';
      'timestamp': number;
    };
  };
  'cached-data': {
    key: string;
    value: {
      key: string;
      data: Record<string, unknown>;
      timestamp: number;
      expiresAt?: number;
    };
    indexes: {
      'timestamp': number;
      'expiresAt': number;
    };
  };
}

class OfflineQueueManager {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private dbName = 'loken-offline-queue';
  private dbVersion = 1;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      this.db = await openDB<OfflineQueueDB>(this.dbName, this.dbVersion, {
        upgrade(db) {
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains('pending-sales')) {
            const salesStore = db.createObjectStore('pending-sales', { keyPath: 'id' });
            salesStore.createIndex('timestamp', 'timestamp');
            salesStore.createIndex('status', 'status');
          }

          if (!db.objectStoreNames.contains('pending-operations')) {
            const opsStore = db.createObjectStore('pending-operations', { keyPath: 'id' });
            opsStore.createIndex('type', 'type');
            opsStore.createIndex('timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('cached-data')) {
            const cacheStore = db.createObjectStore('cached-data', { keyPath: 'key' });
            cacheStore.createIndex('timestamp', 'timestamp');
            cacheStore.createIndex('expiresAt', 'expiresAt');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline queue database:', error);
    }
  }

  // Sales queue methods
  async addPendingSale(sale: Omit<OfflineQueueDB['pending-sales']['value'], 'id' | 'retryCount'>): Promise<string> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const saleData: OfflineQueueDB['pending-sales']['value'] = {
      ...sale,
      id,
      retryCount: 0,
    };

    await this.db.add('pending-sales', saleData);
    console.log('Added pending sale to offline queue:', id);
    return id;
  }

  async getPendingSales(): Promise<OfflineQueueDB['pending-sales']['value'][]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return await this.db.getAll('pending-sales');
  }

  async removePendingSale(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    await this.db.delete('pending-sales', id);
    console.log('Removed pending sale from queue:', id);
  }

  async updateSaleRetryCount(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const sale = await this.db.get('pending-sales', id);
    if (sale) {
      sale.retryCount += 1;
      sale.lastRetry = Date.now();
      await this.db.put('pending-sales', sale);
    }
  }

  // Operations queue methods
  async addPendingOperation(operation: Omit<OfflineQueueDB['pending-operations']['value'], 'id' | 'retryCount'>): Promise<string> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const opData: OfflineQueueDB['pending-operations']['value'] = {
      ...operation,
      id,
      retryCount: 0,
    };

    await this.db.add('pending-operations', opData);
    console.log('Added pending operation to offline queue:', id);
    return id;
  }

  async getPendingOperations(): Promise<OfflineQueueDB['pending-operations']['value'][]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return await this.db.getAll('pending-operations');
  }

  async removePendingOperation(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    await this.db.delete('pending-operations', id);
    console.log('Removed pending operation from queue:', id);
  }

  async updateOperationRetryCount(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const operation = await this.db.get('pending-operations', id);
    if (operation) {
      operation.retryCount += 1;
      operation.lastRetry = Date.now();
      await this.db.put('pending-operations', operation);
    }
  }

  // Cache methods
  async setCachedData(key: string, data: unknown, expiresInMs?: number): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const cacheData: OfflineQueueDB['cached-data']['value'] = {
      key,
      data: data as Record<string, unknown>,
      timestamp: Date.now(),
      expiresAt: expiresInMs ? Date.now() + expiresInMs : undefined,
    };

    await this.db.put('cached-data', cacheData);
  }

  async getCachedData(key: string): Promise<unknown | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const cached = await this.db.get('cached-data', key);
    if (!cached) return null;

    // Check if expired
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      await this.db.delete('cached-data', key);
      return null;
    }

    return cached.data;
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const now = Date.now();
    const allCached = await this.db.getAll('cached-data');
    
    for (const item of allCached) {
      if (item.expiresAt && now > item.expiresAt) {
        await this.db.delete('cached-data', item.key);
      }
    }
  }

  // Utility methods
  async getQueueStats(): Promise<{
    pendingSales: number;
    pendingOperations: number;
    cachedItems: number;
  }> {
    if (!this.db) await this.init();
    if (!this.db) return { pendingSales: 0, pendingOperations: 0, cachedItems: 0 };

    const [pendingSales, pendingOperations, cachedItems] = await Promise.all([
      this.db.count('pending-sales'),
      this.db.count('pending-operations'),
      this.db.count('cached-data'),
    ]);

    return { pendingSales, pendingOperations, cachedItems };
  }

  async clearAllQueues(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    await Promise.all([
      this.db.clear('pending-sales'),
      this.db.clear('pending-operations'),
      this.db.clear('cached-data'),
    ]);

    console.log('Cleared all offline queues');
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();

// Initialize on import if in browser
if (typeof window !== 'undefined') {
  offlineQueue.init().catch(console.error);
}