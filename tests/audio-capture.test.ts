import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioCapture, audioMime, MAX_AUDIO_BYTES } from '../lib/audio-capture';
function fixture() {
  let stopped = 0;
  let r: any;
  const stream = {
    getTracks: () => [
      {
        stop() {
          stopped++;
        },
      },
    ],
  } as unknown as MediaStream;
  const errors: string[] = [];
  const capture = new AudioCapture({
    getStream: async () => stream,
    create: () => {
      r = {
        state: 'inactive' as RecordingState,
        mimeType: 'audio/webm',
        ondataavailable: null,
        onerror: null,
        onstop: null,
        start() {
          this.state = 'recording';
        },
        stop() {
          this.ondataavailable?.({ data: new Blob(['speech']) });
          this.state = 'inactive';
          this.onstop?.();
        },
      };
      return r as MediaRecorder;
    },
    onError: (e) => errors.push(e),
  });
  return {
    capture,
    errors,
    get r() {
      return r;
    },
    get stopped() {
      return stopped;
    },
  };
}
test('Audio fallback keeps recording until explicit Stop and returns final chunk', async () => {
  const f = fixture();
  assert.equal(await f.capture.start(), true);
  assert.equal(f.r.state, 'recording');
  const blob = await f.capture.stop();
  assert.equal(await blob?.text(), 'speech');
  assert.equal(f.stopped, 1);
  assert.equal(blob?.type, 'audio/webm');
});
test('Cancelled microphone permission request releases late stream', async () => {
  let resolve!: (stream: MediaStream) => void;
  let stopped = 0;
  const c = new AudioCapture({
    getStream: () => new Promise((r) => (resolve = r)),
    create: () => assert.fail('must not record'),
    onError: () => {},
  });
  const pending = c.start();
  c.cancel();
  resolve({
    getTracks: () => [
      {
        stop() {
          stopped++;
        },
      },
    ],
  } as unknown as MediaStream);
  assert.equal(await pending, false);
  assert.equal(stopped, 1);
});
test('Recorder errors and size limits release microphone', async () => {
  const f = fixture();
  await f.capture.start();
  f.r.ondataavailable({
    data: new Blob([new Uint8Array(MAX_AUDIO_BYTES + 1)]),
  });
  assert.equal(f.stopped, 1);
  assert.equal(f.errors.length, 1);
  assert.equal(await f.capture.stop(), null);
});
test('Choose supported container without assuming Chrome codecs', () => {
  assert.equal(
    audioMime((m) => m === 'audio/mp4'),
    'audio/mp4',
  );
  assert.equal(
    audioMime(() => false),
    '',
  );
});
