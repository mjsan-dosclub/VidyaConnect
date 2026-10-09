import { db, hash, owned } from './server';
import { localMode, localDraft, localUpdate } from './local-store';
export async function saveDraft(
  p: { id: string; token: string; transcript?: string },
  mode: 'voice' | 'manual',
) {
  if (localMode()) {
    localDraft(p.id, hash(p.token), mode, p.transcript);
    return;
  }
  const { error } = await db()
    .from('leads')
    .insert({
      id: p.id,
      owner_hash: hash(p.token),
      mode,
      status: 'draft',
      ...(p.transcript ? { raw_transcript: p.transcript } : {}),
    });
  if (error && error.code !== '23505') throw error;
  const existing = await owned(p.id, p.token);
  if (existing.mode !== mode) throw new Error('Lead mode mismatch');
  if (mode === 'voice') {
    if (existing.status !== 'draft') throw new Error('Already finalized');
    const { error: updateError } = await db()
      .from('leads')
      .update({ raw_transcript: p.transcript })
      .eq('id', p.id)
      .eq('status', 'draft');
    if (updateError) throw updateError;
  }
}
export async function saveExtraction(
  id: string,
  token: string,
  parsed: {
    name: string;
    phone: string;
    school_name: string | null;
    requirements_summary: string[];
  },
) {
  const patch = {
    name: parsed.name,
    // Invalid-length candidates stay in the review session and raw transcript.
    // The database phone column accepts only valid Indian mobile numbers.
    phone: /^[6-9]\d{9}$/.test(parsed.phone) ? parsed.phone : '',
    school_name: parsed.school_name,
    bullet_requirements: parsed.requirements_summary,
    objective: null,
    callback_date: null,
    callback_slot: null,
  };
  if (localMode()) {
    localUpdate(id, hash(token), patch);
    return;
  }
  const { error } = await db()
    .from('leads')
    .update(patch)
    .eq('id', id)
    .eq('status', 'draft');
  if (error) throw error;
}
export async function finalize(
  p: {
    id: string;
    token: string;
    name: string;
    phone: string;
    school_name: string;
    email?: string;
    bullet_requirements: string[];
  },
  status: 'confirmed' | 'submitted',
) {
  await owned(p.id, p.token);
  if (localMode()) {
    const { id, token, ...fields } = p;
    localUpdate(id, hash(token), { ...fields, status });
    return;
  }
  const { error } = await db().rpc('finalize_lead', {
    p_id: p.id,
    p_details: p,
    p_status: status,
  });
  if (error) throw error;
}
