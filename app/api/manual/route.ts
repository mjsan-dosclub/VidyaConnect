export const maxDuration = 60;
export const runtime = 'nodejs';
import { handle } from '@/lib/server';
import { manual } from '@/lib/validation';
import { sendPending } from '@/lib/email';
import { saveDraft, finalize } from '@/lib/lead-store';
import { localMode } from '@/lib/local-store';
export const POST = handle(async (req) => {
  const p = manual.parse(await req.json());
  await saveDraft(p, 'manual');
  await finalize(p, 'submitted');
  let email: { queued: boolean; enabled?: boolean } = { queued: true };
  try {
    email = await sendPending(p.id);
  } catch {}
  return { status: 'submitted', email, local_mode: localMode() };
});
