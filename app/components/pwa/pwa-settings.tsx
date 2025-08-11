"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { 
  Smartphone, 
  Bell, 
  Download, 
  RefreshCw, 
  Trash2, 
  Database,
  Wifi,
  Battery,
  Share,
  Settings
} from 'lucide-react';
import { pwaUtils } from '@/app/lib/pwa-utils';

export function PWASettings() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageEstimate | null>(null);
  const [batteryInfo, setBatteryInfo] = useState<{
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  } | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<{
    online: boolean;
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } | null>(null);
  const [version, setVersion] = useState('unknown');

  useEffect(() => {
    const loadPWAInfo = async () => {
      // Check installation status
      setIsInstalled(pwaUtils.isInstalled());

      // Check notification permission
      setNotificationsEnabled(Notification.permission === 'granted');

      // Get storage info
      const storage = await pwaUtils.getStorageEstimate();
      setStorageInfo(storage);

      // Get battery info
      const battery = await pwaUtils.getBatteryInfo();
      setBatteryInfo(battery);

      // Get connection info
      setConnectionInfo(pwaUtils.getConnectionInfo());

      // Get service worker version
      const swVersion = await pwaUtils.getVersion();
      setVersion(swVersion);
    };

    loadPWAInfo();

    // Listen for connection changes
    const handleOnline = () => setConnectionInfo(pwaUtils.getConnectionInfo());
    const handleOffline = () => setConnectionInfo(pwaUtils.getConnectionInfo());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await pwaUtils.requestNotificationPermission();
      setNotificationsEnabled(permission === 'granted');
    } else {
      // Can't programmatically disable notifications, user must do it in browser settings
      alert('To disable notifications, please use your browser settings.');
    }
  };

  const handleInstallApp = async () => {
    const installed = await pwaUtils.showInstallPrompt();
    if (installed) {
      setIsInstalled(true);
    }
  };

  const handleCheckUpdates = async () => {
    await pwaUtils.checkForUpdates();
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cached data? This will remove offline content.')) {
      // Clear caches through service worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        alert('Cache cleared successfully. Please refresh the page.');
      }
    }
  };

  const handleShare = async () => {
    const shared = await pwaUtils.share({
      title: 'Godwin - Stock Management & POS',
      text: 'Check out this amazing stock management and POS system!',
      url: window.location.origin
    });

    if (!shared) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('App URL copied to clipboard!');
      } catch {
        alert('Sharing not supported on this device.');
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            PWA Settings
          </CardTitle>
          <CardDescription>
            Manage Progressive Web App features and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Installation Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <Label>App Installation</Label>
              </div>
              <Badge variant={isInstalled ? "default" : "secondary"}>
                {isInstalled ? 'Installed' : 'Not Installed'}
              </Badge>
            </div>
            {!isInstalled && (
              <Button onClick={handleInstallApp} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <Label htmlFor="notifications">Push Notifications</Label>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Receive notifications about important updates and sync status
            </p>
          </div>

          <Separator />

          {/* App Management */}
          <div className="space-y-3">
            <Label>App Management</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCheckUpdates}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check for Updates
              </Button>
              <Button variant="outline" onClick={handleClearCache}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
            </div>
          </div>

          <Separator />

          {/* Share App */}
          {pwaUtils.canShare() && (
            <>
              <div className="space-y-3">
                <Label>Share App</Label>
                <Button variant="outline" onClick={handleShare} className="w-full">
                  <Share className="w-4 h-4 mr-2" />
                  Share Godwin
                </Button>
              </div>
              <Separator />
            </>
          )}

          {/* App Information */}
          <div className="space-y-4">
            <Label>App Information</Label>
            
            {/* Version */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Version</span>
              <Badge variant="outline">{version}</Badge>
            </div>

            {/* Storage */}
            {storageInfo && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span className="text-sm">Storage Used</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatBytes(storageInfo.usage || 0)}
                  </div>
                  {storageInfo.quota && (
                    <div className="text-xs text-muted-foreground">
                      of {formatBytes(storageInfo.quota)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Connection</span>
              </div>
              <div className="text-right">
                <Badge variant={connectionInfo?.online ? "default" : "destructive"}>
                  {connectionInfo?.online ? 'Online' : 'Offline'}
                </Badge>
                {connectionInfo?.effectiveType && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {connectionInfo.effectiveType.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Battery */}
            {batteryInfo && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  <span className="text-sm">Battery</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {batteryInfo.level}%
                  </div>
                  {batteryInfo.charging && (
                    <div className="text-xs text-muted-foreground">
                      Charging
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}