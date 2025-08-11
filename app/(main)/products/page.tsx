"use client";

import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { ProductManagementScreen } from './components/ProductManagementScreen';
import { useAuth } from '@/app/contexts/auth-context';

export default function ProductsPage() {
  const { userProfile } = useAuth();
  const isCashier = userProfile?.role === 'cashier';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestion des produits</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produits</CardTitle>
          <CardDescription>
            Gérez votre inventaire de produits, affichez les détails et suivez les niveaux de stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductManagementScreen isCashier={isCashier} />
        </CardContent>
      </Card>
    </div>
  );
}
