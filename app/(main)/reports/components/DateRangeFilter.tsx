import React from "react";

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: (start: string | undefined, end: string | undefined) => void;
  disabled?: boolean;
}

export function DateRangeFilter({ startDate, endDate, onChange, disabled }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-4 py-2">
      <label className="flex flex-col text-sm">
        Start Date
        <input
          type="date"
          className="rounded border px-2 py-1 bg-background"
          value={startDate || ''}
          onChange={(e) => onChange(e.target.value || undefined, endDate)}
          disabled={disabled}
        />
      </label>
      <label className="flex flex-col text-sm">
        Date de fin
        <input
          type="date"
          className="rounded border px-2 py-1 bg-background"
          value={endDate || ''}
          onChange={(e) => onChange(startDate, e.target.value || undefined)}
          disabled={disabled}
        />
      </label>
    </div>
  );
}