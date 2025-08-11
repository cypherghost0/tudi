import React from "react";

export function DeleteCustomerDialog({ open, onConfirm, onCancel }: { open: boolean; onConfirm?: () => void; onCancel?: () => void }) {
  
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Delete Customer</h2>
        <p className="mb-6 text-gray-600">Are you sure you want to delete this customer? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button
            className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white rounded px-4 py-2 hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
