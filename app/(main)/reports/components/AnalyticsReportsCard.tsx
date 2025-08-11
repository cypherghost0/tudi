import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export function AnalyticsReportsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics & Reports</CardTitle>
        <CardDescription>
          Consultez les analyses des ventes, les rapports d&apos;inventaire et les informations commerciales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          L&apos;interface de rapports et d&apos;analyses sera implémentée ici.
        </p>
      </CardContent>
    </Card>
  );
} 