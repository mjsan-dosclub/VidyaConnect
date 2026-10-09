'use client';
import { useLanguage } from '@/components/language';
import { feedbackCategories, feedbackQuestions } from '@/lib/feedback';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { ModeToggle } from './voice';
import { getSession, post } from '@/lib/client';
import { manual } from '@/lib/validation';
export default function ManualForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      const p = manual.parse({
        ...getSession('manual'),
        ...Object.fromEntries(f),
        consent: f.get('consent') === 'on',
        bullet_requirements: feedbackCategories.flatMap((category, i) => { const value = String(f.get('feedback_' + i) ?? '').trim(); return value ? [category + ': ' + value] : []; }),
      });
      const result = await post('/api/manual', p);
      sessionStorage.setItem(
        'originbi-survey-success-v1',
        JSON.stringify({
          name: p.name,
          email: p.email,
          emailQueued: result.email.queued,
          emailEnabled: result.email.enabled,
          localMode: result.local_mode,
        }),
      );
      router.push('/thank-you');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="capture-tagline">
        {t('Help shape originBI. Speak it, or write it.')}
      </p>
      <ModeToggle manual />
      <form onSubmit={submit} className="form-stack">
        <div className="glass form-card">
          <h2>{t('A little about you')}</h2>
          <p className="muted">{t('Tell us who is sharing this feedback.')}</p>
          <label>
            {t('Full name')}
            <input
              name="name"
              autoComplete="name"
              placeholder={t('Your full name')}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            {t('Institution / organisation name')}
            <input
              name="school_name"
              autoComplete="organization"
              placeholder={t('Your institution or organisation')}
              required
              minLength={2}
              maxLength={200}
            />
          </label>
          <label>
            {t('Mobile number')}
            <div className="phone-field">
              <span>+91</span>
              <input
                name="phone"
                autoComplete="tel-national"
                type="tel"
                inputMode="numeric"
                placeholder={t('10-digit mobile number')}
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
              />
            </div>
          </label>
          <label>
            {t('Email')} <small>{t('· optional, for your thank-you email')}</small>
            <input
              name="email"
              autoComplete="email"
              type="email"
              placeholder={t('you@organisation.edu')}
              maxLength={254}
            />
          </label>
        </div>
        <div className="glass form-card">
          <h2>{t('Your feedback on originBI')}</h2>
          <p className="muted">{t('Answer any of these. At least one response is needed.')}</p>
          {feedbackCategories.map((category, i) => <label key={category}>{t(category)}<textarea name={'feedback_' + i} rows={3} maxLength={360} placeholder={t(feedbackQuestions[i])} /></label>)}
        </div>
        <label className="consent">
          <input type="checkbox" name="consent" required />
          <span>
            {t('I agree to have my details and feedback saved by originBI to improve the product.')}
          </span>
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} className="primary">
          {busy ? <LoaderCircle className="spin" size={18} /> : null}
          {t(busy ? 'Saving your details…' : 'Submit feedback')}
          <ArrowRight size={18} />
        </button>
        <p className="center muted">
          {t('Your ideas help improve originBI.')}
        </p>
      </form>
    </>
  );
}
