import { APP_NAME } from '@/lib/brand';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import MobileShell from '@/components/mobile-shell';
export const metadata: Metadata = {
  title: `${APP_NAME} | Conversations that move education forward`,
  description: `Skip the queue. Share your institution’s next big idea with ${APP_NAME}.`,
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4f0e7',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}
