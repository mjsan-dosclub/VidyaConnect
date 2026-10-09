'use client';
import { useLanguage } from '@/components/language';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, LoaderCircle } from 'lucide-react';
import { getSession, LeadSession, post } from '@/lib/client';
import { details } from '@/lib/validation';
export default function Confirmation() {
  const { t } = useLanguage();
  const [lead, setLead] = useState<LeadSession | null>(null);
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  useEffect(() => {
    const p = getSession();
    if (!p.requirements_summary) {
      router.replace('/');
      return;
    }
    setLead(p);
    setMobile(p.phone ?? '');
  }, [router]);
  if (!lead)
    return <p className="center muted">{t('Loading your introduction…')}</p>;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const f = new FormData(e.currentTarget);
      const p = details.parse({
        ...Object.fromEntries(f),
        bullet_requirements: String(f.get('requirements'))
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      const result = await post('/api/confirm', {
        ...lead,
        ...p,
        consent: f.get('consent') === 'on',
      });
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
      <section className="intro">
        <span className="eyebrow">{t('REVIEW YOUR FEEDBACK')}</span>
        <h1>
          {t('Thank you,')} <em>{lead.name || 'there'}.</em>
        </h1>
        <p>
          {t('Please confirm your mobile number:')}
          <br />
          <strong>{mobile || t('Add your number below')}</strong>
        </p>
      </section>
      {lead.manual_review && (
        <div className="local-notice" role="status">
          {t(
            'Your transcript is saved on this computer. AI is not connected in this local preview; please fill in and review your details below.',
          )}
          <details>
            <summary>{t('View your transcript')}</summary>
            <p>{lead.transcript}</p>
          </details>
        </div>
      )}
      <div className="step-row">
        <span className="step">
          <Check size={15} />
          <small>{t('Share')}</small>
        </span>
        <i />
        <span className="step active">
          2 <small>{t('Review')}</small>
        </span>
        <i />
        <span className="step">
          3 <small>{t('Send')}</small>
        </span>
      </div>
      <form className="form-stack" onSubmit={submit}>
        <div className="glass form-card">
          <h2>{t('Let’s make sure we got it right')}</h2>
          <label>
            {t('Your name')}
            <input
              name="name"
              defaultValue={lead.name}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            {t('Mobile number')}
            <div className="phone-field">
              <span>+91</span>
              <input
                name="phone"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 20))}
                aria-invalid={!/^[6-9]\d{9}$/.test(mobile)}
                aria-describedby="mobile-review-hint"
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                required
                maxLength={20}
              />
            </div>
            <span id="mobile-review-hint" className="mobile-review-hint" role="status">
              {mobile.length > 10
                ? <>{mobile.length} {t('digits captured')} · {mobile.length - 10} {t('extra. Please remove the extra digits.')}</>
                : mobile.length > 0 && mobile.length < 10
                  ? <>{mobile.length} {t('digits captured')} · {10 - mobile.length} {t('missing. Please add the missing digits.')}</>
                  : mobile.length === 10 && !/^[6-9]\d{9}$/.test(mobile)
                    ? t('An Indian mobile number must start with 6, 7, 8 or 9.')
                    : mobile.length === 10
                      ? t('10 digits. Please check that this is your number.')
                      : t('No number was captured. Please enter your mobile number.')}
            </span>
          </label>
          <label>
            {t('Institution / organisation name')}
            <input
              name="school_name"
              defaultValue={lead.school_name ?? ''}
              maxLength={200}
            />
          </label>
          <label>
            {t('Email')}{' '}
            <small className="muted">
              {t('· optional, for your thank-you email')}
            </small>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t('you@organisation.edu')}
              maxLength={254}
            />
          </label>
        </div>
        <div className="glass form-card">
          <h2>{t('Your feedback on originBI')}</h2>
          <ul className="requirements">
            {lead.requirements_summary?.length ? (
              lead.requirements_summary.map((r, i) => (
                <li key={i}>
                  <Check size={15} />
                  {r}
                </li>
              ))
            ) : (
              <li>{t('Add your suggestions or current problems below.')}</li>
            )}
          </ul>
          <label>
            {t('Edit your feedback')}{' '}
            <small className="muted">{t('· one per line')}</small>
            <textarea
              name="requirements"
              rows={3}
              defaultValue={lead.requirements_summary?.join('\n')}
              maxLength={3200}
            />
          </label>
        </div>
        <label className="consent">
          <input name="consent" type="checkbox" required />
          <span>
            {t('I agree to have my details and feedback saved by originBI to improve the product.')}
          </span>
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button disabled={busy || !/^[6-9]\d{9}$/.test(mobile)} className="primary">
          {busy ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <Check size={18} />
          )}{' '}
          {t(busy ? 'Confirming…' : 'Confirm & Send')}
          <ArrowRight size={18} />
        </button>
        <Link href="/" className="center muted">
          {t('Back to my feedback')}
        </Link>
      </form>
    </>
  );
}
