import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'CRON_SECRET',
  'RATE_LIMIT_SALT',
  'NEXT_PUBLIC_APP_URL',
  'LOCAL_PREVIEW_MODE',
  'KARYAAI_LOCAL_MODE',
];
const clean = { ...process.env };
for (const key of keys) delete clean[key];
const configured = {
  ...clean,
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-public-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-private-key',
  GEMINI_API_KEY: 'test-ai-key',
  RESEND_API_KEY: 'test-email-key',
  EMAIL_FROM: 'VidyaConnect <hello@verified.test>',
  CRON_SECRET: 'x'.repeat(64),
  RATE_LIMIT_SALT: 'y'.repeat(64),
  NEXT_PUBLIC_APP_URL: 'https://vidyaconnect.test',
  LOCAL_PREVIEW_MODE: 'false',
};
function run(env: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, ['scripts/check-production-env.mjs'], {
    env,
    encoding: 'utf8',
  });
}
test('deployment preflight fails when services are unconfigured', () => {
  const r = run(clean);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Missing GEMINI_API_KEY/);
});
test('deployment preflight accepts complete HTTPS configuration without printing secrets', () => {
  const r = run(configured);
  assert.equal(r.status, 0);
  assert.doesNotMatch(
    r.stdout + r.stderr,
    /test-private-key|test-ai-key|test-email-key/,
  );
});
test('deployment preflight blocks local storage and loopback production URLs', () => {
  const r = run({
    ...configured,
    LOCAL_PREVIEW_MODE: 'true',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /public HTTPS URL/);
  assert.match(r.stderr, /LOCAL_PREVIEW_MODE=false/);
});
