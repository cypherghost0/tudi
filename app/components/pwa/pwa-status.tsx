"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor, 
  Download, 
  RefreshCw,
  Info,
  Battery,
  Signal
} from 'lucide-react';
import { useOffline } from '@/app/hooks/use-offline';

export function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSource, setInstallSource] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  
  const { isOnline, syncStatus, syncOfflineData } = useOffline();

  useEffect(() => {
    // Check if app is installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
      
      if (isStandalone) {
        setInstallSource('PWA');
      } else if (isIOSStandalone) {
        setInstallSource('iOS Home Screen');
      } else {
        setInstallSource('Browser');
      }
    };

    // Get battery information
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as unknown as { getBattery(): Promise<{
            level: number;
            charging: boolean;
            addEventListener: (event: string, callback: () => void) => void;
          }> }).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
          
          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch {
          console.log('Battery API not supported');
        }
      }
    };

    // Get connection information
    const getConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as unknown as { connection?: {
          effectiveType?: string;
          type?: string;
          addEventListener: (event: string, callback: () => void) => void;
        } }).connection;
        
        if (connection) {
          setConnectionType(connection.effectiveType || connection.type || 'unknown');
          
          connection.addEventListener('change', () => {
            setConnectionType(connection.effectiveType || connection.type || 'unknown');
          });
        }
      }
    };

    checkInstallStatus();
    getBatteryInfo();
    getConnectionInfo();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkInstallStatus();
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    
    switch (connectionType) {
      case '4g':
      case '3g':
        return <Signal className="w-4 h-4 text-green-500" />;
      case 'wifi':
        return <Wifi className="w-4 h-4 text-green-500" />;
      default:
        return <Wifi className="w-4 h-4 text-green-500" />;
    }
  };

  const getInstallIcon = () => {
    if (isInstalled) {
      return installSource === 'iOS Home Screen' ? 
        <Smartphone className="w-4 h-4 text-blue-500" /> : 
        <Monitor className="w-4 h-4 text-blue-500" />;
    }
    return <Download className="w-4 h-4 text-gray-500" />;
  };

  if (!showDetails) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(true)}
        className="fixed bottom-4 left-4 z-40 h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm border"
      >
        <Info className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-lg border bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5" />
                PWA Status
              </CardTitle>
              <CardDescription className="text-sm">
                App and connection information
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(false)}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getInstallIcon()}
              <span className="text-sm font-medium">Installation</span>
            </div>
            <Badge variant={isInstalled ? "default" : "secondary"}>
              {installSource}
            </Badge>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-sm font-medium">Connection</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              {connectionType && (
                <Badge variant="outline" className="text-xs">
                  {connectionType.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Sync Status */}
          {syncStatus.queueLength > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${syncStatus.syncInProgress ? 'animate-spin text-blue-500' : 'text-orange-500'}`} />
                <span className="text-sm font-medium">Sync Queue</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {syncStatus.queueLength} items
                </Badge>
                {isOnline && !syncStatus.syncInProgress && (
                  <Button size="sm" variant="outline" onClick={syncOfflineData}>
                    Sync
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Battery Status */}
          {batteryLevel !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className={`w-4 h-4 ${isCharging ? 'text-green-500' : batteryLevel > 20 ? 'text-blue-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium">Battery</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {batteryLevel}%
                </Badge>
                {isCharging && (
                  <Badge variant="default" className="text-xs">
                    Charging
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* App Version */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Version</span>
            <Badge variant="outline">v1.0.0</Badge>
          </div>

          {/* Cache Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cached Items</span>
            <Badge variant="outline">{syncStatus.cachedItems}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}