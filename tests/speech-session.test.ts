import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SpeechSession,
  speechText,
  type Recognition,
} from '../lib/speech-session';
const result = (text: string, final = true) => ({
  isFinal: final,
  0: { transcript: text },
});
test('Android growing hypotheses appear only once', () => {
  assert.equal(
    speechText(
      [
        'hi',
        'hi my',
        'hi my name',
        'hi my name is',
        'hi my name is Mohan',
        'hi my name is Mohan Raj',
      ].map((s) => result(s)),
      true,
    ),
    'hi my name is Mohan Raj',
  );
});
test('Distinct final phrases and intentional repetition are preserved', () => {
  assert.equal(
    speechText(
      [result('Demo please'), result('Demo please'), result('Next week')],
      false,
    ),
    'Demo please Demo please Next week',
  );
});
test('Interim replacements never append to an earlier event', async () => {
  const instances: Recognition[] = [];
  let text = '';
  let listening = false;
  let starts = 0;
  const session = new SpeechSession({
    android: true,
    restartDelay: 1,
    create: () => {
      const r: Recognition = {
        continuous: true,
        interimResults: true,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
        start() {
          starts++;
        },
        stop() {
          this.onend?.();
        },
        abort() {},
      };
      instances.push(r);
      return r;
    },
    onText: (v) => (text = v),
    onListening: (v) => (listening = v),
    onError: () => assert.fail('unexpected error'),
  });
  session.start('Existing notes');
  instances[0].onresult?.({ results: [result('hi')] });
  instances[0].onresult?.({
    results: [result('hi'), result('hi my name is Mohan')],
  });
  assert.equal(text, 'Existing notes hi my name is Mohan');
  assert.equal(instances[0].interimResults, false);
  instances[0].onend?.();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(listening, true);
  assert.equal(starts, 2);
  instances[1].onresult?.({ results: [result('from Example Institution')] });
  assert.equal(
    text,
    'Existing notes hi my name is Mohan from Example Institution',
  );
  session.stop();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(listening, false);
  assert.equal(starts, 2);
  session.dispose();
});
test('Permission denial and disposal prevent automatic restart', async () => {
  let r!: Recognition;
  let starts = 0;
  let errors = 0;
  const session = new SpeechSession({
    android: false,
    restartDelay: 1,
    create: () =>
      (r = {
        continuous: false,
        interimResults: false,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
        start() {
          starts++;
        },
        stop() {},
        abort() {},
      }),
    onText: () => {},
    onListening: () => {},
    onError: () => errors++,
  });
  session.start('');
  r.onerror?.({ error: 'not-allowed' });
  r.onend?.();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(starts, 1);
  assert.equal(errors, 1);
  session.start('');
  r.onend?.();
  session.dispose();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(starts, 2);
});
test('Tamil recognition locale survives automatic restarts', async () => {
  const instances: Recognition[] = [];
  const session = new SpeechSession({
    android: true,
    language: 'ta-IN',
    restartDelay: 1,
    create: () => {
      const r: Recognition = {
        continuous: false,
        interimResults: false,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
        start() {},
        stop() {},
        abort() {},
      };
      instances.push(r);
      return r;
    },
    onText: () => {},
    onListening: () => {},
    onError: () => assert.fail('unexpected error'),
  });
  session.start('வணக்கம்');
  assert.equal(instances[0].lang, 'ta-IN');
  instances[0].onend?.();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(instances[1].lang, 'ta-IN');
  session.dispose();
});

test('Stop waits for the closing name before allowing submission', async () => {
  let recognition!: Recognition;
  let transcript = '';
  let stopped = false;
  const session = new SpeechSession({
    android: false,
    create: () => recognition = {continuous:false,interimResults:false,lang:'',onresult:null,onerror:null,onend:null,start(){},stop(){},abort(){}},
    onText: value => transcript = value,
    onListening: () => {},
    onError: () => assert.fail('unexpected error'),
  });
  session.start('');
  recognition.onresult?.({results:[{isFinal:true,0:{transcript:'Please add reports.'}}]});
  const pending = session.stop().then(() => stopped = true);
  await Promise.resolve();
  assert.equal(stopped, false);
  recognition.onresult?.({results:[{isFinal:true,0:{transcript:'Please add reports. My name is Mohan Raj.'}}]});
  recognition.onend?.();
  await pending;
  assert.equal(stopped, true);
  assert.equal(transcript, 'Please add reports. My name is Mohan Raj.');
  session.dispose();
});
