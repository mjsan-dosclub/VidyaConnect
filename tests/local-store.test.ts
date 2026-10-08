import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  localMode,
  localDraft,
  localOwned,
  localUpdate,
  localRateLimit,
} from '../lib/local-store';
const original = process.cwd(),
  dir = mkdtempSync(join(tmpdir(), 'karyaai-test-'));
process.chdir(dir);
process.env.KARYAAI_LOCAL_MODE = 'true';
delete process.env.VERCEL;
after(() => {
  process.chdir(original);
  rmSync(dir, { recursive: true, force: true });
});
test('local draft is durable, editable and rejects a different owner', () => {
  localDraft(
    'voice-lead',
    'owner-hash',
    'voice',
    'My introduction before confirmation',
  );
  assert.equal(localOwned('voice-lead', 'owner-hash').status, 'draft');
  assert.throws(() => localOwned('voice-lead', 'wrong-owner'), /access denied/);
  localDraft('voice-lead', 'owner-hash', 'voice', 'Corrected introduction');
  assert.equal(
    localOwned('voice-lead', 'owner-hash').raw_transcript,
    'Corrected introduction',
  );
  assert.ok(statSync(join(dir, '.local/karyaai.sqlite')).size > 0);
});
test('local finalization is immutable and retains transcript', () => {
  localUpdate('voice-lead', 'owner-hash', {
    status: 'confirmed',
    name: 'Test Attendee',
  });
  localUpdate('voice-lead', 'owner-hash', { name: 'Overwrite attempt' });
  const lead = localOwned('voice-lead', 'owner-hash');
  assert.equal(lead.name, 'Test Attendee');
  assert.equal(lead.status, 'confirmed');
  assert.equal(lead.raw_transcript, 'Corrected introduction');
  assert.throws(
    () => localDraft('voice-lead', 'owner-hash', 'voice', 'Another draft'),
    /finalized/,
  );
});
test('manual retries preserve one submitted record and mode isolation', () => {
  localDraft('manual-lead', 'owner-hash', 'manual');
  localUpdate('manual-lead', 'owner-hash', {
    status: 'submitted',
    name: 'Manual Attendee',
  });
  localDraft('manual-lead', 'owner-hash', 'manual');
  assert.equal(localOwned('manual-lead', 'owner-hash').status, 'submitted');
  assert.throws(
    () => localDraft('manual-lead', 'owner-hash', 'voice', 'wrong mode'),
    /mode mismatch/,
  );
});
test('local request limit survives repeated calls', () => {
  for (let i = 0; i < 30; i++) assert.equal(localRateLimit('test-ip'), true);
  assert.equal(localRateLimit('test-ip'), false);
});
test('Vercel never enables local fallback', () => {
  process.env.VERCEL = '1';
  assert.equal(localMode(), false);
  delete process.env.VERCEL;
  assert.equal(localMode(), true);
});
