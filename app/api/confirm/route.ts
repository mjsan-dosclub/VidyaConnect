export const maxDuration = 60;
export const runtime = 'nodejs';
import { handle } from '@/lib/server';
import { identity, details } from '@/lib/validation';
import { z } from 'zod';
import { sendPending } from '@/lib/email';
import { finalize } from '@/lib/lead-store';
import { localMode } from '@/lib/local-store';
export const POST = handle(async (req) => {
  const p = identity
    .extend({ ...details.shape, consent: z.literal(true) })
    .parse(await req.json());
  await finalize(p, 'confirmed');
  let email: { queued: boolean; enabled?: boolean } = { queued: true };
  try {
    email = await sendPending(p.id);
  } catch {}
  return { status: 'confirmed', email, local_mode: localMode() };
});
