import React from "react";
import { Button } from "@/app/components/ui/button";
import { Customer } from "@/app/lib/firebase/customers";

export function CustomerTable({
  customers = [],
  loading = false,
  onEdit,
  onDelete,
  onView
}: {
  customers?: Customer[];
  loading?: boolean;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onView?: (customer: Customer) => void;
}) {
  return (
    <div className="overflow-x-auto py-2">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Phone</th>
            <th className="px-4 py-2 border">Address</th>
            <th className="px-4 py-2 border">Total Purchases</th>
            <th className="px-4 py-2 border">Total Spent</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
          ) : customers.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-4">No customers found</td></tr>
          ) : customers.map((customer, idx) => (
            <tr key={customer.id || idx}>
              <td className="px-4 py-2 border">{customer.name}</td>
              <td className="px-4 py-2 border">{customer.email || 'N/A'}</td>
              <td className="px-4 py-2 border">{customer.phone}</td>
              <td className="px-4 py-2 border">{customer.address || 'N/A'}</td>
              <td className="px-4 py-2 border">{customer.totalPurchases}</td>
              <td className="px-4 py-2 border">${customer.totalSpent.toFixed(2)}</td>
              <td className="px-4 py-2 border">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView?.(customer)}>View</Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit?.(customer)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete?.(customer)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
