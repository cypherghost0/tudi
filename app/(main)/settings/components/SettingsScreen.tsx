import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { NotificationPreferences } from "./NotificationPreferences";
import { SignupToggle } from "./SignupToggle";

export function SettingsScreen() {
  return (
    <div className="p-6 bg-background rounded-lg shadow space-y-6 max-w-lg">
      <h2 className="text-xl font-semibold">Interface des paramètres</h2>
      <ThemeToggle />
      <LanguageSelector />
      <NotificationPreferences />
      <SignupToggle />
      {/* Add more settings components here */}
    </div>
  );
}