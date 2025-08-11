import React from "react";
import { Sale, Product } from "@/app/lib/types/types";

interface AnalyticsChartProps {
  data: Sale[] | Product[];
  type: 'sales' | 'inventory';
  loading: boolean;
}

export function AnalyticsChart({ data, type, loading }: AnalyticsChartProps) {
  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center bg-muted rounded h-40">
        <span className="text-muted-foreground">Chargement des données du graphique...</span>
      </div>
    );
  }

  return (
    <div className="py-4 flex items-center justify-center bg-muted rounded h-40">
      <span className="text-muted-foreground">
        [Analytics Chart Placeholder - {type} data with {data.length} items]
      </span>
    </div>
  );
}