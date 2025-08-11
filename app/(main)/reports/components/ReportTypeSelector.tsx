import React from "react";

interface ReportTypeSelectorProps {
  value: 'sales' | 'inventory';
  onChange: (value: 'sales' | 'inventory') => void;
}

export function ReportTypeSelector({ value, onChange }: ReportTypeSelectorProps) {
  return (
    <div className="flex items-center gap-4 py-2">
      <label className="text-sm">
        Report Type
        <select
          className="ml-2 rounded border px-2 py-1 bg-background"
          value={value}
          onChange={(e) => onChange(e.target.value as 'sales' | 'inventory')}
        >
          <option value="sales">Sales</option>
          <option value="inventory">Inventory</option>
          {/* Add more report types as needed */}
        </select>
      </label>
    </div>
  );
}