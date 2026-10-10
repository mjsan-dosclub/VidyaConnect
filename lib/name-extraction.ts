// Conservative fallback for explicit self-identification anywhere in the transcript.
// Never infer a visitor name from people mentioned in feedback.
export function statedNames(transcript: string): string[] {
  const marker = /(?:\bmy name is\b|\bmyself\b|என்\s+பெயர்|எனது\s+பெயர்|என்னுடைய\s+பெயர்|என்\s+பேரு|என்னோட\s+பேரு)\s*[:–-]?\s*/giu;
  const names = new Set<string>();
  for (const match of transcript.normalize('NFC').matchAll(marker)) {
    const rest = transcript.normalize('NFC').slice(match.index! + match[0].length);
    const candidate = rest.split(/[,.!?;\n]|\b(?:from|and|my|phone|mobile|number|at|I am|I work|I represent)\b|(?:என்|எனது|என்னுடைய)\s+(?:எண்|மொபைல்|நம்பர்|நிறுவனம்|பள்ளி|கல்லூரி)|(?:நான்|எனக்கு|எங்கள்|எங்க|எனது நிறுவனம்|என் நிறுவனம்)/iu)[0]
      .trim().replace(/[“”"'’]+$/u, '').replace(/\s+/g, ' ');
    const words = candidate.split(' ');
    if (/^(?:add|please|improve|ignore|show|return|include)\b/iu.test(candidate)) continue;
    if (candidate.length >= 2 && candidate.length <= 120 && words.length <= 5 && /^[\p{L}\p{M}][\p{L}\p{M}\s'’–-]*$/u.test(candidate)) names.add(candidate);
  }
  return [...names];
}
export function recoverName(transcript: string, modelName: string) {
  if (modelName.trim()) return modelName;
  const names = statedNames(transcript);
  return names.length === 1 ? names[0] : '';
}
