import { ReactNode } from 'react';
import { ThemeProvider } from '@/app/components/theme/theme-provider';
import '@/app/globals.css';

type Props = {
  children: ReactNode;
};

export const metadata = {
  title: 'Tudi Electronique - Stock Management & POS',
  description: 'Offline-first stock management and point of sale system for electronic components',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tudi Electronique',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Tudi Electronique" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tudi Electronique" />
        <meta name="description" content="Offline-first stock management and point of sale system for electronic components" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon-192x192.png" color="#000000" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://tudielectronique.app" />
        <meta name="twitter:title" content="Tudi Electronique - Stock Management & POS" />
        <meta name="twitter:description" content="Offline-first stock management and point of sale system for electronic components" />
        <meta name="twitter:image" content="/icon-192x192.png" />
        <meta name="twitter:creator" content="@tudielectronique" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tudi Electronique - Stock Management & POS" />
        <meta property="og:description" content="Offline-first stock management and point of sale system for electronic components" />
        <meta property="og:site_name" content="Tudi Electronique" />
        <meta property="og:url" content="https://tudielectronique.app" />
        <meta property="og:image" content="/icon-192x192.png" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
