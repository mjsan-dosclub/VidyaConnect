export type LeadSession = {
  id: string;
  token: string;
  transcript?: string;
  language?: 'en' | 'ta';
  local_mode?: boolean;
  manual_review?: boolean;
  name?: string;
  phone?: string;
  school_name?: string | null;
  requirements_summary?: string[];
};
export function getSession(mode: 'voice' | 'manual' = 'voice'): LeadSession {
  const saved = sessionStorage.getItem('originbi-survey-v1-' + mode);
  if (saved) return JSON.parse(saved);
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('');
  const lead = { id: crypto.randomUUID(), token };
  saveSession(lead, mode);
  return lead;
}
export function saveSession(
  p: LeadSession,
  mode: 'voice' | 'manual' = 'voice',
) {
  sessionStorage.setItem('originbi-survey-v1-' + mode, JSON.stringify(p));
}
export async function post(path: string, data: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Please try again');
  return json;
}
export function csvCell(value: unknown) {
  let s =
    typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  if (/^[=+@\-\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
