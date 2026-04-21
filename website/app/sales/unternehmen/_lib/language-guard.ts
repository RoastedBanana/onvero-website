// ─── LANGUAGE GUARD ─────────────────────────────────────────────────────────
// Detects likely-English text and masks it from display.
// DB fields are mixed DE/EN — this ensures only German text is shown.

const EN_MARKERS = [
  ' the ',
  ' and ',
  ' with ',
  ' for ',
  ' their ',
  ' they ',
  ' this ',
  ' from ',
  ' have ',
  ' would ',
  ' could ',
  ' which ',
  ' that ',
  ' been ',
];
const DE_MARKERS = [
  ' die ',
  ' der ',
  ' das ',
  ' und ',
  ' mit ',
  ' für ',
  ' ist ',
  ' sind ',
  ' auf ',
  ' von ',
  ' werden ',
  ' haben ',
  ' eine ',
  ' wird ',
  ' nicht ',
];

export function isLikelyEnglish(text: string | null | undefined): boolean {
  if (!text || text.length < 30) return false;
  const lower = ' ' + text.toLowerCase() + ' ';
  let enCount = 0;
  let deCount = 0;
  for (const marker of EN_MARKERS) if (lower.includes(marker)) enCount++;
  for (const marker of DE_MARKERS) if (lower.includes(marker)) deCount++;
  return enCount > deCount + 1;
}

export function sanitizeForDisplay(text: string | null | undefined): string | null {
  if (!text) return null;
  if (isLikelyEnglish(text)) return null;
  return text;
}

export function sanitizeArrayForDisplay(arr: string[] | null | undefined): string[] {
  if (!arr) return [];
  return arr.filter((item) => !isLikelyEnglish(item));
}

export const PLACEHOLDER_LANG = 'Wird auf Deutsch nachgeliefert';
export const PLACEHOLDER_EMPTY = 'Noch keine Daten';
