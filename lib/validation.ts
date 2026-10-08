import { z } from 'zod';
export const phone = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
export const objective = z.enum(['Demo', 'Know More', 'Catch-up Call']);
export const slot = z.enum(['Morning', 'Afternoon', 'Evening']);
export const identity = z.object({
  id: z.uuid(),
  token: z.string().regex(/^[a-f0-9]{64}$/),
});
export const extraction = z.object({
  name: z.string().max(120),
  phone: z.string().regex(/^(?:[6-9]\d{9})?$/),
  school_name: z.string().max(200).nullable(),
  requirements_summary: z.array(z.string().max(400)).max(8),
  detected_objective: objective,
});
export const details = z.object({
  name: z.string().trim().min(2).max(120),
  phone,
  email: z.union([z.email(), z.literal('')]).optional(),
  school_name: z.string().trim().max(200),
  bullet_requirements: z.array(z.string().max(400)).max(8),
  objective,
});
export const manual = identity.extend({
  ...details.shape,
  school_name: z.string().trim().min(2).max(200),
  email: z.email(),
  callback_date: z.iso
    .date()
    .refine(
      (v) =>
        v >=
        new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      'Choose today or a future date',
    ),
  callback_slot: slot,
  consent: z.literal(true),
});
export function normalizeSpokenPhone(input: string) {
  const words: Record<string, string> = {
    zero: '0',
    oh: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
  };
  let s = input
    .toLowerCase()
    .replace(
      /(double|triple)\s+(zero|oh|one|two|three|four|five|six|seven|eight|nine|\d)/g,
      (_, n, d) => (words[d] ?? d).repeat(n === 'double' ? 2 : 3),
    );
  s = s
    .replace(
      /\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g,
      (v) => words[v],
    )
    .replace(/\D/g, '');
  if (s.length === 12 && s.startsWith('91')) s = s.slice(2);
  return s;
}
