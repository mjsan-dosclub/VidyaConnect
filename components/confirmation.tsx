'use client';
import { APP_NAME } from '@/lib/brand';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, LoaderCircle } from 'lucide-react';
import { getSession, LeadSession, post } from '@/lib/client';
import { details } from '@/lib/validation';
export default function Confirmation() {
  const [lead, setLead] = useState<LeadSession | null>(null);
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
  }, [router]);
  if (!lead) return <p className="center muted">Loading your introduction…</p>;
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
        <span className="eyebrow">A LITTLE CHECK BEFORE WE CONNECT</span>
        <h1>
          Thank you, <em>{lead.name || 'there'}.</em>
        </h1>
        <p>
          Please confirm your mobile number:
          <br />
          <strong>{lead.phone || 'Add your number below'}</strong>
        </p>
      </section>
      {lead.manual_review && (
        <div className="local-notice" role="status">
          Your transcript is saved on this computer. AI is not connected in this
          local preview; please fill in and review your details below.
          <details>
            <summary>View your transcript</summary>
            <p>{lead.transcript}</p>
          </details>
        </div>
      )}
      <div className="step-row">
        <span className="step">
          <Check size={15} />
          <small>Share</small>
        </span>
        <i />
        <span className="step active">
          2 <small>Review</small>
        </span>
        <i />
        <span className="step">
          3 <small>Connect</small>
        </span>
      </div>
      <form className="form-stack" onSubmit={submit}>
        <div className="glass form-card">
          <h2>Let’s make sure we got it right</h2>
          <label>
            Your name
            <input
              name="name"
              defaultValue={lead.name}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            Mobile number
            <div className="phone-field">
              <span>+91</span>
              <input
                name="phone"
                defaultValue={lead.phone}
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                required
                maxLength={10}
              />
            </div>
          </label>
          <label>
            Institution / organisation name
            <input
              name="school_name"
              defaultValue={lead.school_name ?? ''}
              maxLength={200}
            />
          </label>
          <label>
            Email{' '}
            <small className="muted">
              · optional, for your thank-you email
            </small>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@organisation.edu"
              maxLength={254}
            />
          </label>
        </div>
        <div className="glass form-card">
          <h2>Your requirements</h2>
          <ul className="requirements">
            {lead.requirements_summary?.length ? (
              lead.requirements_summary.map((r, i) => (
                <li key={i}>
                  <Check size={15} />
                  {r}
                </li>
              ))
            ) : (
              <li>Add the requirements from your introduction below.</li>
            )}
          </ul>
          <label>
            Edit your requirements{' '}
            <small className="muted">· one per line</small>
            <textarea
              name="requirements"
              rows={3}
              defaultValue={lead.requirements_summary?.join('\n')}
              maxLength={3200}
            />
          </label>
          <label>
            Your next step
            <select name="objective" defaultValue={lead.detected_objective}>
              <option>Demo</option>
              <option>Know More</option>
              <option>Catch-up Call</option>
            </select>
          </label>
        </div>
        <label className="consent">
          <input name="consent" type="checkbox" required />
          <span>
            I agree to be contacted by the {APP_NAME} team about my
            institution’s requirements.
          </span>
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button disabled={busy} className="primary">
          {busy ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <Check size={18} />
          )}{' '}
          {busy ? 'Confirming…' : 'Confirm & Send'}
          <ArrowRight size={18} />
        </button>
        <Link href="/" className="center muted">
          Back to my introduction
        </Link>
      </form>
    </>
  );
}
