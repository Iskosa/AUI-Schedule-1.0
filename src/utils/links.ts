export interface NoteToken {
  type: 'text' | 'url';
  value: string;
}

const URL_SPLIT_RE = /(https?:\/\/[^\s;,)<>"]+)/gi;

export function tokenizeNotes(notes: string): NoteToken[] {
  const tokens: NoteToken[] = [];
  let lastIndex = 0;
  for (const match of notes.matchAll(URL_SPLIT_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ type: 'text', value: notes.slice(lastIndex, idx) });
    }
    tokens.push({ type: 'url', value: match[0] });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < notes.length) {
    tokens.push({ type: 'text', value: notes.slice(lastIndex) });
  }
  return tokens;
}

export function extractFirstUrl(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/https?:\/\/[^\s;,)<>"]+/i);
  return match ? match[0] : null;
}

export type NoteSeverity = 'warning' | 'info' | 'none';

export function getNoteSeverity(notes: string | null | undefined): NoteSeverity {
  if (!notes) return 'none';
  const low = notes.toLowerCase();
  if (low.includes('внимание') || low.includes('конфликт') || low.includes('отсутствие очных')) {
    return 'warning';
  }
  if (
    low.includes('единственное очное занятие') ||
    low.includes('web-based') ||
    low.includes('онлайн-курс')
  ) {
    return 'info';
  }
  return 'none';
}
