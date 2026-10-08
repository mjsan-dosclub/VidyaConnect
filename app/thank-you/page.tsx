'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowUpRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
export default function Thanks() {
  const [result, setResult] = useState<{
    name: string;
    email?: string;
    emailQueued?: boolean;
    emailEnabled?: boolean;
    localMode?: boolean;
  } | null>(null);
  const router = useRouter();
  useEffect(() => {
    const raw = sessionStorage.getItem('karya-success');
    if (!raw) {
      router.replace('/');
      return;
    }
    setResult(JSON.parse(raw));
  }, [router]);
  return (
    <div className="thanks">
      <div className="success-orb">
        <Check size={48} />
      </div>
      <span className="eyebrow">YOU’RE ON OUR LIST</span>
      <h1>
        A great conversation.
        <br />
        <em>An even better beginning.</em>
      </h1>
      <p>
        Thank you{result ? `, ${result.name}` : ''}. Your details are saved
        {result?.localMode ? ' on this computer' : ''}.<br />
        {result?.localMode
          ? 'This is a local preview submission.'
          : 'Our team looks forward to connecting with you.'}
      </p>
      <div className="glass next-card">
        <Sparkles size={24} />
        <h2>What happens next?</h2>
        <p>
          {result?.localMode
            ? 'Your introduction is stored locally. Connect the production services to enable team follow-up and email.'
            : 'We’ll review your requirements and reach out to explore what’s possible for your institution.'}
        </p>
        {result?.email && (
          <p className="email-note">
            {result.emailEnabled === false
              ? 'Email is not connected in this local preview.'
              : result.emailQueued
                ? 'Your thank-you email is queued for delivery.'
                : 'Your thank-you email has been sent.'}
          </p>
        )}
      </div>
      <Link
        className="primary"
        href="/"
        onClick={() => {
          sessionStorage.removeItem('karya-lead-voice');
          sessionStorage.removeItem('karya-lead-manual');
          sessionStorage.removeItem('karya-success');
        }}
      >
        Start a new introduction
        <ArrowUpRight size={18} />
      </Link>
      <p className="muted">Enjoy the rest of the summit.</p>
    </div>
  );
}
