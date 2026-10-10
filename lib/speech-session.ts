export type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
export type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

// Android can report growing hypotheses as separate results. Replace those
// prefixes within this recognition session instead of appending each version.
export function speechText(results: ArrayLike<SpeechResult>, android: boolean) {
  const segments: { text: string; final: boolean }[] = [];
  for (const result of Array.from(results)) {
    const text = result[0].transcript.trim();
    if (!text) continue;
    const previous = segments.at(-1);
    if (
      previous &&
      (android || !previous.final) &&
      (text.toLowerCase() === previous.text.toLowerCase() ||
        text.toLowerCase().startsWith(previous.text.toLowerCase() + ' '))
    ) {
      segments[segments.length - 1] = { text, final: result.isFinal };
    } else segments.push({ text, final: result.isFinal });
  }
  return segments.map((s) => s.text).join(' ');
}

export class SpeechSession {
  private recognition: Recognition | null = null;
  private restart: ReturnType<typeof setTimeout> | undefined;
  private listening = false;
  private text = '';
  private finishStop: (() => void) | null = null;
  constructor(
    private options: {
      create: () => Recognition;
      android: boolean;
      language?: 'en-IN' | 'ta-IN';
      onText: (text: string) => void;
      onListening: (listening: boolean) => void;
      onError: (message: string) => void;
      restartDelay?: number;
    },
  ) {}
  start(text: string) {
    this.dispose();
    this.text = text.trim();
    this.listening = true;
    this.options.onListening(true);
    this.begin();
  }
  private begin() {
    if (!this.listening) return;
    const recognition = this.options.create();
    this.recognition = recognition;
    // Android's continuous + interim combination can duplicate hypotheses.
    // Short final-result sessions are restarted while the user wants to listen.
    recognition.continuous = !this.options.android;
    recognition.interimResults = !this.options.android;
    recognition.lang = this.options.language ?? 'en-IN';
    const base = this.text;
    recognition.onresult = (event) => {
      if (this.recognition !== recognition) return;
      const spoken = speechText(event.results, this.options.android);
      this.text = [base, spoken].filter(Boolean).join(' ').slice(0, 8000);
      this.options.onText(this.text);
    };
    recognition.onerror = (event) => {
      if (this.recognition !== recognition || !this.listening) return;
      if (event.error === 'no-speech') return;
      this.listening = false;
      this.options.onListening(false);
      this.options.onError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone permission was denied. Enable it in browser settings or type below.'
          : 'The microphone connection was interrupted. Your transcript is saved; tap to retry or type below.',
      );
    };
    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      this.recognition = null;
      if (this.listening) {
        this.restart = setTimeout(
          () => this.begin(),
          this.options.restartDelay ?? 300,
        );
      } else {
        this.options.onListening(false);
        this.finishStop?.();
      }
    };
    try {
      recognition.start();
    } catch {
      this.listening = false;
      this.recognition = null;
      this.options.onListening(false);
      this.options.onError(
        'Could not start the microphone. Your transcript is saved; please try again or type below.',
      );
    }
  }
  stop(): Promise<void> {
    this.listening = false;
    clearTimeout(this.restart);
    this.options.onListening(false);
    if (!this.recognition) return Promise.resolve();
    // Browsers can deliver the final phrase after Stop. Keep Submit unavailable
    // until onend so a closing name is included in the draft sent for extraction.
    return new Promise(resolve => {
      const finish = () => {
        clearTimeout(timeout);
        this.finishStop = null;
        resolve();
      };
      const timeout = setTimeout(finish, 3000);
      this.finishStop = finish;
      try { this.recognition?.stop(); } catch { finish(); }
    });
  }
  dispose() {
    this.finishStop?.();
    this.listening = false;
    clearTimeout(this.restart);
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      recognition.onresult = recognition.onerror = recognition.onend = null;
      recognition.abort();
    }
  }
}
