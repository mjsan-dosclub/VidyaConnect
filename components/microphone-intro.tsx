'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, ShieldCheck } from 'lucide-react';
import { useLanguage } from './language';

const key = 'originbi-survey-microphone-intro-v1';
export default function MicrophoneIntro() {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem(key) && matchMedia('(max-width: 767px)').matches) dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  function finish(manual = false) {
    localStorage.setItem(key, 'seen');
    dialog.current?.close();
    if (manual) router.push('/form');
  }
  async function enable() {
    setBusy(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      finish();
    } catch {
      setError(t('Microphone access was not enabled. You can try again or use the form.'));
    } finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="mic-intro glass" aria-labelledby="mic-intro-title" onCancel={() => finish()}>
    <Mic size={32} aria-hidden="true" />
    <h2 id="mic-intro-title">{t('Before you share your feedback')}</h2>
    <p>{t('Allow microphone access to speak your suggestions about originBI. Tap Allow when your browser asks.')}</p>
    <p><ShieldCheck size={18} /> {t('Recording starts only when you tap the mic and ends when you tap Stop. The microphone is released after recording or when you leave this page.')}</p>
    <p>{t('Your recording is sent securely to our AI service to create editable text. We save your reviewed feedback and details, not the audio recording.')}</p>
    {error && <p className="error" role="alert">{error}</p>}
    <button className="primary" onClick={() => void enable()} disabled={busy}>{t(busy ? 'Opening microphone…' : 'Enable microphone')}</button>
    <button className="secondary" onClick={() => finish(true)} disabled={busy}>{t('Use the form instead')}</button>
  </dialog>;
}
