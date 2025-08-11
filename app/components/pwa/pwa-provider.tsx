"use client";

import { useEffect } from 'react';
import { InstallPrompt } from './install-prompt';
import { UpdateNotification } from './update-notification';
import { PWAStatus } from './pwa-status';
import { OfflineStatus } from '../offline-status';
import { initializePWA } from '@/app/lib/pwa-utils';

export function PWAProvider() {
  useEffect(() => {
    // Initialize PWA features
    initializePWA().catch(console.error);
  }, []);

  return (
    <>
      <InstallPrompt />
      <UpdateNotification />
      <PWAStatus />
      <OfflineStatus />
    </>
  );
}