import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export function SystemSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>
          Configurer les préférences système et les paramètres de l&apos;application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          L&apos;interface des paramètres sera implémentée ici.
        </p>
      </CardContent>
    </Card>
  );
} 