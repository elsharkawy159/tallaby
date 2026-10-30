/**
 * Code 128 (code set B) barcode as bar positions, for an inline SVG (ROADMAP.md
 * F-04e: the order number on invoices and packing slips). No dependency and no
 * external service: the printout draws plain <rect>s. Code set B covers ASCII
 * 32–126, which is everything an order number (`ORD` + 8 of A–Z/0–9) uses.
 */

/** Bar/space widths (in modules) of every Code 128 symbol, by value; 106 is STOP. */
export const CODE128_PATTERNS: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const START_B = 104;
const STOP = 106;
/** Blank modules on each side, so a scanner finds where the code starts. */
export const CODE128_QUIET_ZONE = 10;

/** Symbol values for `text` in code set B: start, data, checksum, stop. Null for a character outside ASCII 32–126. */
export function code128Values(text: string): number[] | null {
  const data: number[] = [];
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (char.length !== 1 || code < 32 || code > 126) return null;
    data.push(code - 32);
  }
  if (data.length === 0) return null;
  const checksum = data.reduce((sum, value, i) => sum + value * (i + 1), START_B) % 103;
  return [START_B, ...data, checksum, STOP];
}

export type Code128Bars = {
  /** Total width in modules, quiet zones included. */
  width: number;
  /** Each bar's left edge and width, in modules. */
  bars: { x: number; w: number }[];
};

/** The bars to draw for `text`, or null when it cannot be encoded. */
export function code128Bars(text: string): Code128Bars | null {
  const values = code128Values(text);
  if (!values) return null;
  const bars: { x: number; w: number }[] = [];
  let x = CODE128_QUIET_ZONE;
  for (const value of values) {
    const pattern = CODE128_PATTERNS[value]!;
    for (let i = 0; i < pattern.length; i++) {
      const w = Number(pattern[i]);
      // Even positions are bars, odd ones spaces.
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    }
  }
  return { width: x + CODE128_QUIET_ZONE, bars };
}
