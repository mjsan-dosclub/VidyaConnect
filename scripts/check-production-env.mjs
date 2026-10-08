const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'CRON_SECRET',
  'RATE_LIMIT_SALT',
  'NEXT_PUBLIC_APP_URL',
];
const problems = [];
for (const key of required)
  if (!process.env[key]?.trim()) problems.push(`Missing ${key}`);
for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_APP_URL']) {
  const value = process.env[key];
  if (!value) continue;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      ['localhost', '127.0.0.1'].includes(url.hostname) ||
      url.username ||
      url.password
    )
      problems.push(`${key} must be a public HTTPS URL`);
    if (url.hostname === 'your-app.vercel.app')
      problems.push(`${key} still uses the example hostname`);
  } catch {
    problems.push(`${key} is not a valid URL`);
  }
}
if (process.env.EMAIL_FROM?.includes('your-verified-domain.com'))
  problems.push('EMAIL_FROM must use your Resend-verified sender domain');
for (const key of ['CRON_SECRET', 'RATE_LIMIT_SALT'])
  if (process.env[key] && process.env[key].length < 32)
    problems.push(`${key} must contain at least 32 characters`);
if (
  (process.env.LOCAL_PREVIEW_MODE ?? process.env.KARYAAI_LOCAL_MODE) === 'true'
)
  problems.push('Set LOCAL_PREVIEW_MODE=false for production');
if (problems.length) {
  console.error('Production configuration incomplete:');
  for (const message of problems) console.error(`- ${message}`);
  process.exit(1);
}
console.log('Production environment checks passed. No secret values printed.');
