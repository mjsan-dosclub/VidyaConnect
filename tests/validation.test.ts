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
    detected_objective: 'Know More',
  };
  assert.equal(extraction.safeParse(base).success, true);
  assert.equal(extraction.safeParse({ ...base, phone: '1234' }).success, false);
  assert.equal(
    extraction.safeParse({ ...base, detected_objective: 'Other' }).success,
    false,
  );
});
test('manual submission requires consent, email, and callback', () => {
  assert.equal(
    manual.safeParse({ name: 'Test', phone: '9876543210' }).success,
    false,
  );
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
