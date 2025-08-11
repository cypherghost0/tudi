import { Users } from "lucide-react";
 
export function CustomersHeader() {
  return (
    <div className="flex items-center gap-2">
      <Users className="h-6 w-6" />
      <h1 className="text-2xl font-bold">Customers</h1>
    </div>
  );
}
