// /app/lib/firebase/customers.ts
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
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address?: string;
  email?: string; // Optional for future use
  createdAt: Date;
  lastPurchase: Date;
  totalPurchases: number;
  totalSpent: number;
  notes?: string;
  isActive: boolean;
}

export interface CustomerInput {
  name: string;
  phone: string;
  address?: string;
  email?: string;
  createdAt: Date;
  lastPurchase: Date;
  totalPurchases: number;
  totalSpent: number;
  notes?: string;
}

const CUSTOMERS_COLLECTION = 'customers';

// Create a new customer
export async function createCustomer(customerData: CustomerInput): Promise<string> {
  try {
    // Check if customer with same phone already exists
    let existingCustomer = null;
    try {
      existingCustomer = await getCustomerByPhone(customerData.phone);
    } catch (lookupError) {
      console.warn('Error looking up existing customer, proceeding to create new:', lookupError);
    }
    
    if (existingCustomer) {
      // Update existing customer's purchase data
      try {
        await updateCustomerPurchaseData(existingCustomer.id!, {
          lastPurchase: customerData.lastPurchase,
          totalPurchases: customerData.totalPurchases,
          totalSpent: customerData.totalSpent
        });
        return existingCustomer.id!;
      } catch (updateError) {
        console.warn('Error updating existing customer, creating new:', updateError);
        // Fall through to create new customer
      }
    }

    const customerDoc = {
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address || '',
      email: customerData.email || '',
      createdAt: Timestamp.fromDate(customerData.createdAt),
      lastPurchase: Timestamp.fromDate(customerData.lastPurchase),
      totalPurchases: customerData.totalPurchases,
      totalSpent: customerData.totalSpent,
      notes: customerData.notes || '',
      isActive: true
    };

    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), customerDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Get customer by phone number
export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('phone', '==', phone),
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
      name: data.name,
      phone: data.phone,
      address: data.address,
      email: data.email,
      createdAt: data.createdAt.toDate(),
      lastPurchase: data.lastPurchase.toDate(),
      totalPurchases: data.totalPurchases,
      totalSpent: data.totalSpent,
      notes: data.notes,
      isActive: data.isActive
    };
  } catch (error) {
    console.error('Error getting customer by phone:', error);
    throw error;
  }
}

// Get customer by ID
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      email: data.email,
      createdAt: data.createdAt.toDate(),
      lastPurchase: data.lastPurchase.toDate(),
      totalPurchases: data.totalPurchases,
      totalSpent: data.totalSpent,
      notes: data.notes,
      isActive: data.isActive
    };
  } catch (error) {
    console.error('Error getting customer by ID:', error);
    throw error;
  }
}

// Get all customers
export async function getCustomers(): Promise<Customer[]> {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
        email: data.email,
        createdAt: data.createdAt.toDate(),
        lastPurchase: data.lastPurchase.toDate(),
        totalPurchases: data.totalPurchases,
        totalSpent: data.totalSpent,
        notes: data.notes,
        isActive: data.isActive
      };
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
}

// Update customer purchase data
export async function updateCustomerPurchaseData(
  customerId: string,
  purchaseData: {
    lastPurchase: Date;
    totalPurchases: number;
    totalSpent: number;
  }
): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(docRef, {
      lastPurchase: Timestamp.fromDate(purchaseData.lastPurchase),
      totalPurchases: increment(1),
      totalSpent: increment(purchaseData.totalSpent)
    });
  } catch (error) {
    console.error('Error updating customer purchase data:', error);
    throw error;
  }
}

// Update customer information
export async function updateCustomer(
  customerId: string,
  updates: Partial<Omit<Customer, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...updates };
    
    // Convert dates to Timestamps if they exist
    if (updates.lastPurchase) {
      updateData.lastPurchase = Timestamp.fromDate(updates.lastPurchase);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

// Soft delete customer (mark as inactive)
export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(docRef, {
      isActive: false
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
}

// Search customers by name or phone
export async function searchCustomers(searchTerm: string): Promise<Customer[]> {
  try {
    const customers = await getCustomers();
    
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
}

// Get top customers by total spent
export async function getTopCustomers(limitCount: number = 10): Promise<Customer[]> {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('isActive', '==', true),
      orderBy('totalSpent', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
        email: data.email,
        createdAt: data.createdAt.toDate(),
        lastPurchase: data.lastPurchase.toDate(),
        totalPurchases: data.totalPurchases,
        totalSpent: data.totalSpent,
        notes: data.notes,
        isActive: data.isActive
      };
    });
  } catch (error) {
    console.error('Error getting top customers:', error);
    throw error;
  }
}