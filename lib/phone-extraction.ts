const digits: Record<string, string> = {
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
  பூஜ்யம்: '0',
  பூஜ்ஜியம்: '0',
  சுழியம்: '0',
  ஜீரோ: '0',
  ஒன்று: '1',
  ஒண்ணு: '1',
  ஒன்னு: '1',
  இரண்டு: '2',
  ரெண்டு: '2',
  மூன்று: '3',
  மூணு: '3',
  நான்கு: '4',
  நாலு: '4',
  ஐந்து: '5',
  அஞ்சு: '5',
  ஆறு: '6',
  ஆரு: '6',
  ஏழு: '7',
  எட்டு: '8',
  ஒன்பது: '9',
  ஒம்பது: '9',
};
const repeats: Record<string, number> = {
  double: 2,
  triple: 3,
  டபுள்: 2,
  டபிள்: 2,
  ட்ரிபிள்: 3,
  டிரிபிள்: 3,
  இரட்டை: 2,
};
// Only contiguous digit groups qualify. Never gather unrelated dates/counts
// throughout a conversation or guess a partial/ambiguous mobile number.
function digitRuns(transcript: string): string[] {
  const text = transcript
    .normalize('NFC')
    .toLowerCase()
    .replace(/[௦-௯]/g, (c) => String(c.charCodeAt(0) - 0x0be6));
  const tokens = text.match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  const found = new Set<string>();
  let run = '';
  let repeat = 1;
  const flush = () => {
    let number = run;
    if (number.length === 12 && number.startsWith('91'))
      number = number.slice(2);
    if (number.length >= 6 && number.length <= 20) found.add(number);
    run = '';
    repeat = 1;
  };
  for (const token of tokens) {
    if (repeats[token]) {
      repeat = repeats[token];
      continue;
    }
    const value = digits[token] ?? (/^\d+$/.test(token) ? token : undefined);
    if (value === undefined) {
      flush();
      continue;
    }
    run += value.repeat(repeat);
    repeat = 1;
  }
  flush();
  return [...found];
}
export function reliablePhone(transcript: string, modelPhone: string) {
  const candidates = phoneCandidates(transcript);
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1)
    return candidates.includes(modelPhone) ? modelPhone : '';
  return modelPhone;
}

export function phoneCandidates(transcript: string): string[] {
  return digitRuns(transcript).filter(number => /^[6-9]\d{9}$/.test(number));
}
// Review candidates retain missing/extra digits. Never truncate or pad a number.
// Contiguous groups are kept separate, so dates/counts cannot be merged into a phone.
export function reviewPhone(transcript: string, modelPhone: string) {
  const candidates = digitRuns(transcript);
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) return candidates.includes(modelPhone) ? modelPhone : '';
  return modelPhone;
}
