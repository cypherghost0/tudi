import React from "react";
import { Customer } from "@/app/lib/firebase/customers";

export function CustomerDetailsDrawer({ customer, open, onClose }: { customer?: Customer; open: boolean; onClose?: () => void }) {
  
  if (!open || !customer) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-end z-50">
      <div className="bg-white w-96 h-full shadow-lg p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Customer Details</h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <p className="text-lg">{customer.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <p className="text-lg">{customer.email || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Phone</label>
            <p className="text-lg">{customer.phone}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Address</label>
            <p className="text-lg">{customer.address || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Total Purchases</label>
            <p className="text-lg font-semibold">{customer.totalPurchases}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Total Spent</label>
            <p className="text-lg font-semibold text-green-600">${customer.totalSpent.toFixed(2)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Customer Since</label>
            <p className="text-lg">{customer.createdAt.toLocaleDateString()}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Last Purchase</label>
            <p className="text-lg">{customer.lastPurchase.toLocaleDateString()}</p>
          </div>
          
          {customer.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Notes</label>
              <p className="text-lg">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
