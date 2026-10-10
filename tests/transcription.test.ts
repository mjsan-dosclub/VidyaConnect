import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSCRIPTION_PROMPT, transcriptionPayload, transcriptionModel, transcribeWithFallback } from '../lib/transcription';
import { readFileSync } from 'node:fs';
test('Bilingual recording payload never sends the instruction language to STT', () => {
  assert.deepEqual(transcriptionPayload('dGVzdA==', 'audio/webm;codecs=opus'), { audio: 'dGVzdA==', mime: 'audio/webm' });
  const client = readFileSync(new URL('../components/voice.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(client, /new SpeechSession|ta-IN|en-IN|\[language\]/);
});
test('Transcription preserves code-switches, closing identity and all phone digits', () => {
  assert.match(TRANSCRIPTION_PROMPT, /within a sentence/);
  assert.match(TRANSCRIPTION_PROMPT, /Do not translate/);
  assert.match(TRANSCRIPTION_PROMPT, /after feedback/);
  assert.match(TRANSCRIPTION_PROMPT, /fewer or more than ten/);
  assert.equal(transcriptionModel(), 'gemini-3.5-flash-lite');
  assert.equal(transcriptionModel(' custom-audio-model '), 'custom-audio-model');
});

test('Busy full audio model falls back to bilingual transcription without a locale', async () => {
  const calls: string[] = [];
  const result = await transcribeWithFallback(async model => {
    calls.push(model);
    if (calls.length === 1) throw { status: 503 };
    return { transcript: 'We need a dashboard. எங்கள் கல்லூரிக்கு அறிக்கை வேண்டும்.' };
  }, 'gemini-3.8-flash');
  assert.deepEqual(calls, ['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
  assert.match(result.transcript, /dashboard/);
  assert.match(result.transcript, /கல்லூரி/);
});
test('Authentication errors are surfaced rather than retried on another model', async () => {
  let calls = 0;
  await assert.rejects(transcribeWithFallback(async () => { calls++; throw Object.assign(new Error('denied'), { status: 403 }); }));
  assert.equal(calls, 1);
});

test('SDK AbortError timeout uses the same bilingual fallback', async () => {
  let calls = 0;
  const text = await transcribeWithFallback(async () => {
    if (++calls === 1) throw new DOMException('This operation was aborted', 'AbortError');
    return 'Mixed Tamil and English transcript';
  }, 'gemini-3.8-flash');
  assert.equal(calls, 2);
  assert.equal(text, 'Mixed Tamil and English transcript');
});
