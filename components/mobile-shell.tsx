'use client';
import { APP_NAME } from '@/lib/brand';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Sparkles, Smartphone, ArrowUpRight, ShieldCheck } from 'lucide-react';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label={`${APP_NAME} home`}>
      <span className="brand-icon">
        <Sparkles size={22} />
      </span>
      <span>{APP_NAME}</span>
    </Link>
  );
}
export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [url, setUrl] = useState('');
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = matchMedia('(min-width: 768px)');
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener('change', sync);
    setUrl(
      new URL(
        path,
        process.env.NEXT_PUBLIC_APP_URL || location.origin,
      ).toString(),
    );
    return () => query.removeEventListener('change', sync);
  }, [path]);
  if (path.startsWith('/admin')) return children;
  return (
    <>
      <div className="desktop-blocker">
        <div className="blocker-card glass">
          <Brand />
          <span className="eyebrow">MADE FOR MOMENTS THAT MATTER</span>
          <div className="phone-icon">
            <Smartphone size={36} />
          </div>
          <h1>
            Good conversations.
            <br />
            On the go.
          </h1>
          <h2>Mobile Only Experience</h2>
          <p>
            {APP_NAME} is optimized for mobile on-site attendees. Please scan
            this QR code with your mobile device to continue.
          </p>
          <div className="qr">
            {url && (
              <QRCodeSVG value={url} size={176} level="M" marginSize={2} />
            )}
          </div>
          <span className="muted">Open your camera. Scan. Let’s connect.</span>
          <Link className="admin-link" href="/admin">
            Booth manager portal <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="visitor" aria-hidden={wide} inert={wide}>
        <main className="mobile-shell">
          <header>
            <Brand />
            <span className="summit-badge">
              <span /> SUMMIT CONNECT
            </span>
          </header>
          {children}
          <footer>
            <ShieldCheck size={14} /> Your details. A more personal follow-up.
            <Link href="/admin" aria-label="Booth manager portal">
              <ArrowUpRight size={15} />
            </Link>
          </footer>
        </main>
      </div>
    </>
  );
}
