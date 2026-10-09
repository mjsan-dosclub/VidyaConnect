export const MAX_AUDIO_BYTES = 2000000;
export function audioMime(supported: (mime: string) => boolean) {
  return (
    [
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ].find(supported) ?? ''
  );
}
export class AudioCapture {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private cancelled = false;
  private resolveStop: ((blob: Blob | null) => void) | null = null;
  constructor(
    private options: {
      getStream: () => Promise<MediaStream>;
      create: (stream: MediaStream) => MediaRecorder;
      onError: (message: string) => void;
    },
  ) {}
  async start() {
    const stream = await this.options.getStream();
    if (this.cancelled) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    this.stream = stream;
    try {
      const recorder = this.options.create(stream);
      this.recorder = recorder;
      recorder.ondataavailable = (event) => {
        if (this.cancelled) return;
        this.chunks.push(event.data);
        if (this.chunks.reduce((n, b) => n + b.size, 0) > MAX_AUDIO_BYTES) {
          this.cancel();
          this.options.onError(
            'The recording is too large. Please record a shorter introduction.',
          );
        }
      };
      recorder.onerror = () => {
        this.cancel();
        this.options.onError(
          'Could not record audio. Please retry or type below.',
        );
      };
      recorder.onstop = () => {
        const blob = this.cancelled
          ? null
          : new Blob(this.chunks, {
              type: recorder.mimeType || this.chunks[0]?.type || 'audio/webm',
            });
        this.release();
        this.recorder = null;
        this.resolveStop?.(blob);
        this.resolveStop = null;
      };
      recorder.start(1000);
      return true;
    } catch (error) {
      this.release();
      throw error;
    }
  }
  stop(): Promise<Blob | null> {
    const recorder = this.recorder;
    if (!recorder || recorder.state === 'inactive')
      return Promise.resolve(null);
    return new Promise((resolve) => {
      this.resolveStop = resolve;
      try {
        recorder.stop();
      } catch {
        this.cancel();
      }
    });
  }
  private release() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
  cancel() {
    this.cancelled = true;
    const recorder = this.recorder;
    this.recorder = null;
    if (recorder) {
      recorder.ondataavailable = recorder.onerror = recorder.onstop = null;
      if (recorder.state !== 'inactive')
        try {
          recorder.stop();
        } catch {}
    }
    this.release();
    this.resolveStop?.(null);
    this.resolveStop = null;
    this.chunks = [];
  }
}
export function blobBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Could not read recording'));
    reader.readAsDataURL(blob);
  });
}
