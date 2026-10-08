export const runtime = 'nodejs';
import { handle } from '@/lib/server';
import { identity } from '@/lib/validation';
import { z } from 'zod';
import { saveDraft } from '@/lib/lead-store';
export const POST = handle(async (req) => {
  const p = identity
    .extend({ transcript: z.string().trim().min(10).max(8000) })
    .parse(await req.json());
  await saveDraft(p, 'voice');
  return { id: p.id, status: 'draft' };
});
