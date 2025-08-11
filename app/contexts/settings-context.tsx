"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/firebase';
import { useAuth } from './auth-context';

export interface SystemSettings {
  signupEnabled: boolean;
  updatedAt: Date;
  updatedBy?: string;
}

interface SettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  updateSignupEnabled: (enabled: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  // Initialize default settings
  const initializeSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
      if (!settingsDoc.exists()) {
        const defaultSettings: SystemSettings = {
          signupEnabled: true,
          updatedAt: new Date(),
        };
        await setDoc(doc(db, 'system', 'settings'), defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  };

  // Update signup enabled status
  const updateSignupEnabled = async (enabled: boolean) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only admins can update system settings');
    }

    try {
      const updatedSettings: SystemSettings = {
        signupEnabled: enabled,
        updatedAt: new Date(),
        updatedBy: userProfile.uid,
      };

      await setDoc(doc(db, 'system', 'settings'), updatedSettings, { merge: true });
    } catch (error) {
      console.error('Error updating signup setting:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Initialize settings if they don't exist
    initializeSettings();

    // Listen for real-time updates to settings
    const unsubscribe = onSnapshot(
      doc(db, 'system', 'settings'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSettings({
            signupEnabled: data.signupEnabled ?? true,
            updatedAt: data.updatedAt?.toDate() || new Date(),
            updatedBy: data.updatedBy,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to settings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value: SettingsContextType = {
    settings,
    loading,
    updateSignupEnabled,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}