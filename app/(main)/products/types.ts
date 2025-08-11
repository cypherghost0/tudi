import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  barcode?: string;
  category: string;
  brand: string;
  model?: string;
  condition: string;
  specifications?: string;
  warranty?: string;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  piecesPerUnit: number;
  totalPieces: number;
  trackIndividualPieces: boolean;
  pieceIdentifiers?: string[];
  imageUrl?: string | null; // Add imageUrl property
  profitMargin: number;
  stockStatus: 'Low Stock' | 'In Stock';
  inventoryDetails: {
    totalPieces: number;
    piecesPerUnit: number;
    trackIndividualPieces: boolean;
    pieceIdentifiers: string[];
    lastStockUpdate: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minStock?: number;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
