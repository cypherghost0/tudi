# Signup Enable/Disable Feature

This feature allows administrators to enable or disable user signup functionality from the admin settings panel.

## How It Works

### Components Created/Modified

1. **Settings Context** (`app/contexts/settings-context.tsx`)
   - Manages system-wide settings including signup status
   - Provides real-time updates via Firestore listeners
   - Only allows admins to modify settings

2. **Signup Toggle Component** (`app/(main)/settings/components/SignupToggle.tsx`)
   - Admin-only toggle switch in the settings panel
   - Shows current signup status
   - Allows admins to enable/disable signup

3. **Modified Signup Page** (`app/(auth)/signup/page.tsx`)
   - Checks signup status before allowing registration
   - Shows appropriate messages when signup is disabled
   - Disables form fields and submit button when signup is off

4. **Auth Layout** (`app/(auth)/layout.tsx`)
   - Provides necessary context providers for auth pages

5. **Firebase Settings Utility** (`app/lib/firebase/settings.ts`)
   - Helper functions for managing system settings
   - Handles initialization of default settings

6. **Firestore Rules** (`firestore.rules`)
   - Added rules for system settings collection
   - Allows all authenticated users to read settings
   - Only admins can write/update settings

### Database Structure

The system settings are stored in Firestore at:
```
/system/settings
{
  signupEnabled: boolean,
  updatedAt: timestamp,
  updatedBy: string (admin uid)
}
```

### User Experience

#### For Admins
- Navigate to Settings page
- See "User Signup" toggle with current status
- Click to enable/disable signup
- Changes take effect immediately across the app

#### For New Users
- **When signup is enabled**: Normal signup flow works
- **When signup is disabled**: 
  - Form fields are disabled
  - Submit button shows "Registration Disabled"
  - Clear message explains signup is currently disabled
  - Users are directed to contact an administrator

### Security

- Only users with `role: 'admin'` can modify signup settings
- Settings are enforced both client-side and server-side
- Firestore security rules prevent unauthorized access
- Real-time updates ensure immediate effect across all sessions

### Installation Notes

1. The feature requires the SettingsProvider to be included in both main and auth layouts
2. Firestore rules must be deployed for proper security
3. Default settings are automatically initialized on first access
4. No existing functionality is removed - only enhanced with controls

### Testing

To test the feature:
1. Log in as an admin user
2. Go to Settings page
3. Toggle the "User Signup" setting
4. Open signup page in another tab/browser
5. Verify the signup form is disabled/enabled accordingly