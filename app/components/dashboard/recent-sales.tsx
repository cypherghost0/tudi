import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Sale } from '@/app/lib/types/types';

export function RecentSales({ sales }: { sales: Sale[] }) {
  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div className="flex items-center" key={sale.id}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${sale.customerInfo.email}.png`} alt="Avatar" />
            <AvatarFallback>{sale.customerInfo.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.customerInfo.name}</p>
            <p className="text-sm text-muted-foreground">{sale.customerInfo.email}</p>
          </div>
          <div className="ml-auto font-medium">+${sale.finalTotal.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
