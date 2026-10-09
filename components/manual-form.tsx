'use client';
import { useLanguage } from '@/components/language';
import { APP_NAME } from '@/lib/brand';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle, CalendarDays } from 'lucide-react';
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
        bullet_requirements: f.get('notes') ? [String(f.get('notes'))] : [],
      });
      const result = await post('/api/manual', p);
      sessionStorage.setItem(
        'karya-success',
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
        {t('A minute with the booth. Speak it, or write it.')}
      </p>
      <ModeToggle manual />
      <form onSubmit={submit} className="form-stack">
        <div className="glass form-card">
          <h2>{t('A little about you')}</h2>
          <p className="muted">{t('So we know who to say hello to.')}</p>
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
            {t('Email address')}
            <input
              name="email"
              autoComplete="email"
              type="email"
              placeholder={t('you@organisation.edu')}
              required
              maxLength={254}
            />
          </label>
        </div>
        <div className="glass form-card">
          <h2>
            <CalendarDays size={19} />
            {t('Let’s find a good time')}
          </h2>
          <label>
            {t('Preferred callback date')}
            <input
              type="date"
              name="callback_date"
              required
              min={new Date().toLocaleDateString('en-CA', {
                timeZone: 'Asia/Kolkata',
              })}
            />
          </label>
          <fieldset>
            <legend>{t('Preferred time slot')}</legend>
            {[
              ['Morning', '9:00 AM – 11:00 AM'],
              ['Afternoon', '1:00 PM – 3:00 PM'],
              ['Evening', '3:00 PM – 7:00 PM'],
            ].map(([s, time]) => (
              <label className="slot" key={s}>
                <input type="radio" name="callback_slot" value={s} required />
                <span>
                  {t(s)}
                  <small>{time} · IST</small>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
        <div className="glass form-card">
          <label>
            {t('I’d like to')}
            <select name="objective" defaultValue="Know More">
              <option value="Demo">{t('Demo')}</option>
              <option value="Know More">{t('Know More')}</option>
              <option value="Catch-up Call">{t('Catch-up Call')}</option>
            </select>
          </label>
          <label>
            {t('What’s on your mind?')}
            <textarea
              name="notes"
              rows={3}
              maxLength={400}
              placeholder={t(
                'Tell us a little about your goals or challenges.',
              )}
            />
          </label>
        </div>
        <label className="consent">
          <input type="checkbox" name="consent" required />
          <span>
            {t('I agree to be contacted by the')} {APP_NAME}{' '}
            {t('team about my institution’s requirements.')}
          </span>
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} className="primary">
          {busy ? <LoaderCircle className="spin" size={18} /> : null}
          {t(busy ? 'Saving your details…' : 'Let’s connect')}
          <ArrowRight size={18} />
        </button>
        <p className="center muted">
          {t('No queue. No pressure. Just possibilities.')}
        </p>
      </form>
    </>
  );
}
