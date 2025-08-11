import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Activity, Notification, Product } from '../types/types';

const activitiesCollection = collection(db, 'activities');
const notificationsCollection = collection(db, 'notifications');

// Create a new activity
export const createActivity = async (
  type: Activity['type'],
  title: string,
  description: string,
  userId?: string,
  userName?: string,
  relatedId?: string,
  metadata?: Record<string, unknown>
): Promise<string> => {
  const activityData: Omit<Activity, 'id'> = {
    type,
    title,
    description,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    timestamp: serverTimestamp() as any,
    userId,
    userName,
    relatedId,
    metadata,
  };

  const docRef = await addDoc(activitiesCollection, activityData);
  return docRef.id;
};

// Get recent activities
export const getRecentActivities = async (limitCount: number = 10): Promise<Activity[]> => {
  const q = query(
    activitiesCollection,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Activity));
};

// Get activities by user
export const getActivitiesByUser = async (userId: string, limitCount: number = 10): Promise<Activity[]> => {
  const q = query(
    activitiesCollection,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Activity));
};

// Create a new notification
export const createNotification = async (
  type: Notification['type'],
  title: string,
  message: string,
  severity: Notification['severity'],
  userId?: string,
  relatedId?: string,
  metadata?: Record<string, unknown>
): Promise<string> => {
  const notificationData: Omit<Notification, 'id'> = {
    type,
    title,
    message,
    severity,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    timestamp: serverTimestamp() as any,
    isRead: false,
    userId,
    relatedId,
    metadata,
  };

  const docRef = await addDoc(notificationsCollection, notificationData);
  return docRef.id;
};

// Get recent notifications
export const getRecentNotifications = async (limitCount: number = 10): Promise<Notification[]> => {
  const q = query(
    notificationsCollection,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
};

// Get unread notifications
export const getUnreadNotifications = async (userId?: string): Promise<Notification[]> => {
  let q;
  
  if (userId) {
    q = query(
      notificationsCollection,
      where('userId', '==', userId),
      where('isRead', '==', false),
      orderBy('timestamp', 'desc')
    );
  } else {
    q = query(
      notificationsCollection,
      where('isRead', '==', false),
      orderBy('timestamp', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(notificationsCollection, notificationId), {
    isRead: true,
  });
};

// Helper function to seed initial data for testing
export const seedInitialData = async (): Promise<void> => {
  try {
    // Create some sample activities
    await createActivity(
      'sale',
      'Nouvelle vente terminée',
      'Vente n° 12345 traitée avec succès - $45.99',
      'user123',
      'John Doe'
    );

    await createActivity(
      'stock_update',
      'Stock de produits mis à jour',
      'Le stock d\'Arduino Uno a augmenté de 50 unités',
      'admin456',
      'Admin User'
    );

    await createActivity(
      'user_login',
      'Connexion utilisateur',
      'Cashier John Doe s\'est connecté',
      'user123',
      'John Doe'
    );

    // Create some sample notifications
    await createNotification(
      'out_of_stock',
      'Produit en rupture de stock',
      'Arduino Starter Kit est en rupture de stock',
      'error',
      undefined,
      'product123'
    );

    await createNotification(
      'low_stock',
      'Stock faible',
      'Raspberry Pi 4 a un stock faible (5 restant)',
      'warning',
      undefined,
      'product456'
    );

    await createNotification(
      'system',
      'Système mis à jour',
      'Le système a été mis à jour avec succès',
      'success'
    );

    console.log('Initial data seeded successfully');
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

// Auto-create stock alerts based on product data
export const createStockAlerts = async (products: Product[]): Promise<void> => {
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStockLevel);

  // Create notifications for out of stock products
  for (const product of outOfStockProducts) {
    await createNotification(
      'out_of_stock',
      'Produit en rupture de stock',
      `${product.name} est en rupture de stock`,
      'error',
      undefined,
      product.id,
      { productName: product.name, stock: product.stock }
    );
  }

  // Create notifications for low stock products
  for (const product of lowStockProducts) {
    await createNotification(
      'low_stock',
      'Stock faible',
      `${product.name} a un stock faible (${product.stock} restant)`,
      'warning',
      undefined,
      product.id,
      { productName: product.name, stock: product.stock, minStockLevel: product.minStockLevel }
    );
  }
};

// Helper function to format time ago
export const formatTimeAgo = (timestamp: { seconds: number; nanoseconds: number }): string => {
  const now = new Date();
  const activityTime = new Date(timestamp.seconds * 1000);
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'À l\'instant';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} heure${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} jour${days > 1 ? 's' : ''} ago`;
  }
};