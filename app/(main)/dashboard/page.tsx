"use client";

import { useState, useEffect } from 'react';
import { AdminOrCashierOnly } from '@/app/components/auth/protected-route';
import { useAuth } from '@/app/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Product } from '@/app/lib/types/types';
import { getProducts } from '@/app/lib/firebase/products';
import { getSales } from '@/app/lib/firebase/sales';
import { getRecentActivities, getRecentNotifications, formatTimeAgo } from '@/app/lib/firebase/activities';
import { Activity, Notification } from '@/app/lib/types/types';
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Settings,
  Download,
  RefreshCw,
  BarChart3,
  UserCheck,
  DollarSign,
  Clock,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AdminOrCashierOnly>
      <DashboardContent />
    </AdminOrCashierOnly>
  );
}

function DashboardContent() {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    todaySales: 0,
    weekSales: 0,
    totalRevenue: 0
  });

  // Determine user role - you might need to adjust this based on your auth structure
  const isAdmin = userProfile?.role === 'admin';
  const isCashier = userProfile?.role === 'cashier';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, salesData, activitiesData, notificationsData] = await Promise.all([
        getProducts(),
        getSales(),
        getRecentActivities(5),
        getRecentNotifications(10)
      ]);

      setProducts(productsData);
      setActivities(activitiesData);
      setNotifications(notificationsData);

      // Calculate stats
      const outOfStock = productsData.filter(p => p.stock === 0).length;
      const lowStock = productsData.filter(p => p.stock > 0 && p.stock <= p.minStockLevel).length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const todaySales = salesData.filter(sale =>
        new Date(sale.timestamp.seconds * 1000) >= today
      ).length;

      const weekSales = salesData.filter(sale =>
        new Date(sale.timestamp.seconds * 1000) >= weekAgo
      ).length;

      const totalRevenue = salesData.reduce((sum, sale) => sum + sale.finalTotal, 0);

      setStats({
        totalProducts: productsData.length,
        outOfStock,
        lowStock,
        todaySales,
        weekSales,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const csvData = products.map(product => [
      product.name,
      product.category,
      product.price,
      product.stock,
      product.supplier
    ]);

    const headers = ['Name', 'Category', 'Price', 'Stock', 'Supplier'];
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex w-7xl items-center justify-center bg-background p-2 sm:p-6">
      <div className="w-full mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isAdmin ? 'Admin Dashboard' : 'Cashier Dashboard'}
            </h1>
            <div className="flex items-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                Bienvenue, {userProfile?.displayName}
              </p>
              <Badge variant="secondary" className="ml-2 text-xs">
                {isAdmin ? 'Admin' : 'Cashier'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={fetchData} disabled={isLoading} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Rafraîchir</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            {isAdmin && (
              <Button onClick={exportData} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Exporter des données</span>
                <span className="sm:hidden">Export</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Overview - Different for Admin vs Cashier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isAdmin ? (
            // Admin Stats
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits totaux</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">In inventory</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-destructive">
                    {stats.outOfStock + stats.lowStock}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.outOfStock} out of stock, {stats.lowStock} low stock
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventes du jour</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.todaySales}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.weekSales} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </>
          ) : (
            // Cashier Stats - More focused on daily operations
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventes du jour</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.todaySales}</div>
                  <p className="text-xs text-muted-foreground">Transactions today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits disponibles</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {stats.totalProducts - stats.outOfStock}
                  </div>
                  <p className="text-xs text-muted-foreground">In stock</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-destructive">
                    {stats.outOfStock + stats.lowStock}
                  </div>
                  <p className="text-xs text-muted-foreground">Les éléments nécessitent une attention particulière</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Action rapides</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">Raccourcis disponibles</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions - Different for Admin vs Cashier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Action rapides</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isAdmin ? 'Administrative tasks' : 'Daily operations'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {isAdmin ? (
                // Admin Quick Actions
                <>
                  <Link href="/products">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Gérer les produits</h3>
                            <p className="text-xs text-muted-foreground">Ajouter, modifier ou supprimer des produits</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/customers">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Gestion des clients</h3>
                            <p className="text-xs text-muted-foreground">Afficher et gérer les clients</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/reports">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Rapports et analyses</h3>
                            <p className="text-xs text-muted-foreground">Afficher des rapports détaillés</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/settings">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Settings className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Paramètres système</h3>
                            <p className="text-xs text-muted-foreground">Configurer les préférences système</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </>
              ) : (
                // Cashier Quick Actions
                <>
                  <Link href="/sales">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Point de vente</h3>
                            <p className="text-xs text-muted-foreground">Traiter les ventes clients</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/products">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Eye className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Voir les produits</h3>
                            <p className="text-xs text-muted-foreground">Parcourir le catalogue de produits</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/sales">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Historique des ventes</h3>
                            <p className="text-xs text-muted-foreground">Afficher les transactions récentes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/customers">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">Recherche de clients</h3>
                            <p className="text-xs text-muted-foreground">Rechercher des informations client</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status - Only for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">État du système</CardTitle>
                <CardDescription className="text-xs sm:text-sm">État de santé et performances actuelles du système</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm sm:text-base">Connexion à la base de données</span>
                    </div>
                    <Badge variant="outline" className="text-xs">En ligne</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm sm:text-base">Service d&apos;authentification</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm sm:text-base">Stockage de fichiers</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Disponible</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm sm:text-base">Système de sauvegarde</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Activé</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Activité récente</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Dernières activités et événements du système</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'sale':
                            return <ShoppingCart className="w-3 h-3 text-blue-500" />;
                          case 'stock_update':
                            return <Package className="w-3 h-3 text-green-500" />;
                          case 'user_login':
                            return <UserCheck className="w-3 h-3 text-purple-500" />;
                          case 'stock_alert':
                            return <AlertTriangle className="w-3 h-3 text-orange-500" />;
                          case 'product_added':
                          case 'product_updated':
                            return <Package className="w-3 h-3 text-blue-500" />;
                          case 'customer_added':
                            return <Users className="w-3 h-3 text-green-500" />;
                          default:
                            return <Clock className="w-3 h-3 text-gray-500" />;
                        }
                      };

                      const getActivityBgColor = (type: string) => {
                        switch (type) {
                          case 'sale':
                            return 'bg-blue-500/10';
                          case 'stock_update':
                            return 'bg-green-500/10';
                          case 'user_login':
                            return 'bg-purple-500/10';
                          case 'stock_alert':
                            return 'bg-orange-500/10';
                          case 'product_added':
                          case 'product_updated':
                            return 'bg-blue-500/10';
                          case 'customer_added':
                            return 'bg-green-500/10';
                          default:
                            return 'bg-gray-500/10';
                        }
                      };

                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`p-1 ${getActivityBgColor(activity.type)} rounded-full`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                    <p className="text-xs text-muted-foreground">Les activités apparaîtront ici</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Today's Activity - For Cashiers */}
        {isCashier && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Activité du jour</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Vos transactions et actions récentes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.filter(activity => activity.userId === userProfile?.uid).length > 0 ? (
                <div className="space-y-3">
                  {activities
                    .filter(activity => activity.userId === userProfile?.uid)
                    .slice(0, 3)
                    .map((activity) => {
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'sale':
                            return <DollarSign className="w-3 h-3 text-green-500" />;
                          case 'stock_update':
                            return <Package className="w-3 h-3 text-blue-500" />;
                          case 'user_login':
                            return <UserCheck className="w-3 h-3 text-purple-500" />;
                          case 'product_added':
                          case 'product_updated':
                            return <Eye className="w-3 h-3 text-blue-500" />;
                          default:
                            return <ShoppingCart className="w-3 h-3 text-purple-500" />;
                        }
                      };

                      const getActivityBgColor = (type: string) => {
                        switch (type) {
                          case 'sale':
                            return 'bg-green-500/10';
                          case 'stock_update':
                            return 'bg-blue-500/10';
                          case 'user_login':
                            return 'bg-purple-500/10';
                          case 'product_added':
                          case 'product_updated':
                            return 'bg-blue-500/10';
                          default:
                            return 'bg-purple-500/10';
                        }
                      };

                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`p-1 ${getActivityBgColor(activity.type)} rounded-full`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aucune activité aujourd&apos;hui</p>
                  <p className="text-xs text-muted-foreground">Vos actions apparaîtront ici</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alerts and Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Alertes et notifications</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isAdmin ? 'System alerts requiring attention' : 'Important information for cashiers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const getSeverityStyles = (severity: string) => {
                    switch (severity) {
                      case 'error':
                        return {
                          bg: 'bg-red-50',
                          border: 'border-red-200',
                          icon: 'text-red-500',
                          title: 'text-red-800',
                          message: 'text-red-600'
                        };
                      case 'warning':
                        return {
                          bg: 'bg-orange-50',
                          border: 'border-orange-200',
                          icon: 'text-orange-500',
                          title: 'text-orange-800',
                          message: 'text-orange-600'
                        };
                      case 'info':
                        return {
                          bg: 'bg-blue-50',
                          border: 'border-blue-200',
                          icon: 'text-blue-500',
                          title: 'text-blue-800',
                          message: 'text-blue-600'
                        };
                      case 'success':
                        return {
                          bg: 'bg-green-50',
                          border: 'border-green-200',
                          icon: 'text-green-500',
                          title: 'text-green-800',
                          message: 'text-green-600'
                        };
                      default:
                        return {
                          bg: 'bg-gray-50',
                          border: 'border-gray-200',
                          icon: 'text-gray-500',
                          title: 'text-gray-800',
                          message: 'text-gray-600'
                        };
                    }
                  };

                  const styles = getSeverityStyles(notification.severity);

                  return (
                    <div key={notification.id} className={`flex items-center gap-3 p-3 ${styles.bg} border ${styles.border} rounded-lg`}>
                      <AlertTriangle className={`w-5 h-5 ${styles.icon} flex-shrink-0`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${styles.title}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs ${styles.message}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button size="sm" variant="outline" className="text-xs">
                          Voir détails
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {isAdmin ? 'Aucune alerte système' : 'Tous les produits disponibles'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? 'Aucune alerte en ce moment' : 'Aucun problème de stock à signaler'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
