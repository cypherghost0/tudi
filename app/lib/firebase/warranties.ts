// /app/lib/firebase/warranties.ts
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Warranty, WarrantyClaim } from '../types/types';

const WARRANTIES_COLLECTION = 'warranties';
const WARRANTY_CLAIMS_COLLECTION = 'warranty_claims';

// Create warranties for sold items
export async function createWarranties(
  saleId: string,
  customerId: string,
  items: Array<{
    productId: string;
    productName: string;
    serialNumber?: string;
    warrantyPeriod?: number;
  }>
): Promise<string[]> {
  try {
    const warrantyIds: string[] = [];
    const currentDate = new Date();

    for (const item of items) {
      if (item.warrantyPeriod && item.warrantyPeriod > 0) {
        const endDate = new Date(currentDate);
        endDate.setMonth(endDate.getMonth() + item.warrantyPeriod);

        const warrantyDoc = {
          saleId,
          customerId,
          productId: item.productId,
          productName: item.productName,
          serialNumber: item.serialNumber || '',
          warrantyPeriod: item.warrantyPeriod,
          startDate: Timestamp.fromDate(currentDate),
          endDate: Timestamp.fromDate(endDate),
          status: 'active',
          claimHistory: [],
          notes: '',
          createdAt: Timestamp.fromDate(currentDate)
        };

        const docRef = await addDoc(collection(db, WARRANTIES_COLLECTION), warrantyDoc);
        warrantyIds.push(docRef.id);
      }
    }

    return warrantyIds;
  } catch (error) {
    console.error('Error creating warranties:', error);
    throw error;
  }
}

// Get warranty by ID
export async function getWarrantyById(warrantyId: string): Promise<Warranty | null> {
  try {
    const docRef = doc(db, WARRANTIES_COLLECTION, warrantyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      saleId: data.saleId,
      customerId: data.customerId,
      productId: data.productId,
      productName: data.productName,
      serialNumber: data.serialNumber,
      warrantyPeriod: data.warrantyPeriod,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      status: data.status,
      claimHistory: data.claimHistory || [],
      notes: data.notes
    };
  } catch (error) {
    console.error('Error getting warranty by ID:', error);
    throw error;
  }
}

// Get warranties by customer ID
export async function getWarrantiesByCustomer(customerId: string): Promise<Warranty[]> {
  try {
    const q = query(
      collection(db, WARRANTIES_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('startDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        saleId: data.saleId,
        customerId: data.customerId,
        productId: data.productId,
        productName: data.productName,
        serialNumber: data.serialNumber,
        warrantyPeriod: data.warrantyPeriod,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        status: data.status,
        claimHistory: data.claimHistory || [],
        notes: data.notes
      };
    });
  } catch (error) {
    console.error('Error getting warranties by customer:', error);
    throw error;
  }
}

// Get warranty by serial number
export async function getWarrantyBySerial(serialNumber: string): Promise<Warranty | null> {
  try {
    const q = query(
      collection(db, WARRANTIES_COLLECTION),
      where('serialNumber', '==', serialNumber),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      saleId: data.saleId,
      customerId: data.customerId,
      productId: data.productId,
      productName: data.productName,
      serialNumber: data.serialNumber,
      warrantyPeriod: data.warrantyPeriod,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      status: data.status,
      claimHistory: data.claimHistory || [],
      notes: data.notes
    };
  } catch (error) {
    console.error('Error getting warranty by serial:', error);
    throw error;
  }
}

// Get active warranties (not expired)
export async function getActiveWarranties(): Promise<Warranty[]> {
  try {
    const currentDate = new Date();
    const q = query(
      collection(db, WARRANTIES_COLLECTION),
      where('status', '==', 'active'),
      where('endDate', '>', Timestamp.fromDate(currentDate)),
      orderBy('endDate', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        saleId: data.saleId,
        customerId: data.customerId,
        productId: data.productId,
        productName: data.productName,
        serialNumber: data.serialNumber,
        warrantyPeriod: data.warrantyPeriod,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        status: data.status,
        claimHistory: data.claimHistory || [],
        notes: data.notes
      };
    });
  } catch (error) {
    console.error('Error getting active warranties:', error);
    throw error;
  }
}

