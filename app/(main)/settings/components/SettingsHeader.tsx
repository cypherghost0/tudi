import { Settings } from "lucide-react";

export function SettingsHeader() {
  return (
    <div className="flex items-center gap-2">
      <Settings className="h-6 w-6" />
      <h1 className="text-2xl font-bold">Paramètres</h1>
    </div>
  );
} 