import type { SkillId } from "./types";

/**
 * Picks the skill in code (spec §14.2.1 and §14.2.4): the page first, then
 * Arabic and English keywords. Returns null when it can't tell (no match, or
 * keywords of two skills tie); a tiny model router comes later.
 */

/** Dashboard path patterns → skill. `[id]` matches one path segment. Most specific first. */
const PAGE_SKILLS: Array<[pattern: string, skill: SkillId]> = [
  ["/stores/[id]/shipping", "shipping"],
  ["/stores/[id]/editor", "design"],
  ["/stores/[id]/website/design", "design"],
  ["/stores/[id]/templates", "design"],
  ["/stores/[id]/website/social", "settings"],
  ["/stores/[id]/website/domain", "settings"],
  ["/stores/[id]/settings", "settings"],
  ["/settings", "settings"],
  ["/products", "products"],
];

const KEYWORDS: Record<SkillId, string[]> = {
  products: [
    "product", "products", "price", "prices", "stock", "sku", "listing", "title", "publish product", "hide product", "draft",
    "منتج", "منتجات", "المنتج", "المنتجات", "سعر", "اسعار", "أسعار", "مخزون", "مخزن", "كمية", "وصف", "تيشيرت", "تيشيرتات",
  ],
  shipping: [
    "shipping", "delivery", "deliver", "zone", "zones", "courier", "governorate", "governorates", "cairo", "giza", "free shipping",
    "شحن", "الشحن", "توصيل", "التوصيل", "منطقة", "مناطق", "محافظة", "محافظات", "القاهرة", "الجيزة", "مندوب",
  ],
  design: [
    "design", "colour", "color", "colours", "colors", "font", "fonts", "theme", "look", "palette", "brand colour", "brand color",
    "تصميم", "لون", "الوان", "ألوان", "اللون", "خط", "خطوط", "الخط", "شكل", "ثيم",
  ],
  settings: [
    "contact", "phone", "whatsapp", "email", "instagram", "facebook", "tiktok", "social", "seo", "google", "return policy", "returns", "policy",
    "تواصل", "رقم", "تليفون", "هاتف", "واتساب", "واتس", "ايميل", "إيميل", "انستجرام", "فيسبوك", "تيك توك", "سوشيال", "سياسة", "استرجاع", "الاسترجاع", "استبدال",
  ],
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // harakat, tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function pathMatches(pattern: string, path: string): boolean {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split(/[?#]/)[0]!.split("/").filter(Boolean);
  // Locale prefix (/ar/..., /en/...) is ignored.
  if (s[0] === "ar" || s[0] === "en") s.shift();
  if (s.length < p.length) return false;
  return p.every((part, i) => part === "[id]" || part === s[i]);
}

export function skillForPage(pagePath: string | null | undefined): SkillId | null {
  if (!pagePath) return null;
  for (const [pattern, skill] of PAGE_SKILLS) if (pathMatches(pattern, pagePath)) return skill;
  return null;
}

const NORMALIZED_KEYWORDS = Object.fromEntries(
  Object.entries(KEYWORDS).map(([skill, words]) => [skill, [...new Set(words.map(normalize))]]),
) as Record<SkillId, string[]>;

/** Arabic clitics written onto a word: و (and), ب/ل/ف, ال (the), in that order. */
const ARABIC_PREFIX = /^(و|ف)?(ب|ل|ك)?(ال|ل)?/;

const wordForms = (token: string) => {
  const stripped = token.replace(ARABIC_PREFIX, "");
  return stripped.length >= 2 && stripped !== token ? [token, stripped, `ال${stripped}`] : [token];
};

export function skillForMessage(message: string | null | undefined): SkillId | null {
  const text = ` ${normalize(message ?? "").slice(0, 2000)} `;
  if (!text.trim()) return null;
  const words = new Set(text.trim().split(" ").flatMap(wordForms));
  const scores = (Object.keys(NORMALIZED_KEYWORDS) as SkillId[])
    .map((skill) => ({
      skill,
      score: NORMALIZED_KEYWORDS[skill].filter((word) => (word.includes(" ") ? text.includes(` ${word} `) : words.has(word))).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scores.length === 0) return null;
  if (scores.length > 1 && scores[0]!.score === scores[1]!.score) return null;
  return scores[0]!.skill;
}

/** The page decides when it has a skill; otherwise the message's keywords; null when unsure. */
export function pickSkill(pagePath: string | null | undefined, message: string | null | undefined): SkillId | null {
  return skillForPage(pagePath) ?? skillForMessage(message);
}
