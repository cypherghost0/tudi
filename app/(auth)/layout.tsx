import { AuthProvider } from '@/app/contexts/auth-context';
import { SettingsProvider } from '@/app/contexts/settings-context';
import { AuthFooter } from './components/AuthFooter';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <div className="relative min-h-screen">
          {children}
          <AuthFooter />
        </div>
      </SettingsProvider>
    </AuthProvider>
  );
}