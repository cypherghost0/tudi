"use client";

// Define BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// PWA Utilities for Loken
export class PWAUtils {
  private static instance: PWAUtils;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): PWAUtils {
    if (!PWAUtils.instance) {
      PWAUtils.instance = new PWAUtils();
    }
    return PWAUtils.instance;
  }

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              this.notifyUpdate();
            }
          });
        }
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Check for updates
  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('Checked for service worker updates');
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }
  }

  // Skip waiting and activate new service worker
  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Get service worker version
  async getVersion(): Promise<string> {
    return new Promise((resolve) => {
      if (this.registration?.active) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.version || 'unknown');
        };
        this.registration.active.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
      } else {
        resolve('unknown');
      }
    });
  }

  // Cache specific URLs
  cacheUrls(urls: string[]): void {
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'CACHE_URLS',
        data: { urls }
      });
    }
  }

  // Check if app is installed
  isInstalled(): boolean {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return isStandalone || isIOSStandalone;
  }

  // Check if device is iOS
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Check if device is mobile
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Get connection information
  getConnectionInfo(): {
    online: boolean;
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } {
    const connection = (navigator as unknown as {
      connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; };
      mozConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; };
      webkitConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; };
    }).connection || (navigator as unknown as { mozConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; } }).mozConnection || (navigator as unknown as { webkitConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; } }).webkitConnection;
    
    return {
      online: navigator.onLine,
      type: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    };
  }

  // Get battery information
  async getBatteryInfo(): Promise<{
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  } | null> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as unknown as { getBattery(): Promise<{
          level: number;
          charging: boolean;
          chargingTime: number;
          dischargingTime: number;
        }> }).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch {
        console.log('Battery API not supported');
        return null;
      }
    }
    return null;
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('Persistent storage:', persistent);
        return persistent;
      } catch (error) {
        console.error('Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  // Get storage estimate
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('Storage estimate:', estimate);
        return estimate;
      } catch (error) {
        console.error('Error getting storage estimate:', error);
        return null;
      }
    }
    return null;
  }

  // Share content using Web Share API
  async share(data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }
    return false;
  }

  // Check if Web Share API is supported
  canShare(data?: { files?: File[] }): boolean {
    if ('share' in navigator) {
      if (data?.files && 'canShare' in navigator) {
        return navigator.canShare(data);
      }
      return true;
    }
    return false;
  }

  // Add to home screen prompt
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  setInstallPrompt(event: BeforeInstallPromptEvent): void {
    this.deferredPrompt = event;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (this.deferredPrompt) {
      try {
        await this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
        return outcome === 'accepted';
      } catch (error) {
        console.error('Error showing install prompt:', error);
        return false;
      }
    }
    return false;
  }

  // Notification utilities
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    }
    return 'denied';
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (this.registration) {
        await this.registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          ...options
        });
      } else {
        new Notification(title, {
          icon: '/icon-192x192.png',
          ...options
        });
      }
    }
  }

  // Private method to notify about updates
  private notifyUpdate(): void {
    // Dispatch custom event for update notification
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  // Listen for service worker messages
  listenForMessages(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'SYNC_OFFLINE_DATA':
            window.dispatchEvent(new CustomEvent('sync-offline-data'));
            break;
          default:
            console.log('Unknown service worker message:', type, data);
        }
      });
    }
  }
}

// Export singleton instance
export const pwaUtils = PWAUtils.getInstance();

// Initialize PWA utilities
export const initializePWA = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    // Register service worker
    await pwaUtils.registerServiceWorker();
    
    // Listen for messages
    pwaUtils.listenForMessages();
    
    // Request persistent storage
    await pwaUtils.requestPersistentStorage();
    
    // Check for updates periodically
    setInterval(() => {
      pwaUtils.checkForUpdates();
    }, 30 * 60 * 1000); // Every 30 minutes

    console.log('PWA initialized successfully');
  } catch (error) {
    console.error('Error initializing PWA:', error);
  }
};