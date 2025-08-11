"use client";

import { CustomersHeader } from "./components/CustomersHeader";
import { CustomerManagementScreen } from "./components/CustomerManagementScreen";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <CustomersHeader />
      <CustomerManagementScreen />
    </div>
  );
}
