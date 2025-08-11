import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface SystemSettings {
  signupEnabled: boolean;
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * Get system settings from Firestore
 */
export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        signupEnabled: data.signupEnabled ?? true,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        updatedBy: data.updatedBy,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return null;
  }
};

/**
 * Update signup enabled status (admin only)
 */
export const updateSignupEnabled = async (
  enabled: boolean,
  adminUid: string
): Promise<void> => {
  try {
    const updatedSettings: SystemSettings = {
      signupEnabled: enabled,
      updatedAt: new Date(),
      updatedBy: adminUid,
    };

    await setDoc(doc(db, 'system', 'settings'), updatedSettings, { merge: true });
  } catch (error) {
    console.error('Error updating signup setting:', error);
    throw error;
  }
};

/**
 * Initialize default system settings if they don't exist
 */
export const initializeSystemSettings = async (): Promise<void> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
    if (!settingsDoc.exists()) {
      const defaultSettings: SystemSettings = {
        signupEnabled: true,
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'system', 'settings'), defaultSettings);
    }
  } catch (error) {
    console.error('Error initializing system settings:', error);
    throw error;
  }
};