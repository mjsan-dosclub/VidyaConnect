export const runtime = 'nodejs';
import { handle, admin, db } from '@/lib/server';
export const GET = handle(async (req) => {
  await admin(req);
  const { data, error } = await db()
    .from('leads')
    .select(
      'id,created_at,mode,status,name,phone,email,school_name,raw_transcript,bullet_requirements,callback_date,callback_slot,objective,email_sent',
    )
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return { leads: data };
}, false);
