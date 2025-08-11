"use client";

import { useOffline } from '../hooks/use-offline';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function OfflineStatus() {
  const { isOnline, syncStatus, syncOfflineData, queueLength, pendingSales, pendingOperations } = useOffline();

  if (isOnline && queueLength === 0 && !syncStatus.syncInProgress) {
    return null; // Don't show anything when everything is synced and online
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Online</span>
              <Badge variant="default" className="text-xs">
                Connected
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Offline</span>
              <Badge variant="destructive" className="text-xs">
                No Connection
              </Badge>
            </>
          )}
        </div>

        {/* Sync Status */}
        {queueLength > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {syncStatus.syncInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm">Syncing...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{queueLength} items pending sync</span>
                  {isOnline && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={syncOfflineData}
                      className="h-6 px-2 text-xs"
                    >
                      Sync Now
                    </Button>
                  )}
                </>
              )}
            </div>
            {/* Detailed queue info */}
            {(pendingSales > 0 || pendingOperations > 0) && (
              <div className="text-xs text-muted-foreground">
                {pendingSales > 0 && <span>{pendingSales} sales</span>}
                {pendingSales > 0 && pendingOperations > 0 && <span>, </span>}
                {pendingOperations > 0 && <span>{pendingOperations} operations</span>}
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {isOnline && queueLength === 0 && syncStatus.syncInProgress === false && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">All data synced</span>
          </div>
        )}
      </div>
    </div>
  );
} 