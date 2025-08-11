"use client";

import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsScreen } from "./components/SettingsScreen";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsScreen />
    </div>
  );
} 