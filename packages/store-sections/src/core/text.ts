/**
 * Plain product text (descriptions, bullet points) from imports and copy-paste
 * often carries HTML entities such as `&nbsp;`. It is drawn as text, never as
 * HTML, so the entities are decoded to the characters they stand for. Pure.
 */
const NAMED: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

export function decodeTextEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (match, name: string) => {
    const key = name.toLowerCase();
    if (key in NAMED) return NAMED[key]!;
    const code = key.startsWith("#x") ? Number.parseInt(key.slice(2), 16) : key.startsWith("#") ? Number.parseInt(key.slice(1), 10) : Number.NaN;
    if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
    return code === 0xa0 ? " " : String.fromCodePoint(code);
  });
}