// Get expiring warranties (within next 30 days)
export async function getExpiringWarranties(): Promise<Warranty[]> {
  try {
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date(currentDate);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const q = query(
      collection(db, WARRANTIES_COLLECTION),
      where('status', '==', 'active'),
      where('endDate', '>', Timestamp.fromDate(currentDate)),
      where('endDate', '<=', Timestamp.fromDate(thirtyDaysFromNow)),
      orderBy('endDate', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        saleId: data.saleId,
        customerId: data.customerId,
        productId: data.productId,
        productName: data.productName,
        serialNumber: data.serialNumber,
        warrantyPeriod: data.warrantyPeriod,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        status: data.status,
        claimHistory: data.claimHistory || [],
        notes: data.notes
      };
    });
  } catch (error) {
    console.error('Error getting expiring warranties:', error);
    throw error;
  }
}

// Update warranty status
export async function updateWarrantyStatus(
  warrantyId: string,
  status: 'active' | 'expired' | 'claimed' | 'void'
): Promise<void> {
  try {
    const docRef = doc(db, WARRANTIES_COLLECTION, warrantyId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating warranty status:', error);
    throw error;
  }
}

// Create warranty claim
export async function createWarrantyClaim(
  warrantyId: string,
  issue: string,
  handledBy: string,
  handledByName: string
): Promise<string> {
  try {
    const claimDoc = {
      warrantyId,
      claimDate: Timestamp.fromDate(new Date()),
      issue,
      resolution: '',
      status: 'pending',
      handledBy,
      handledByName,
      notes: '',
      createdAt: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, WARRANTY_CLAIMS_COLLECTION), claimDoc);
    
    // Update warranty status to claimed
    await updateWarrantyStatus(warrantyId, 'claimed');
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating warranty claim:', error);
    throw error;
  }
}

// Get warranty claims
export async function getWarrantyClaims(warrantyId?: string): Promise<WarrantyClaim[]> {
  try {
    let q;
    if (warrantyId) {
      q = query(
        collection(db, WARRANTY_CLAIMS_COLLECTION),
        where('warrantyId', '==', warrantyId),
        orderBy('claimDate', 'desc')
      );
    } else {
      q = query(
        collection(db, WARRANTY_CLAIMS_COLLECTION),
        orderBy('claimDate', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        warrantyId: data.warrantyId,
        claimDate: data.claimDate.toDate(),
        issue: data.issue,
        resolution: data.resolution,
        status: data.status,
        handledBy: data.handledBy,
        handledByName: data.handledByName,
        notes: data.notes
      };
    });
  } catch (error) {
    console.error('Error getting warranty claims:', error);
    throw error;
  }
}

// Update warranty claim
export async function updateWarrantyClaim(
  claimId: string,
  updates: {
    resolution?: string;
    status?: 'pending' | 'approved' | 'denied' | 'completed';
    notes?: string;
  }
): Promise<void> {
  try {
    const docRef = doc(db, WARRANTY_CLAIMS_COLLECTION, claimId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating warranty claim:', error);
    throw error;
  }
}

// Check warranty validity
export function isWarrantyValid(warranty: Warranty): boolean {
  const currentDate = new Date();
  return warranty.status === 'active' && warranty.endDate > currentDate;
}

// Get warranty status text
export function getWarrantyStatusText(warranty: Warranty): string {
  const currentDate = new Date();
  
  if (warranty.status === 'void') return 'Void';
  if (warranty.status === 'claimed') return 'Claimed';
  if (warranty.endDate < currentDate) return 'Expired';
  if (warranty.status === 'active') return 'Active';
  
  return 'Unknown';
}

// Calculate remaining warranty days
export function getRemainingWarrantyDays(warranty: Warranty): number {
  const currentDate = new Date();
  const timeDiff = warranty.endDate.getTime() - currentDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}