export const maxDuration = 60;
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { sendPending } from '@/lib/email';
export async function GET(req: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await sendPending());
  } catch {
    return NextResponse.json({ error: 'Email retry failed' }, { status: 503 });
  }
}
