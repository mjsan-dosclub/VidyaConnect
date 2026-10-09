import test from 'node:test';
import assert from 'node:assert/strict';
import { PcmCapture, encodeWav, isIosDevice } from '../lib/pcm-capture';
test('iPhone Chrome and Safari take PCM capture while Android retains recognition', () => {
  assert.equal(isIosDevice('iPhone CriOS', 'iPhone', 1), true);
  assert.equal(isIosDevice('iPhone Safari', 'iPhone', 1), true);
  assert.equal(isIosDevice('Macintosh', 'MacIntel', 5), true);
  assert.equal(isIosDevice('Android Chrome', 'Linux', 5), false);
  assert.equal(isIosDevice('Macintosh', 'MacIntel', 0), false);
});
test('PCM Stop resolves without waiting for browser recognition or recorder end events', async () => {
  let released = 0;
  let closed = 0;
  const processor: any = {
    onaudioprocess: null,
    connect() {},
    disconnect() {},
  };
  const source = { connect() {}, disconnect() {} };
  const context: any = {
    sampleRate: 48000,
    destination: {},
    resume: async () => {},
    close: async () => {
      closed++;
    },
    createMediaStreamSource: () => source,
    createScriptProcessor: () => processor,
    createGain: () => ({ gain: { value: 0 }, connect() {}, disconnect() {} }),
  };
  const capture = new PcmCapture({
    onError: () => assert.fail('unexpected error'),
    getContext: () => context,
    getStream: async () =>
      ({
        getTracks: () => [
          {
            stop() {
              released++;
            },
          },
        ],
      }) as unknown as MediaStream,
  });
  await capture.start();
  processor.onaudioprocess({
    inputBuffer: { getChannelData: () => new Float32Array(24000).fill(0.2) },
  });
  const blob = await capture.stop();
  assert.equal(blob?.type, 'audio/wav');
  assert.equal(blob?.size, 16044);
  assert.equal(released, 1);
  assert.equal(closed, 1);
  assert.equal(processor.onaudioprocess, null);
});
test('WAV is mono 16kHz PCM with bounded sample values', async () => {
  const r = encodeWav(new Float32Array([2, -2, 0.5]), 16000);
  const view = new DataView(await r.blob.arrayBuffer());
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getInt16(44, true), 32767);
  assert.equal(view.getInt16(46, true), -32768);
});
