'use client';
import { APP_NAME } from '@/lib/brand';
import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  LogOut,
  RefreshCw,
  Search,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { Brand } from '@/components/mobile-shell';
import { browserDB } from '@/lib/supabase-browser';
import { csvCell } from '@/lib/client';
import { feedbackCategories, hasFeedbackCategory } from '@/lib/feedback';
type Lead = {
  id: string;
  created_at: string;
  mode: string;
  status: string;
  name: string | null;
  school_name: string | null;
  phone: string | null;
  email: string | null;
  bullet_requirements: string[];
  raw_transcript: string | null;
  email_sent: boolean;
};
export default function Admin() {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [live, setLive] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    try {
      const supa = browserDB();
      const { data } = await supa.auth.getSession();
      if (!data.session) return;
      const res = await fetch('/api/admin/leads', {
        headers: { authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setLeads(body.leads);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load leads');
    }
  }, []);
  useEffect(() => {
    let active = true;
    try {
      const supa = browserDB();
      const { data } = supa.auth.onAuthStateChange((_e, session) => {
        if (active) {
          setAuthorized(session?.user.app_metadata.role === 'admin');
          setReady(true);
        }
      });
      return () => {
        active = false;
        data.subscription.unsubscribe();
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Not configured');
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (!authorized) return;
    void load();
    const supa = browserDB();
    let debounce: ReturnType<typeof setTimeout>;
    const channel = supa
      .channel('booth-leads')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => void load(), 250);
        },
      )
      .subscribe((s) => setLive(s === 'SUBSCRIBED'));
    const interval = setInterval(() => void load(), 30000);
    return () => {
      clearTimeout(debounce);
      clearInterval(interval);
      void supa.removeChannel(channel);
    };
  }, [authorized, load]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      const supa = browserDB();
      const { data, error } = await supa.auth.signInWithPassword({
        email: String(f.get('email')),
        password: String(f.get('password')),
      });
      if (error)
        throw new Error('Sign-in failed. Please check your credentials.');
      if (data.user?.app_metadata.role !== 'admin') {
        await supa.auth.signOut();
        throw new Error('This account is not authorized as a booth manager.');
      }
      setAuthorized(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }
  const filtered = leads.filter(
    (l) =>
      (!category || hasFeedbackCategory(l.bullet_requirements ?? [], category)) &&
      (!status || l.status === status) &&
      (!search ||
        [l.name, l.school_name, l.phone, l.email, ...(l.bullet_requirements ?? [])].some((s) =>
          s?.toLowerCase().includes(search.toLowerCase()),
        )),
  );
  function exportCSV() {
    const columns = [
      'id',
      'created_at',
      'mode',
      'status',
      'name',
      'school_name',
      'phone',
      'email',
      'bullet_requirements',
      'raw_transcript',
      'email_sent',
    ] as const;
    const csv =
      '\uFEFF' +
      [
        columns
          .map((c) =>
            csvCell(c === 'school_name' ? 'institution_organisation_name' : c === 'bullet_requirements' ? 'feedback' : c),
          )
          .join(','),
        ...filtered.map((l) => columns.map((c) => csvCell(l[c])).join(',')),
      ].join('\r\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${filtered.length} responses from the current filters.`);
  }
  if (!ready)
    return (
      <div className="login-wrap">
        <LoaderCircle className="spin" />
      </div>
    );
  if (!authorized)
    return (
      <div className="login-wrap">
        <form onSubmit={login} className="glass login-card">
          <Brand />
          <span className="eyebrow">BOOTH MANAGER PORTAL</span>
          <h1>
            A clear view of
            <br />
            <em>every conversation.</em>
          </h1>
          <p className="muted">
            Sign in with your manager account to view the live feedback feed.
          </p>
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="manager@company.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Your password"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy} className="primary">
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}{' '}
            {busy ? 'Signing in…' : 'Sign in securely'}
          </button>
        </form>
      </div>
    );
  return (
    <main className="admin-shell">
      <div className="admin-top">
        <Brand />
        <span className="live-status">
          <span className="live-dot" />
          {live ? 'Live feed connected' : 'Reconnecting · refresh every 30s'}
        </span>
        <button
          className="secondary"
          onClick={() =>
            void browserDB()
              .auth.signOut()
              .then(() => {
                setAuthorized(false);
                setLeads([]);
              })
          }
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
      <section className="admin-heading">
        <span className="eyebrow">ORIGINBI / VISITOR FEEDBACK</span>
        <h1>
          Every suggestion.
          <br />
          <em>One place.</em>
        </h1>
        <p>Understand institutional challenges and shape better solutions.</p>
      </section>
      <div className="stats">
        {[
          ['Survey responses', leads.length],
          ['Confirmed', leads.filter((l) => l.status === 'confirmed').length],
          ['Feature suggestions', leads.filter((l) => hasFeedbackCategory(l.bullet_requirements ?? [], 'Feature request')).length],
          ['Needs review', leads.filter((l) => l.status === 'draft').length],
        ].map(([label, count]) => (
          <div className="stat glass" key={label}>
            <span className="muted">{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <div className="admin-filters">
        <Search size={17} className="muted" />
        <input
          aria-label="Search feedback"
          placeholder="Search name, institution, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Filter by feedback category" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All feedback categories</option>
          {feedbackCategories.map(value => <option key={value}>{value}</option>)}
        </select>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {['draft', 'submitted', 'confirmed'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <button
          className="secondary"
          aria-label="Refresh feedback"
          onClick={() => void load()}
        >
          <RefreshCw size={16} />
        </button>
        <button
          className="secondary"
          disabled={!filtered.length}
          onClick={exportCSV}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      <p className="muted" style={{ marginBottom: 14 }}>
        {filtered.length} responses · newest first
        {leads.length === 5000 ? ' · latest 5,000 records' : ''}
      </p>
      <div className="glass table-wrap">
        <table className="lead-table">
          <thead>
            <tr>
              {[
                'Attendee',
                'Contact',
                'Status',
                'Feedback',
              ].map((t) => (
                <th key={t} scope="col">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>
                  <span className="lead-name">
                    {l.name || 'New voice feedback'}
                  </span>
                  <small>{l.school_name || 'Institution not captured'}</small>
                  <small>
                    {new Date(l.created_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {l.mode}
                  </small>
                </td>
                <td>
                  {l.phone ? <a href={`tel:+91${l.phone}`}>{l.phone}</a> : '—'}
                  <small>{l.email || 'No email provided'}</small>
                  <small>
                    {l.email_sent
                      ? 'Email sent'
                      : l.email
                        ? 'Email pending'
                        : '—'}
                  </small>
                </td>
                <td>
                  <span className={'status-tag ' + l.status}>{l.status}</span>
                </td>
                <td className="admin-detail">
                  {(l.bullet_requirements ?? []).map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                  {l.raw_transcript && (
                    <>
                      <button
                        className="secondary"
                        style={{ marginTop: 8 }}
                        onClick={() =>
                          setExpanded(expanded === l.id ? null : l.id)
                        }
                      >
                        {expanded === l.id
                          ? 'Hide transcript'
                          : 'View transcript'}
                      </button>
                      {expanded === l.id && (
                        <p style={{ marginTop: 8 }}>{l.raw_transcript}</p>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty">
            {leads.length
              ? 'No responses match these filters.'
              : 'Visitor feedback will appear here.'}
          </div>
        )}
      </div>
    </main>
  );
}
