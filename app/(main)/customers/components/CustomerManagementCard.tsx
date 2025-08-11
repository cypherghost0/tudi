import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export function CustomerManagementCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
        <CardDescription>
          Manage customer information and relationships
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Customer management interface will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
}
