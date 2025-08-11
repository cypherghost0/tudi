"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CashierOnly } from '@/app/components/auth/protected-route';
import { useAuth } from '@/app/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Product, SaleItem, Sale } from '@/app/lib/types/types';
import { getProducts } from '@/app/lib/firebase/products';
import { createSale, getSalesByUser } from '@/app/lib/firebase/sales';
import { createCustomer } from '@/app/lib/firebase/customers';
import { useOffline } from '@/app/hooks/use-offline';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  User, 
  Receipt,
  History,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Shield,
  FileText,
  Printer
} from 'lucide-react';

interface CartItem extends SaleItem {
  productId: string;
  warrantyPeriod?: number; // in months
  serialNumber?: string;
}

interface ExtendedCustomerInfo {
  name: string;
  phone: string;
  address?: string;
}

export default function SalesPage() {
  return (
    <CashierOnly>
      <POSContent />
    </CashierOnly>
  );
}

function POSContent() {
  const { userProfile } = useAuth();
  const { isOnline, cachedProducts, syncOfflineData, queueLength, addSaleToOfflineQueue } = useOffline();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<ExtendedCustomerInfo>({
    name: '',
    phone: '',
    address: ''
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } else {
        // Use cached products when offline
        setProducts(cachedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to cached products
      setProducts(cachedProducts);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, cachedProducts]);

  const fetchRecentSales = useCallback(async () => {
    if (userProfile?.uid) {
      try {
        const sales = await getSalesByUser(userProfile.uid);
        // Get today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = sales.filter(sale =>
          new Date(sale.timestamp.seconds * 1000) >= today
        );
        setRecentSales(todaySales);
      } catch (error) {
        console.error('Error fetching recent sales:', error);
      }
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    fetchProducts();
    fetchRecentSales();
  }, [fetchProducts, fetchRecentSales]);

  useEffect(() => {
    const filtered = products.filter(product =>
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      alert('This product is out of stock.');
      return;
    }
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > product.stock) {
          alert(`Only ${product.stock} items available in stock.`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
            : item
        );
      } else {
        return [...prevCart, {
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
          warrantyPeriod: product.warrantyPeriod || 12, // Default 12 months
          serialNumber: '',
          warrantyStartDate: new Date(),
          warrantyEndDate: new Date(Date.now() + (product.warrantyPeriod || 12) * 30 * 24 * 60 * 60 * 1000)
        }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Only ${product.stock} items available in stock.`);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
          : item
      )
    );
  };

  const updateSerialNumber = (productId: string, serialNumber: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, serialNumber }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', address: '' });
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  type PaymentMethod = 'cash' | 'card' | 'mobile';
  
  const handleCheckout = async (paymentMethod: PaymentMethod) => {
    if (cart.length === 0) {
      alert('Please add items to cart before checkout.');
      return;
    }

    if (!customerInfo.name.trim()) {
      alert('Please enter customer name.');
      return;
    }

    if (!customerInfo.phone.trim()) {
      alert('Please enter customer phone number.');
      return;
    }

    // Validate cart items have required fields
    const invalidItems = cart.filter(item => !item.productId || !item.id || item.quantity <= 0);
    if (invalidItems.length > 0) {
      alert('Some items in cart are invalid. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    try {
      // Clean cart items to ensure no undefined values
      const items = cart.map(item => ({
        id: item.id || '',
        productId: item.productId || '',
        name: item.name || '',
        price: item.price || 0,
        quantity: item.quantity || 0,
        subtotal: item.subtotal || 0,
        warrantyPeriod: item.warrantyPeriod || 0,
        serialNumber: item.serialNumber || '',
        warrantyStartDate: item.warrantyStartDate || new Date(),
        warrantyEndDate: item.warrantyEndDate || new Date()
      }));
      
      const total = getTotal();
      const soldBy = userProfile?.uid || '';
      const soldByName = userProfile?.displayName || '';
      const timestamp = new Date();

      if (!soldBy) {
        throw new Error('User not authenticated. Please log in again.');
      }

      let saleId: string;
      let customerId: string;

      if (isOnline) {
        // Online: Create customer and sale normally
        try {
          customerId = await createCustomer({
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address || '',
            email: '', // Optional field
            createdAt: timestamp,
            lastPurchase: timestamp,
            totalPurchases: 1,
            totalSpent: total,
            notes: '' // Optional field
          });
        } catch (customerError) {
          console.error('Error creating customer:', customerError);
          throw new Error('Failed to create customer record. Please try again.');
        }

        try {
          saleId = await createSale(
            items,
            total,
            0, // No tax
            total, // Final total equals subtotal
            paymentMethod,
            soldBy,
            soldByName,
            {
              ...customerInfo,
              customerId
            },
            false
          );
        } catch (saleError) {
          console.error('Error creating sale:', saleError);
          throw new Error('Failed to process sale. Please try again.');
        }
      } else {
        // Offline: Add to queue
        customerId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          saleId = await addSaleToOfflineQueue({
            items,
            total,
            tax: 0,
            finalTotal: total,
            paymentMethod,
            soldBy,
            soldByName,
            customerInfo: {
              ...customerInfo,
              customerId
            }
          });
        } catch (offlineError) {
          console.error('Error adding sale to offline queue:', offlineError);
          throw new Error('Failed to queue sale for offline processing. Please try again.');
        }
      }

      const newSale: Sale = {
        id: saleId,
        items,
        total,
        tax: 0,
        finalTotal: total,
        paymentMethod,
        soldBy,
        soldByName,
        customerInfo: {
          ...customerInfo,
          customerId
        },
        timestamp: {
          seconds: Math.floor(timestamp.getTime() / 1000),
          nanoseconds: (timestamp.getTime() % 1000) * 1000000,
        },
        isOfflineSale: !isOnline,
        status: !isOnline ? 'pending_sync' : 'completed',
        date: timestamp.getTime(),
        cashierId: soldBy,
        products: items,
      };
      
      setLastSale(newSale);
      clearCart();
      
      if (isOnline) {
        fetchRecentSales();
      }
      
      // Switch to receipt tab automatically
      const receiptTab = document.querySelector('[data-value="receipt"]') as HTMLElement;
      if (receiptTab) {
        receiptTab.click();
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while processing sale. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReceipt = () => {
    if (!lastSale) return '';
    
    return `
Godwin Electronics Store
Receipt #${lastSale.id.slice(-8).toUpperCase()}
Date: ${new Date(lastSale.timestamp.seconds * 1000).toLocaleString()}
Cashier: ${lastSale.soldByName}

Customer: ${lastSale.customerInfo.name}
Phone: ${lastSale.customerInfo.phone}
${lastSale.customerInfo.address ? `Address: ${lastSale.customerInfo.address}` : ''}

Items:
${lastSale.items.map(item =>
  `${item.name}
   ${item.quantity} × $${item.price.toFixed(2)} = $${item.subtotal.toFixed(2)}
   ${item.warrantyPeriod ? `Warranty: ${item.warrantyPeriod} months` : ''}
   ${item.serialNumber ? `Serial: ${item.serialNumber}` : ''}`
).join('\n')}

Total: $${lastSale.finalTotal.toFixed(2)}
Payment Method: ${lastSale.paymentMethod}
Status: ${lastSale.status}

Thank you for your purchase!
Warranty terms and conditions apply.
    `.trim();
  };

  const generateCustomerInvoice = () => {
    if (!lastSale) return '';
    
    const saleDate = new Date(lastSale.timestamp.seconds * 1000);
    const dueDate = new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from sale date
    
    return `
═══════════════════════════════════════════════════════════════════════════════
                              CUSTOMER INVOICE
═══════════════════════════════════════════════════════════════════════════════

GODWIN ELECTRONICS STORE
Goma ville, Q.Les Volcans
NIF: A1502983K
Phone: +(243) 991-033-484
Email: info@lokenelectronics.com
Website: www.lokenelectronics.com

Invoice #: INV-${lastSale.id.slice(-8).toUpperCase()}
Invoice Date: ${saleDate.toLocaleDateString()}
Due Date: ${dueDate.toLocaleDateString()}
Sales Representative: ${lastSale.soldByName}

───────────────────────────────────────────────────────────────────────────────
BILL TO:
───────────────────────────────────────────────────────────────────────────────
${lastSale.customerInfo.name}
${lastSale.customerInfo.phone}
${lastSale.customerInfo.address || 'Address not provided'}

───────────────────────────────────────────────────────────────────────────────
ITEMS PURCHASED:
───────────────────────────────────────────────────────────────────────────────
${'Item Description'.padEnd(45)} ${'Qty'.padEnd(5)} ${'Unit Price'.padEnd(12)} ${'Total'.padEnd(12)}
${'-'.repeat(80)}
${lastSale.items.map(item => {
  const name = item.name.length > 43 ? item.name.substring(0, 43) + '..' : item.name;
  return `${name.padEnd(45)} ${item.quantity.toString().padEnd(5)} $${item.price.toFixed(2).padEnd(11)} $${item.subtotal.toFixed(2).padEnd(11)}`;
}).join('\n')}
${'-'.repeat(80)}

${lastSale.items.some(item => item.serialNumber) ? `
SERIAL NUMBERS:
${lastSale.items.filter(item => item.serialNumber).map(item =>
  `${item.name}: ${item.serialNumber}`
).join('\n')}
` : ''}

WARRANTY INFORMATION:
${lastSale.items.map(item =>
  `${item.name}: ${item.warrantyPeriod || 12} months warranty from purchase date`
).join('\n')}

───────────────────────────────────────────────────────────────────────────────
PAYMENT SUMMARY:
───────────────────────────────────────────────────────────────────────────────
Subtotal:                                                    $${lastSale.total.toFixed(2)}
Tax (0%):                                                     $${lastSale.tax.toFixed(2)}
                                                              ${'-'.repeat(15)}
TOTAL AMOUNT:                                                 $${lastSale.finalTotal.toFixed(2)}
Payment Method: ${lastSale.paymentMethod.toUpperCase()}
Payment Status: ${lastSale.status === 'completed' ? 'PAID' : 'PENDING'}

───────────────────────────────────────────────────────────────────────────────
TERMS AND CONDITIONS:
───────────────────────────────────────────────────────────────────────────────
1. All sales are final unless otherwise specified.
2. Warranty is valid for the period specified for each item.
3. Items must be returned in original condition with receipt.
4. Warranty does not cover physical damage or misuse.
5. Customer service: support@lokenelectronics.com

───────────────────────────────────────────────────────────────────────────────
RETURN POLICY:
───────────────────────────────────────────────────────────────────────────────
• Returns accepted within 30 days of purchase with receipt
• Items must be in original packaging and condition
• Restocking fee may apply for certain items
• Warranty claims handled separately from returns

Thank you for choosing Godwin Electronics Store!
For support, contact us at +(243) 991-033-484 or support@godwinelectronics.com

Generated on: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════════════════════
    `.trim();
  };

  const downloadReceipt = () => {
    const receipt = generateReceipt();
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${lastSale?.id.slice(-8)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadCustomerInvoice = () => {
    const invoice = generateCustomerInvoice();
    const blob = new Blob([invoice], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${lastSale?.id.slice(-8)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReceipt = () => {
    const receipt = generateReceipt();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; white-space: pre-line; padding: 20px; }
            </style>
          </head>
          <body>${receipt}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printCustomerInvoice = () => {
    const invoice = generateCustomerInvoice();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Customer Invoice</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                white-space: pre-line; 
                padding: 20px; 
                font-size: 12px;
                line-height: 1.2;
              }
              @media print {
                body { margin: 0; padding: 10px; }
              }
            </style>
          </head>
          <body>${invoice}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with online/offline status */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Point de vente</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Bienvenue {userProfile?.displayName}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {/* Online/Offline Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-xs sm:text-sm text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-xs sm:text-sm text-red-600">Offline</span>
                </>
              )}
            </div>
            
            {/* Sync Status */}
            {queueLength > 0 && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs sm:text-sm text-blue-600">{queueLength} pending</span>
                {isOnline && (
                  <Button size="sm" variant="outline" onClick={syncOfflineData} className="text-xs">
                    Sync
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="pos" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pos" className="text-xs sm:text-sm">Produit en stock</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
            <TabsTrigger value="receipt" className="text-xs sm:text-sm" data-value="receipt">Facture</TabsTrigger>
          </TabsList>

          {/* POS Tab */}
          <TabsContent value="pos" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Product search and selection */}
              <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                {/* Product Search */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      Recherche et analyse de produits
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Rechercher par nom ou catégorie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search by name or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        autoFocus
                      />
                    </div>

                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-96 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex gap-2 sm:gap-3">
                                <Image
                                  src={product.imageUrl || '/placeholder-product.png'}
                                  alt={product.name}
                                  width={64}
                                  height={64}
                                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm sm:text-base truncate">{product.name}</h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground">{product.category}</p>
                                  <div className="flex items-center justify-between mt-1 sm:mt-2">
                                    <span className="font-medium text-sm sm:text-base">${product.price.toFixed(2)}</span>
                                    <Badge variant={product.stock > 0 ? "default" : "destructive"} className="text-xs">
                                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                    </Badge>
                                  </div>
                                  {product.warrantyPeriod && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Shield className="w-3 h-3 text-blue-500" />
                                      <span className="text-xs text-blue-600">{product.warrantyPeriod}mo warranty</span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(product)}
                                  disabled={product.stock === 0}
                                  className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
                                >
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cart and payment */}
              <div className="space-y-4 sm:space-y-6">
                {/* Cart */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      Cart ({cart.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">
                        Aucun article dans le panier
                      </p>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {cart.map((item) => (
                          <div key={item.productId} className="flex flex-col gap-2 p-2 sm:p-3 border rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
                                <p className="text-xs sm:text-sm font-medium">${item.price.toFixed(2)} each</p>
                                {item.warrantyPeriod && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Shield className="w-3 h-3 text-blue-500" />
                                    <span className="text-xs text-blue-600">{item.warrantyPeriod}mo warranty</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeFromCart(item.productId)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {/* Serial Number Input */}
                            <div className="mt-2">
                              <label className="text-xs font-medium text-muted-foreground">Numéro de série (facultatif)</label>
                              <Input
                                value={item.serialNumber || ''}
                                onChange={(e) => updateSerialNumber(item.productId, e.target.value)}
                                placeholder="Enter serial number"
                                className="text-xs h-8"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Informations client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Nom *</label>
                      <Input
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Customer name"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Phone *</label>
                      <Input
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1234567890"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Address (facultatif)</label>
                      <Input
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Customer address"
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Totals and payment */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Récapitulatif de la commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-base sm:text-lg">
                        <span>Total:</span>
                        <span>${getTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Payment buttons */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Mode de paiement:</p>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          onClick={() => handleCheckout('cash')}
                          disabled={isProcessing || cart.length === 0}
                          className="w-full"
                          size="lg"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {isProcessing ? 'Processing...' : 'Payer Cash'}
                        </Button>
                        <Button
                          onClick={() => handleCheckout('card')}
                          disabled={isProcessing || cart.length === 0}
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {isProcessing ? 'Processing...' : 'Payer avec Card'}
                        </Button>
                        <Button
                          onClick={() => handleCheckout('mobile')}
                          disabled={isProcessing || cart.length === 0}
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {isProcessing ? 'Processing...' : 'Paiement mobile Money'}
                        </Button>
                      </div>
                    </div>

                    {cart.length > 0 && (
                      <Button
                        onClick={clearCart}
                        variant="destructive"
                        className="w-full"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Vider le panier
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 w-7xl sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Today&apos;s Sales
                </CardTitle>
                <CardDescription>
                  Ventes réalisées aujourd&apos;hui par {userProfile?.displayName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentSales.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune vente réalisée aujourd&apos;hui
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentSales.map((sale) => (
                      <div key={sale.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Sale #{sale.id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sale.timestamp.seconds * 1000).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${sale.finalTotal.toFixed(2)}</p>
                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm"><strong>Customer:</strong> {sale.customerInfo.name}</p>
                          <p className="text-sm"><strong>Phone:</strong> {sale.customerInfo.phone}</p>
                          <p className="text-sm"><strong>Payment:</strong> {sale.paymentMethod}</p>
                          <p className="text-sm"><strong>Items:</strong> {sale.items.length}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Tab */}
          <TabsContent value="receipt" className="space-y-4 w-7xl sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Reçu et facture
                </CardTitle>
                <CardDescription>
                  {lastSale ? `Receipt for Sale #${lastSale.id.slice(-8).toUpperCase()}` : 'Aucune vente récente à afficher'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastSale ? (
                  <div className="space-y-6">
                    {/* Receipt Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={printReceipt} size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer le reçu
                      </Button>
                      <Button onClick={downloadReceipt} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger le reçu
                      </Button>
                      <Button onClick={printCustomerInvoice} variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Imprimer la facture
                      </Button>
                      <Button onClick={downloadCustomerInvoice} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger la facture
                      </Button>
                    </div>

                    <Separator />

                    {/* Receipt Preview */}
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-3">Aperçu du reçu:</h3>
                      <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border overflow-x-auto">
                        {generateReceipt()}
                      </pre>
                    </div>

                    <Separator />

                    {/* Customer Invoice Preview */}
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-3">Aperçu de la facture client:</h3>
                      <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border overflow-x-auto max-h-96 overflow-y-auto">
                        {generateCustomerInvoice()}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Finaliser une vente pour générer un reçu et une facture
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}