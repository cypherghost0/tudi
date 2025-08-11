import { AuthProvider } from '@/app/contexts/auth-context';
import { SettingsProvider } from '@/app/contexts/settings-context';
import { PWAProvider } from '@/app/components/pwa/pwa-provider';
import { MainLayoutContent } from './main-layout-content';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MainLayoutContent>{children}</MainLayoutContent>
        <PWAProvider />
      </SettingsProvider>
    </AuthProvider>
  );
}
