import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { sameOrigin } from './security';
import { localMode, localOwned, localRateLimit } from './local-store';
export function db() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw new Error(
      'Service is not configured. Please contact the booth team.',
    );
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export async function owned(id: string, token: string) {
  if (localMode()) return localOwned(id, hash(token));
  const { data, error } = await db()
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('owner_hash', hash(token))
    .single();
  if (error || !data) throw new Error('Lead not found or access denied');
  return data;
}
export async function admin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) throw new Error('Unauthorized');
  const { data, error } = await db().auth.getUser(token);
  if (error || data.user?.app_metadata.role !== 'admin')
    throw new Error('Unauthorized');
}
export async function limited(req: NextRequest) {
  if (localMode()) {
    if (!localRateLimit(hash(req.headers.get('x-forwarded-for') ?? 'local')))
      throw new Error('Too many requests. Please wait a minute.');
    return;
  }
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt)
    throw new Error(
      'Service is not configured. Please contact the booth team.',
    );
  const key = hash(
    salt +
      (
        req.headers.get('x-vercel-forwarded-for') ??
        req.headers.get('x-forwarded-for') ??
        'local'
      ).split(',')[0],
  );
  const { data, error } = await db().rpc('consume_rate_limit', { p_key: key });
  if (error) throw new Error('Please try again shortly');
  if (!data) throw new Error('Too many requests. Please wait a minute.');
}
export function handle(
  fn: (req: NextRequest) => Promise<unknown>,
  rate = true,
) {
  return async (req: NextRequest) => {
    try {
      if (
        req.method === 'POST' &&
        !sameOrigin(req.headers.get('origin'), req.headers.get('host'))
      )
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      if (
        Number(req.headers.get('content-length') ?? 0) > 20000 ||
        (req.method === 'POST' &&
          new TextEncoder().encode(await req.clone().text()).length > 20000)
      )
        return NextResponse.json(
          { error: 'Request too large' },
          { status: 413 },
        );
      if (rate) await limited(req);
      return NextResponse.json(await fn(req));
    } catch (e) {
      const msg =
        e instanceof ZodError
          ? e.issues[0]?.message
          : e instanceof Error
            ? e.message
            : 'Unexpected error';
      const status =
        msg === 'Unauthorized'
          ? 401
          : msg === 'Lead not found or access denied'
            ? 404
            : msg?.startsWith('Too many')
              ? 429
              : e instanceof ZodError
                ? 400
                : 503;
      return NextResponse.json(
        {
          error:
            msg === 'Unauthorized' ||
            status === 404 ||
            status === 429 ||
            e instanceof ZodError ||
            msg?.includes('not configured')
              ? msg
              : 'Unable to complete this request. Please try again.',
        },
        { status },
      );
    }
  };
}
