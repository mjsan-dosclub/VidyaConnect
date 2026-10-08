'use client';
import { APP_NAME } from '@/lib/brand';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle, CalendarDays } from 'lucide-react';
import { ModeToggle } from './voice';
import { getSession, post } from '@/lib/client';
import { manual } from '@/lib/validation';
export default function ManualForm() {
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
      <section className="intro">
        <span className="eyebrow">A PERSONAL CONNECTION</span>
        <h1>
          Great things start
          <br />
          with <em>a hello.</em>
        </h1>
        <p>
          Leave a few details. We’ll find the right next step
          <br />
          for your institution.
        </p>
      </section>
      <ModeToggle manual />
      <form onSubmit={submit} className="form-stack">
        <div className="glass form-card">
          <h2>A little about you</h2>
          <p className="muted">So we know who to say hello to.</p>
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            Institution / organisation name
            <input
              name="school_name"
              autoComplete="organization"
              placeholder="Your institution or organisation"
              required
              minLength={2}
              maxLength={200}
            />
          </label>
          <label>
            Mobile number
            <div className="phone-field">
              <span>+91</span>
              <input
                name="phone"
                autoComplete="tel-national"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
              />
            </div>
          </label>
          <label>
            Email address
            <input
              name="email"
              autoComplete="email"
              type="email"
              placeholder="you@organisation.edu"
              required
              maxLength={254}
            />
          </label>
        </div>
        <div className="glass form-card">
          <h2>
            <CalendarDays size={19} /> Let’s find a good time
          </h2>
          <label>
            Preferred callback date
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
            <legend>Preferred time slot</legend>
            {[
              ['Morning', '9:00 AM – 11:00 AM'],
              ['Afternoon', '1:00 PM – 3:00 PM'],
              ['Evening', '3:00 PM – 7:00 PM'],
            ].map(([s, t]) => (
              <label className="slot" key={s}>
                <input type="radio" name="callback_slot" value={s} required />
                <span>
                  {s}
                  <small>{t} · IST</small>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
        <div className="glass form-card">
          <label>
            I’d like to
            <select name="objective" defaultValue="Know More">
              <option>Demo</option>
              <option>Know More</option>
              <option>Catch-up Call</option>
            </select>
          </label>
          <label>
            What’s on your mind?
            <textarea
              name="notes"
              rows={3}
              maxLength={400}
              placeholder="Tell us a little about your goals or challenges."
            />
          </label>
        </div>
        <label className="consent">
          <input type="checkbox" name="consent" required />
          <span>
            I agree to be contacted by the {APP_NAME} team about my
            institution’s requirements.
          </span>
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} className="primary">
          {busy ? <LoaderCircle className="spin" size={18} /> : null}
          {busy ? 'Saving your details…' : 'Let’s connect'}
          <ArrowRight size={18} />
        </button>
        <p className="center muted">
          No queue. No pressure. Just possibilities.
        </p>
      </form>
    </>
  );
}
