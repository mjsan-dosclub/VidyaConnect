import { APP_NAME } from '@/lib/brand';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/language';
import MobileShell from '@/components/mobile-shell';
export const metadata: Metadata = {
  title: `${APP_NAME} | Conversations that move education forward`,
  description: `Skip the queue. Share your institution’s next big idea with ${APP_NAME}.`,
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f6f4ff',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&family=Roboto:wght@400;500&display=swap"
        />
      </head>
      <body>
        <LanguageProvider>
          <MobileShell>{children}</MobileShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
