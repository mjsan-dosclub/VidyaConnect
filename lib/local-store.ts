import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
export function localMode() {
  return (
    (process.env.LOCAL_PREVIEW_MODE ?? process.env.KARYAAI_LOCAL_MODE) ===
      'true' && !process.env.VERCEL
  );
}
let connection: DatabaseSync | undefined;
function sqlite() {
  if (!localMode()) throw new Error('Local mode is disabled');
  if (connection) return connection;
  const dir = join(process.cwd(), '.local');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, 'karyaai.sqlite');
  connection = new DatabaseSync(file);
  chmodSync(file, 0o600);
  connection.exec(
    `PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,owner_hash TEXT NOT NULL,record TEXT NOT NULL); CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,window INTEGER NOT NULL,hits INTEGER NOT NULL);`,
  );
  return connection;
}
type LocalLead = {
  id: string;
  owner_hash: string;
  mode: 'voice' | 'manual';
  status: string;
  created_at: string;
  raw_transcript?: string;
  name?: string;
  phone?: string;
  school_name?: string | null;
  bullet_requirements?: string[];
  objective?: string;
  email?: string;
  callback_date?: string;
  callback_slot?: string;
  email_sent: boolean;
};
export function localOwned(id: string, ownerHash: string): LocalLead {
  const row = sqlite()
    .prepare('SELECT record FROM leads WHERE id=? AND owner_hash=?')
    .get(id, ownerHash) as { record: string } | undefined;
  if (!row) throw new Error('Lead not found or access denied');
  return JSON.parse(row.record);
}
export function localDraft(
  id: string,
  ownerHash: string,
  mode: 'voice' | 'manual',
  transcript?: string,
) {
  const database = sqlite();
  const record: LocalLead = {
    id,
    owner_hash: ownerHash,
    mode,
    status: 'draft',
    created_at: new Date().toISOString(),
    email_sent: false,
    ...(transcript ? { raw_transcript: transcript } : {}),
  };
  database
    .prepare(
      'INSERT INTO leads(id,owner_hash,record) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',
    )
    .run(id, ownerHash, JSON.stringify(record));
  const lead = localOwned(id, ownerHash);
  if (lead.mode !== mode) throw new Error('Lead mode mismatch');
  if (lead.status !== 'draft') {
    if (mode === 'manual') return;
    throw new Error('Already finalized');
  }
  if (transcript !== undefined)
    localUpdate(id, ownerHash, { raw_transcript: transcript });
}
export function localUpdate(
  id: string,
  ownerHash: string,
  patch: Partial<LocalLead>,
) {
  const database = sqlite();
  database.exec('BEGIN IMMEDIATE');
  try {
    const lead = localOwned(id, ownerHash);
    if (lead.status === 'draft')
      database
        .prepare('UPDATE leads SET record=? WHERE id=? AND owner_hash=?')
        .run(JSON.stringify({ ...lead, ...patch }), id, ownerHash);
    database.exec('COMMIT');
  } catch (e) {
    database.exec('ROLLBACK');
    throw e;
  }
}
export function localRateLimit(key: string) {
  const database = sqlite(),
    now = Date.now();
  const row = database
    .prepare(
      `INSERT INTO limits(key,window,hits) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN window<? THEN 1 ELSE hits+1 END,window=CASE WHEN window<? THEN excluded.window ELSE window END RETURNING hits`,
    )
    .get(key, now, now - 60000, now - 60000) as { hits: number };
  database.prepare('DELETE FROM limits WHERE window<?').run(now - 86400000);
  return row.hits <= 30;
}
