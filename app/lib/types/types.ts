export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  minStockLevel: number;
  imageUrl: string;
  description: string;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
  piecesPerUnit?: number;
  totalPieces?: number;
  trackIndividualPieces?: boolean;
  pieceIdentifiers?: string[];
  inventoryDetails?: {
    totalPieces: number;
    piecesPerUnit: number;
    trackIndividualPieces: boolean;
    pieceIdentifiers?: string[];
    lastStockUpdate: Date;
  };
  profitMargin?: number;
  stockStatus?: string;
  barcode?: string;
  isActive?: boolean;
  cost?: number;
  warrantyPeriod?: number; // in months
  requiresSerial?: boolean; // whether this product requires serial number tracking
}

export interface SaleItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  warrantyPeriod?: number; // in months
  serialNumber?: string; // optional serial number
  warrantyStartDate?: Date; // when warranty starts (usually sale date)
  warrantyEndDate?: Date; // when warranty ends
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerId?: string; // Reference to customer document
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  tax: number;
  finalTotal: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  soldBy: string;
  soldByName: string;
  customerInfo: CustomerInfo;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  isOfflineSale?: boolean;
  status: 'completed' | 'pending' | 'cancelled' | 'pending_sync';
  date: number;
  cashierId: string;
  products: SaleItem[];
  notes?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'cashier' | 'manager';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitPrice: number;
  totalValue: number;
  reference?: string; // Reference to sale, purchase order, etc.
  notes?: string;
  performedBy: string;
  performedByName: string;
  timestamp: Date;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  createdAt: Date;
  lastPurchase: Date;
  totalPurchases: number;
  totalSpent: number;
  notes?: string;
  isActive: boolean;
}

export interface Warranty {
  id: string;
  saleId: string;
  customerId: string;
  productId: string;
  productName: string;
  serialNumber?: string;
  warrantyPeriod: number; // in months
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'claimed' | 'void';
  claimHistory?: WarrantyClaim[];
  notes?: string;
}

export interface WarrantyClaim {
  id: string;
  warrantyId: string;
  claimDate: Date;
  issue: string;
  resolution?: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  handledBy?: string;
  handledByName?: string;
  notes?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockItems: number;
  todaySales: number;
  todayRevenue: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  recentSales: Sale[];
  salesByPaymentMethod: {
    cash: number;
    card: number;
    mobile: number;
  };
  monthlySales: Array<{
    month: string;
    sales: number;
    revenue: number;
  }>;
}

export interface Activity {
  id: string;
  type: 'sale' | 'stock_update' | 'user_login' | 'stock_alert' | 'product_added' | 'product_updated' | 'customer_added';
  title: string;
  description: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  userId?: string;
  userName?: string;
  relatedId?: string; // ID of related entity (product, sale, etc.)
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  type: 'stock_alert' | 'low_stock' | 'out_of_stock' | 'system' | 'sale_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  isRead: boolean;
  userId?: string; // If notification is user-specific
  relatedId?: string; // ID of related entity
  metadata?: Record<string, unknown>;
}
