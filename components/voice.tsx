'use client';
import { PcmCapture, isIosDevice } from '@/lib/pcm-capture';
import { AudioCapture, audioMime, blobBase64 } from '@/lib/audio-capture';
import { useLanguage } from './language';
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
} from 'lucide-react';
import RecordingWave from './recording-wave';
import { getSession, saveSession, post } from '@/lib/client';
import { transcriptionPayload } from '@/lib/transcription';
export function ModeToggle({ manual = false }: { manual?: boolean }) {
  const { t } = useLanguage();
  return (
    <nav className="mode-toggle glass" aria-label={t('Capture mode')}>
      <Link
        href="/"
        aria-current={!manual ? 'page' : undefined}
        className={!manual ? 'selected' : ''}
      >
        <Mic size={17} />
        {t('Voice Mode')}
      </Link>
      <Link
        href="/form"
        aria-current={manual ? 'page' : undefined}
        className={manual ? 'selected' : ''}
      >
        <PenLine size={17} />
        {t('Manual Form')}
      </Link>
    </nav>
  );
}
export default function Voice() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('');
  const audio = useRef<AudioCapture | PcmCapture | null>(null);
  const audioGeneration = useRef(0);
  const audioPrefix = useRef('');
  const [savedAudio, setSavedAudio] = useState<Blob | null>(null);
  const textRef = useRef('');
  useEffect(() => {
    const p = getSession();
    textRef.current = p.transcript ?? '';
    setText(textRef.current);
    return () => {
      audio.current?.cancel();
      audioGeneration.current++;
    };
  }, []);
  function change(v: string) {
    textRef.current = v;
    setText(v);
    const p = getSession();
    saveSession({ ...p, transcript: v });
  }
  function listen() {
    setError('');
    // Display language never selects a speech locale. Both languages use the same audio pipeline.
    if (recording) void stopAudio();
    else void startAudio();
  }

  async function startAudio() {
    audio.current?.cancel();
    const generation = ++audioGeneration.current;
    setError('');
    setSavedAudio(null);
    setBusy(true);
    setPhase(t('Opening microphone…'));
    audioPrefix.current = textRef.current;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      (!isIosDevice(
        navigator.userAgent,
        navigator.platform,
        navigator.maxTouchPoints,
      ) &&
        typeof MediaRecorder === 'undefined')
    ) {
      setBusy(false);
      setError(
        t(
          'Audio recording is unavailable. Please type below or use Manual Form.',
        ),
      );
      return;
    }
    const onCaptureError = (message: string) => {
      if (generation !== audioGeneration.current) return;
      setRecording(false);
      setBusy(false);
      setError(t(message));
    };
    const capture = isIosDevice(
      navigator.userAgent,
      navigator.platform,
      navigator.maxTouchPoints,
    )
      ? new PcmCapture({ onError: onCaptureError })
      : new AudioCapture({
          getStream: () => navigator.mediaDevices.getUserMedia({ audio: { channelCount: { ideal: 1 }, echoCancellation: true, noiseSuppression: true } }),
          create: (stream) => {
            const mime = audioMime((m) => MediaRecorder.isTypeSupported(m));
            return new MediaRecorder(stream, {
              ...(mime ? { mimeType: mime } : {}),
              audioBitsPerSecond: 64000,
            });
          },
          onError: (message) => {
            if (generation !== audioGeneration.current) return;
            setRecording(false);
            setBusy(false);
            setError(t(message));
          },
        });
    audio.current = capture;
    try {
      if ((await capture.start()) && generation === audioGeneration.current)
        setRecording(true);
    } catch {
      if (generation === audioGeneration.current)
        setError(
          t(
            'Microphone permission was denied. Enable it in browser settings or type below.',
          ),
        );
    } finally {
      if (generation === audioGeneration.current) { setBusy(false); setPhase(''); }
    }
  }
  async function transcribeAudio(
    blob: Blob,
    generation = audioGeneration.current,
  ) {
    setBusy(true);
    setError('');
    setPhase(t('Transcribing your recording…'));
    try {
      const result = await post('/api/transcribe', transcriptionPayload(await blobBase64(blob), blob.type));
      if (generation !== audioGeneration.current) return;
      if (!result.transcript?.trim())
        throw new Error(
          t('No speech was heard. Please try again or type below.'),
        );
      change(
        [audioPrefix.current, result.transcript.trim()]
          .filter(Boolean)
          .join(' ')
          .slice(0, 8000),
      );
      setSavedAudio(null);
    } catch (e) {
      if (generation === audioGeneration.current)
        setError(e instanceof Error ? e.message : t('Please try again'));
    } finally {
      if (generation === audioGeneration.current) {
        setBusy(false);
        setPhase('');
      }
    }
  }
  async function stopAudio() {
    const generation = audioGeneration.current;
    setRecording(false);
    setBusy(true);
    const blob = await audio.current?.stop();
    if (generation !== audioGeneration.current) return;
    if (!blob?.size) {
      setBusy(false);
      setError(t('No speech was heard. Please try again or type below.'));
      return;
    }
    setSavedAudio(blob);
    await transcribeAudio(blob, generation);
  }

  async function processVoice() {
    setBusy(true);
    setError('');
    try {
      const p = getSession();
      saveSession({ ...p, transcript: text, language });
      setPhase(t('Saving your feedback…'));
      await post('/api/draft', { ...p, transcript: text, language });
      setPhase(t('Preparing your review…'));
      const result = await post('/api/parse-voice', { ...p, language });
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
    <div className="voice-survey">
      <p className="capture-tagline">
        {t('Help shape originBI. Speak it, or write it.')}
      </p>
      <ModeToggle />
      <section className="cue-card glass">
        <h2>{t('Speak in Tamil, English, or both')}</h2>
        <ol>
          <li>
            <span>01</span>
            <div>{t('Your name and institution / organisation')}</div>
          </li>
          <li>
            <span>02</span>
            <div>{t('Your 10-digit mobile number')}</div>
          </li>
          <li>
            <span>03</span>
            <div>{t('Your problems, suggestions or expected solutions')}</div>
          </li>
        </ol>
      </section>
      <section className="record-zone">
        <RecordingWave recording={recording} />
        <div className={'mic-orbit ' + (recording ? 'listening' : '')}>
          <button
            className="mic-button"
            onClick={listen}
            disabled={busy}
            aria-label={t(recording ? 'Stop recording' : 'Start recording')}
            aria-pressed={recording}
          >
            {recording ? (
              <>
                <Square size={26} fill="currentColor" aria-hidden="true" />
                <span className="mic-control-label">{t('Stop')}</span>
              </>
            ) : (
              <Mic size={34} />
            )}
          </button>
        </div>
        <strong aria-live="polite">
          {busy
            ? phase || t('Opening microphone…')
            : recording
              ? t('Recording. Tap Stop to see your words.')
              : t('Tap the mic. Mix Tamil and English freely.')}
        </strong>
      </section>
      {savedAudio && !busy && (
        <button
          type="button"
          className="secondary"
          onClick={() => void transcribeAudio(savedAudio)}
        >
          {t('Retry transcription')}
        </button>
      )}
      <section className="transcript-card glass">
        <div className="transcript-heading">
          <label htmlFor="transcript">{t('Your transcript')}</label>
          <span>
            <PenLine size={12} />
            {t('Tap to edit')}
          </span>
        </div>
        <textarea
          id="transcript"
          value={text}
          onChange={(e) => change(e.target.value)}
          disabled={recording || busy}
          maxLength={8000}
          placeholder={t(
            '“I’m Priya from Green Valley Academy. My number is… I’d like originBI to add… Our current challenge is…”',
          )}
          rows={3}
        />
        <div className="transcript-bottom">
          <span>
            <Check size={12} />
            {t('Review your words before sending')}
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
          {busy ? phase : t('Submit')}
          {!busy && <ArrowRight size={18} />}
        </button>
        <p>
          {t('Silence does not send anything. Tap stop, review, then submit.')}
        </p>
      </div>
    </div>
  );
}
