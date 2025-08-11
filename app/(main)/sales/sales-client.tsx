'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, endBefore, limitToLast } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/firebase';
import { Sale } from '@/app/lib/types/types';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { RefreshCw } from 'lucide-react'; // Import RefreshCw icon

interface SalesClientProps {
  refreshTrigger?: number; // Prop to trigger refresh from parent
}

const SalesClient = ({ refreshTrigger }: SalesClientProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<unknown>(null);
  const [firstVisible, setFirstVisible] = useState<unknown>(null);
  const [salesPerPage, setSalesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('product'); // 'product', 'cashier', 'date'

  const fetchSales = useCallback(async (direction: 'next' | 'prev' | 'first' = 'first') => {
    setLoading(true);
    setError(null);
    try {
      const salesCollection = collection(db, 'sales');
      let q;

      if (direction === 'next' && lastVisible) {
        q = query(salesCollection, orderBy('date', 'desc'), startAfter(lastVisible), limit(salesPerPage));
      } else if (direction === 'prev' && firstVisible) {
        q = query(salesCollection, orderBy('date', 'desc'), endBefore(firstVisible), limitToLast(salesPerPage));
      } else {
        q = query(salesCollection, orderBy('date', 'desc'), limit(salesPerPage));
      }

      const salesSnapshot = await getDocs(q);
      const salesData = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      
      setSales(salesData);
      if (salesSnapshot.docs.length > 0) {
        setLastVisible(salesSnapshot.docs[salesSnapshot.docs.length - 1]);
        setFirstVisible(salesSnapshot.docs[0]);
      } else {
        setLastVisible(null);
        setFirstVisible(null);
      }
      console.log('Fetched sales data:', salesData); // Log fetched data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Échec du chargement des ventes: ${errorMessage}`);
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  }, [salesPerPage, lastVisible, firstVisible]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales, refreshTrigger]); // Add refreshTrigger to dependencies

  const handleRefresh = () => {
    setPage(1); // Reset to first page on refresh
    fetchSales('first');
  };

  const handleNextPage = () => {
    setPage(prev => prev + 1);
    fetchSales('next');
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
      fetchSales('prev');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'ID Caissier', 'Total', 'Produits'];
    const rows = sales.map(sale => [
      sale.id,
      new Date(sale.date).toLocaleString(),
      sale.cashierId,
      sale.total,
      sale.products.map((p: { name: string; quantity: number; }) => `${p.name} (x${p.quantity})`).join(', ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map((e: (string | number)[]) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rapport_ventes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Rapport de ventes", 20, 10);
    (doc as typeof doc & { autoTable: (options: { head: string[][]; body: (string | number)[][]; }) => void }).autoTable({
      head: [['ID', 'Date', 'ID Caissier', 'Total', 'Produits']],
      body: sales.map(sale => [
        sale.id,
        new Date(sale.date).toLocaleString(),
        sale.cashierId,
        sale.total,
        sale.products.map((p: { name: string; quantity: number; }) => `${p.name} (x${p.quantity})`).join(', ')
      ]),
    });
    doc.save('rapport_ventes.pdf');
  };

  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    const lowercasedFilter = searchTerm.toLowerCase();
    if (filterBy === 'product') {
      return sale.products.some((p: { name: string; }) => (p.name || '').toLowerCase().includes(lowercasedFilter));
    }
    if (filterBy === 'cashier') {
      return (sale.cashierId || '').toLowerCase().includes(lowercasedFilter);
    }
    if (filterBy === 'date') {
      return new Date(sale.date).toLocaleDateString().includes(lowercasedFilter);
    }
    return true;
  });

  useEffect(() => {
    console.log('Current sales state:', sales); // Log current sales state
    console.log('Filtered sales state:', filteredSales); // Log filtered sales state
  }, [sales, filteredSales]); // Log whenever sales or filteredSales change

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des ventes</CardTitle>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filtrer par..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Produit</SelectItem>
              <SelectItem value="cashier">Caissier</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            placeholder={`Filtrer par ${filterBy}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[150px]"
          />
          <Button onClick={handleExportCSV}>Exporter CSV</Button>
          <Button onClick={handleExportPDF}>Exporter PDF</Button>
          <Button onClick={handleRefresh} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Vente</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>ID Caissier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune vente trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
                      <TableCell>{sale.cashierId}</TableCell>
                      <TableCell>
                        {sale.customerInfo?.name}
                        {sale.customerInfo?.phone && <div className="text-muted-foreground text-xs">{sale.customerInfo.phone}</div>}
                      </TableCell>
                      <TableCell>
                        {sale.products.map((p: { id: React.Key | null | undefined; name: string; quantity: number; }) => (
                          <Badge key={p.id} variant="outline" className="mr-1">
                            {p.name} (x{p.quantity})
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-right">${sale.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <div>
                <Select onValueChange={(value: string) => setSalesPerPage(Number(value))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Articles par page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 par page</SelectItem>
                    <SelectItem value="20">20 par page</SelectItem>
                    <SelectItem value="50">50 par page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handlePrevPage} disabled={page <= 1}>Précédent</Button>
                <span>Page {page}</span>
                <Button onClick={handleNextPage} disabled={sales.length < salesPerPage}>Suivant</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesClient;
