import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { User } from 'lucide-react';

interface CustomerInfo {
  name: string;
  phone: string;
  address?: string;
}

interface NewCustomerFormProps {
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
}

export function NewCustomerForm({ customerInfo, setCustomerInfo }: NewCustomerFormProps) {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs sm:text-sm font-medium">Name *</label>
          <Input
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Customer name"
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium">Phone *</label>
          <Input
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+1234567890"
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium">Address (Optional)</label>
          <Input
            value={customerInfo.address}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Customer address"
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
