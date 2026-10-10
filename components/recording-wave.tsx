'use client';
import { useId } from 'react';

/** A decorative ribbon: activity indicates recording, not measured microphone volume. */
export default function RecordingWave({ recording }: { recording: boolean }) {
  const gradient = useId();
  return (
    <div className={`waveform ribbon-wave${recording ? ' is-recording' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 300 96" fill="none" focusable="false">
        <defs>
          <linearGradient id={gradient} x1="8" y1="48" x2="292" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b8aedf" />
            <stop offset="0.28" stopColor="#6650bc" />
            <stop offset="0.72" stopColor="#21b88a" />
            <stop offset="1" stopColor="#b7dfd2" />
          </linearGradient>
        </defs>
        <g stroke={`url(#${gradient})`} strokeLinecap="round">
          <path className="ribbon ribbon-primary" strokeWidth="2.5" d="M8 48C20 48 22 27 34 27S48 69 60 69S75 39 88 43 M212 43C225 39 228 69 240 69S254 27 266 27S280 48 292 48" />
          <path className="ribbon ribbon-secondary" strokeWidth="1.5" d="M8 48C22 48 24 62 36 62S49 34 62 34S77 53 88 49 M212 49C223 53 225 34 238 34S251 62 264 62S278 48 292 48" />
          <path className="ribbon ribbon-soft" strokeWidth="1" d="M8 48C23 48 27 41 39 41S55 56 68 56S81 47 88 48 M212 48C219 47 219 56 232 56S249 41 261 41S277 48 292 48" />
        </g>
      </svg>
    </div>
  );
}
