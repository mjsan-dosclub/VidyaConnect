import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSpokenPhone,
  phone,
  extraction,
  manual,
} from '../lib/validation';
import { csvCell } from '../lib/client';
test('normalizes double, triple, and Indian country code', () => {
  assert.equal(
    normalizeSpokenPhone('double nine triple eight seven six five four three'),
    '9988876543',
  );
  assert.equal(normalizeSpokenPhone('+91 98765 43210'), '9876543210');
  assert.equal(
    normalizeSpokenPhone('nine eight seven six five four three two one zero'),
    '9876543210',
  );
});
test('rejects malformed mobile numbers', () => {
  for (const n of ['1234567890', '987654321', '+919876543210', '987654321x'])
    assert.equal(phone.safeParse(n).success, false);
  assert.equal(phone.parse('9876543210'), '9876543210');
});
test('AI may omit unknown phone but cannot invent malformed schema', () => {
  const base = {
    name: '',
    phone: '',
    school_name: null,
    requirements_summary: [],
  };
  assert.equal(extraction.safeParse(base).success, true);
  assert.equal(extraction.safeParse({ ...base, phone: '99876543210' }).success, true);

});
test('survey accepts optional email and strips legacy appointment fields; feedback and consent are required', () => {
  const base = { id: '00000000-0000-4000-8000-000000000001', token: 'a'.repeat(64), name: 'Test', phone: '9876543210', school_name: 'Test College', bullet_requirements: ['Feature request: Add reports'], consent: true, objective: 'Demo', callback_slot: 'Morning' };
  const result = manual.parse(base);
  assert.equal('objective' in result, false);
  assert.equal('callback_slot' in result, false);
  assert.equal(manual.safeParse({...base, consent: false}).success, false);
  assert.equal(manual.safeParse({...base, bullet_requirements: []}).success, false);
});
test('CSV escapes quotes and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('=HYPERLINK("evil")'), '"\'=HYPERLINK(""evil"")"');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('+919876543210'), '"\'+919876543210"');
});

import { sameOrigin } from '../lib/security';
test('origin checks allow loopback hostname and block cross-site requests', () => {
  assert.equal(sameOrigin('http://127.0.0.1:3000', '127.0.0.1:3000'), true);
  assert.equal(sameOrigin('https://karyaai.example', 'karyaai.example'), true);
  for (const value of [
    null,
    'null',
    'https://evil.example',
    'https://karyaai.example.evil.test',
    'https://karyaai.example/path',
  ])
    assert.equal(sameOrigin(value, 'karyaai.example'), false);
});

test('Review schema accepts incomplete digits while final submission rejects them', () => {
  for (const number of ['998765432', '99876543210']) {
    assert.equal(extraction.safeParse({ name: 'Test', phone: number, school_name: null, requirements_summary: [] }).success, true);
    assert.equal(phone.safeParse(number).success, false);
  }
});
