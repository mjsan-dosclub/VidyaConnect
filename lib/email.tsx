import 'server-only';
import { emailFailure } from './email-failure';
import { Resend } from 'resend';
import { db } from './server';
import ThankYou from '@/emails/thank-you';
import { localMode } from './local-store';
export async function sendPending(id?: string) {
  if (localMode()) return { queued: false, enabled: false };
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return { queued: true };
  let query = db()
    .from('email_outbox')
    .select('lead_id,leads(name,email,bullet_requirements)')
    .is('sent_at', null)
    .limit(50);
  if (id) query = query.eq('lead_id', id);
  const { data, error } = await query;
  if (error) throw error;
  let sent = 0;
  const failures: { id: string; reason: string }[] = [];
  for (const item of data ?? []) {
    const lead = item.leads as unknown as {
      name: string;
      email: string;
      bullet_requirements: string[];
    };
    if (!lead?.email) continue;
    try {
      const res = await new Resend(process.env.RESEND_API_KEY).emails.send(
        {
          from: process.env.EMAIL_FROM,
          to: lead.email,
          subject: 'Thank you for helping shape OriginBI',
          react: (
            <ThankYou
              name={lead.name}
              requirements={lead.bullet_requirements ?? []}
            />
          ),
        },
        { idempotencyKey: `karyaai-thanks-${item.lead_id}` },
      );
      if (res.error) {
        failures.push({ id: item.lead_id, reason: emailFailure(res.error) });
        continue;
      }
      const { error: markError } = await db().rpc('mark_email_sent', {
        p_id: item.lead_id,
      });
      if (markError) throw markError;
      sent++;
    } catch {
      failures.push({ id: item.lead_id, reason: 'delivery_or_status_update_failed' });
      /* Durable outbox remains pending for retry. */
    }
  }
  return { sent, queued: sent === 0, ...(failures.length ? { failures } : {}) };
}
