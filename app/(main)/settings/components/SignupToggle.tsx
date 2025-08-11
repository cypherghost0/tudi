"use client";

import { useState } from 'react';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import { Button } from '@/app/components/ui/button';

export function SignupToggle() {
  const { settings, updateSignupEnabled } = useSettings();
  const { userProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  // Only show to admins
  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  const handleToggle = async () => {
    if (!settings) return;

    setIsUpdating(true);
    try {
      await updateSignupEnabled(!settings.signupEnabled);
    } catch (error) {
      console.error('Error updating signup setting:', error);
      // You could add toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-between py-2">
        <span>User Signup</span>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-medium">User Signup</span>
          <span className="text-sm text-muted-foreground">
            Autoriser les nouveaux utilisateurs à créer des comptes
          </span>
        </div>
        <Button
          variant={settings.signupEnabled ? "default" : "secondary"}
          size="sm"
          onClick={handleToggle}
          disabled={isUpdating}
          className="min-w-[80px]"
        >
          {isUpdating ? "..." : settings.signupEnabled ? "Activé" : "Désactivé"}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Status: {settings.signupEnabled ? "New users can sign up" : "Signup is disabled"}
      </div>
    </div>
  );
}