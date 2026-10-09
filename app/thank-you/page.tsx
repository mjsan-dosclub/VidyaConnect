'use client';
import { useLanguage } from '@/components/language';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowUpRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
export default function Thanks() {
  const { t } = useLanguage();
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
      <span className="eyebrow">{t('YOU’RE ON OUR LIST')}</span>
      <h1>
        {t('A great conversation.')}
        <br />
        <em>{t('An even better beginning.')}</em>
      </h1>
      <p>
        {t('Thank you')}
        {result ? `, ${result.name}` : ''}
        {t('. Your details are saved')}
        {result?.localMode ? ' on this computer' : ''}.<br />
        {result?.localMode
          ? 'This is a local preview submission.'
          : t('Our team looks forward to connecting with you.')}
      </p>
      <div className="glass next-card">
        <Sparkles size={24} />
        <h2>{t('What happens next?')}</h2>
        <p>
          {result?.localMode
            ? 'Your introduction is stored locally. Connect the production services to enable team follow-up and email.'
            : t(
                'We’ll review your requirements and reach out to explore what’s possible for your institution.',
              )}
        </p>
        {result?.email && (
          <p className="email-note">
            {result.emailEnabled === false
              ? 'Email is not connected in this local preview.'
              : result.emailQueued
                ? t('Your thank-you email is queued for delivery.')
                : t('Your thank-you email has been sent.')}
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
        {t('Start a new introduction')}
        <ArrowUpRight size={18} />
      </Link>
      <p className="muted">{t('Enjoy the rest of the summit.')}</p>
    </div>
  );
}
