'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Square,
  Sparkles,
  ArrowRight,
  PenLine,
  Check,
  LoaderCircle,
  AudioLines,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getSession, saveSession, post } from '@/lib/client';
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: {
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
export function ModeToggle({ manual = false }: { manual?: boolean }) {
  return (
    <nav className="mode-toggle glass" aria-label="Capture mode">
      <Link
        href="/"
        aria-current={!manual ? 'page' : undefined}
        className={!manual ? 'selected' : ''}
      >
        <Mic size={17} />
        Voice Mode
      </Link>
      <Link
        href="/form"
        aria-current={manual ? 'page' : undefined}
        className={manual ? 'selected' : ''}
      >
        <PenLine size={17} />
        Manual Form
      </Link>
    </nav>
  );
}
export default function Voice() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('');
  const rec = useRef<Recognition | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const p = getSession();
    setText(p.transcript ?? '');
    return () => rec.current?.abort();
  }, []);
  function change(v: string) {
    setText(v);
    const p = getSession();
    saveSession({ ...p, transcript: v });
  }
  function listen() {
    setError('');
    if (recording) {
      rec.current?.stop();
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const API = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!API) {
      setError(
        'Voice recognition is unavailable in this browser. You can type your introduction below.',
      );
      document.getElementById('transcript')?.focus();
      return;
    }
    const recognition = new API();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    const base = text.trim();
    recognition.onresult = (e) => {
      const spoken = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      change([base, spoken].filter(Boolean).join(' ').slice(0, 8000));
    };
    recognition.onerror = (e) => {
      setRecording(false);
      setError(
        e.error === 'not-allowed'
          ? 'Microphone permission was denied. Enable it in browser settings or type below.'
          : 'Recording stopped. Your transcript is still here; you can edit or try again.',
      );
    };
    recognition.onend = () => setRecording(false);
    rec.current = recognition;
    try {
      recognition.start();
      setRecording(true);
    } catch {
      setError('Could not start the microphone. Please type below.');
    }
  }
  async function processVoice() {
    setBusy(true);
    setError('');
    try {
      const p = getSession();
      saveSession({ ...p, transcript: text });
      setPhase('Saving your introduction…');
      await post('/api/draft', { ...p, transcript: text });
      setPhase('Preparing your review…');
      const result = await post('/api/parse-voice', p);
      saveSession({ ...p, transcript: text, ...result });
      router.push('/confirmation');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again');
    } finally {
      setBusy(false);
      setPhase('');
    }
  }
  return (
    <>
      <section className="intro">
        <span className="eyebrow">
          <span className="live-dot" /> A BETTER WAY TO CONNECT
        </span>
        <h1>
          Your institution’s next chapter
          <br />
          starts with <em>a conversation.</em>
        </h1>
        <p>
          Skip the queue. Tell us what’s on your mind.
          <br />
          We’ll take care of the details.
        </p>
      </section>
      <ModeToggle />
      <div className="step-row">
        <span className="step active">
          1 <small>Share</small>
        </span>
        <i />
        <span className="step">
          2 <small>Review</small>
        </span>
        <i />
        <span className="step">
          3 <small>Connect</small>
        </span>
      </div>
      <section className="cue-card glass">
        <div className="card-heading">
          <span className="tiny-icon">
            <AudioLines size={18} />
          </span>
          <div>
            <h2>Speak naturally. We’re listening.</h2>
            <p>A quick introduction is all it takes.</p>
          </div>
          <span className="pill">~30 sec</span>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>Your name & institution / organisation name</div>
          </li>
          <li>
            <span>02</span>
            <div>Your 10-digit mobile number</div>
          </li>
          <li>
            <span>03</span>
            <div>Your requirement or pain point</div>
          </li>
        </ol>
      </section>
      <section className="record-zone">
        <div className={'mic-orbit ' + (recording ? 'listening' : '')}>
          <button
            className="mic-button"
            onClick={listen}
            disabled={busy}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            aria-pressed={recording}
          >
            {recording ? (
              <Square size={30} fill="currentColor" />
            ) : (
              <Mic size={34} />
            )}
          </button>
        </div>
        <strong>
          {recording ? 'Listening to you…' : 'Tap to start speaking'}
        </strong>
        <p>
          {recording
            ? 'Tap again when you’re finished.'
            : 'A little about you. A lot of possibilities.'}
        </p>
        <div className="waveform" aria-hidden="true">
          {Array.from({ length: 29 }, (_, i) => (
            <motion.span
              key={i}
              animate={
                recording && !reduced
                  ? { height: [6, 12 + ((i * 13) % 30), 6] }
                  : { height: 4 + (Math.sin(i * 1.6) + 1) * 4 }
              }
              transition={{
                duration: 0.7 + (i % 4) * 0.15,
                repeat: Infinity,
                delay: i * 0.025,
              }}
            />
          ))}
        </div>
      </section>
      <section className="transcript-card glass">
        <div className="transcript-heading">
          <label htmlFor="transcript">YOUR INTRODUCTION</label>
          <span>
            <PenLine size={12} /> Tap to edit
          </span>
        </div>
        <textarea
          id="transcript"
          value={text}
          onChange={(e) => change(e.target.value)}
          disabled={recording || busy}
          maxLength={8000}
          placeholder="“Hi, I’m Priya from Green Valley Academy. My number is… We’re looking for a smarter way to…”"
          rows={4}
        />
        <div className="transcript-bottom">
          <span>
            <Check size={12} /> Always review before sending
          </span>
          <span>{text.length}/8000</span>
        </div>
      </section>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="action-dock">
        <button
          className="primary"
          onClick={processVoice}
          disabled={text.trim().length < 10 || recording || busy}
        >
          {busy ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <Sparkles size={18} />
          )}{' '}
          {busy ? phase : 'Submit'}
          {!busy && <ArrowRight size={18} />}
        </button>
        <p>One conversation. A tailored next step.</p>
      </div>
    </>
  );
}
