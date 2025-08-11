"use client";

import React, { useState, useEffect } from "react";
import { CustomerSearch } from "./CustomerSearch";
import { CustomerTable } from "./CustomerTable";
import { Button } from "@/app/components/ui/button";
import { CustomerForm } from "./CustomerForm";
import { CustomerDetailsDrawer } from "./CustomerDetailsDrawer";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import {
  getCustomers,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer
} from "@/app/lib/firebase/customers";
import { toast } from "sonner";

export function CustomerManagementScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const fetchedCustomers = await getCustomers();
      setCustomers(fetchedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };
 
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadCustomers();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await searchCustomers(query);
      setCustomers(searchResults);
    } catch (error) {
      console.error('Error searching customers:', error);
      toast.error('Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleSaveCustomer = async (data: { name: string; email: string; phone: string; address: string }) => {
    try {
      if (selectedCustomer) {
        // Update existing customer
        await updateCustomer(selectedCustomer.id!, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        });
        toast.success('Customer updated successfully');
      } else {
        // Create new customer
        const now = new Date();
        await createCustomer({
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          createdAt: now,
          lastPurchase: now,
          totalPurchases: 0,
          totalSpent: 0,
        });
        toast.success('Customer created successfully');
      }
      
      setIsFormOpen(false);
      loadCustomers(); // Reload the customer list
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    }
  };

  const confirmDelete = async () => {
    if (selectedCustomer) {
      try {
        await deleteCustomer(selectedCustomer.id!);
        toast.success('Customer deleted successfully');
        setIsDialogOpen(false);
        loadCustomers(); // Reload the customer list
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Customer Management</h2>
        <Button onClick={handleAddCustomer}>Add Customer</Button>
      </div>
      
      <CustomerSearch onSearch={handleSearch} />

      <CustomerTable 
        customers={customers} 
        loading={loading}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onView={handleViewCustomer}
      />

      {isFormOpen && (
        <CustomerForm
          initialData={selectedCustomer || undefined}
          onSave={handleSaveCustomer}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      <CustomerDetailsDrawer
        customer={selectedCustomer || undefined}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <DeleteCustomerDialog 
        open={isDialogOpen}
        onConfirm={confirmDelete}
        onCancel={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
