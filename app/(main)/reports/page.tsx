"use client";

import { ReportsHeader } from "./components/ReportsHeader";
import { ReportsScreen } from "./components/ReportsScreen";

export default function ReportsPage() {
  return (
    <div className="w-full max-w-none space-y-6">
      <ReportsHeader />
      <ReportsScreen />
    </div>
  );
}