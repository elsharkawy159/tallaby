/**
 * Social media platforms a store can link to (PLAN.md §8.8, P4-15). Adapted
 * from the reference `components/sections/_chrome/social-options.ts`.
 *
 * Each platform accepts a URL on its own domains, or a handle / phone number
 * where that is how people share it, and `normalizeSocialLink` turns the input
 * into one canonical https URL (WhatsApp → `https://wa.me/<digits>`, or
 * `https://wa.me/@<username>` for a WhatsApp username). Anything
 * on another domain, another scheme, or with credentials/ports is refused, so
 * a stored link can never point somewhere else. No React here: the dashboard,
 * @workspace/lib and the storefront all use it.
 *
 * Icon paths (24×24) are from Simple Icons (CC0); LinkedIn's is the last
 * Simple Icons version before it was removed there.
 */

export const SOCIAL_PLATFORM_KEYS = [
  "facebook",
  "instagram",
  "tiktok",
  "whatsapp",
  "x",
  "youtube",
  "snapchat",
  "telegram",
  "linkedin",
  "pinterest",
  "threads",
] as const;
export type SocialPlatformKey = (typeof SOCIAL_PLATFORM_KEYS)[number];

export type SocialInputType = "url" | "handle" | "phone";

export type SocialPlatform = {
  key: SocialPlatformKey;
  label: { ar: string; en: string };
  /** What the seller may type besides a full URL. */
  input: SocialInputType;
  /** Allowed hosts (subdomains included). */
  domains: readonly string[];
  /** Handle pattern (without a leading @) for `handle` inputs and WhatsApp usernames. */
  handle?: RegExp;
  /** URL for a bare handle. */
  fromHandle?: (handle: string) => string;
  placeholder: string;
  color: string;
  icon: string;
};

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    key: "facebook",
    label: { ar: "فيسبوك", en: "Facebook" },
    input: "handle",
    domains: ["facebook.com", "fb.com", "fb.me"],
    handle: /^[A-Za-z0-9.]{3,50}$/,
    fromHandle: (h) => `https://www.facebook.com/${h}`,
    placeholder: "facebook.com/yourstore",
    color: "#0866FF",
    icon: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  {
    key: "instagram",
    label: { ar: "إنستجرام", en: "Instagram" },
    input: "handle",
    domains: ["instagram.com", "instagr.am"],
    handle: /^[A-Za-z0-9._]{1,30}$/,
    fromHandle: (h) => `https://www.instagram.com/${h}`,
    placeholder: "@yourstore",
    color: "#FF0069",
    icon: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  },
  {
    key: "tiktok",
    label: { ar: "تيك توك", en: "TikTok" },
    input: "handle",
    domains: ["tiktok.com"],
    handle: /^[A-Za-z0-9._]{2,24}$/,
    fromHandle: (h) => `https://www.tiktok.com/@${h}`,
    placeholder: "@yourstore",
    color: "#000000",
    icon: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    key: "whatsapp",
    label: { ar: "واتساب", en: "WhatsApp" },
    input: "phone",
    domains: ["wa.me", "whatsapp.com"],
    // WhatsApp usernames: at least one letter, so a mistyped number is not taken for one.
    handle: /^(?=.*[A-Za-z])[A-Za-z0-9._]{3,35}$/,
    fromHandle: (h) => `https://wa.me/@${h}`,
    placeholder: "01xxxxxxxxx / @yourstore",
    color: "#25D366",
    icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  },
  {
    key: "x",
    label: { ar: "إكس (تويتر)", en: "X (Twitter)" },
    input: "handle",
    domains: ["x.com", "twitter.com"],
    handle: /^[A-Za-z0-9_]{1,15}$/,
    fromHandle: (h) => `https://x.com/${h}`,
    placeholder: "@yourstore",
    color: "#000000",
    icon: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  },
  {
    key: "youtube",
    label: { ar: "يوتيوب", en: "YouTube" },
    input: "handle",
    domains: ["youtube.com", "youtu.be"],
    handle: /^[A-Za-z0-9._-]{3,30}$/,
    fromHandle: (h) => `https://www.youtube.com/@${h}`,
    placeholder: "@yourstore",
    color: "#FF0000",
    icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    key: "snapchat",
    label: { ar: "سناب شات", en: "Snapchat" },
    input: "handle",
    domains: ["snapchat.com"],
    handle: /^[A-Za-z][A-Za-z0-9._-]{2,14}$/,
    fromHandle: (h) => `https://www.snapchat.com/add/${h}`,
    placeholder: "@yourstore",
    color: "#FFFC00",
    icon: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z",
  },
  {
    key: "telegram",
    label: { ar: "تيليجرام", en: "Telegram" },
    input: "handle",
    domains: ["t.me", "telegram.me"],
    handle: /^[A-Za-z0-9_]{5,32}$/,
    fromHandle: (h) => `https://t.me/${h}`,
    placeholder: "@yourstore",
    color: "#26A5E4",
    icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  },
  {
    key: "linkedin",
    label: { ar: "لينكد إن", en: "LinkedIn" },
    input: "url",
    domains: ["linkedin.com"],
    placeholder: "linkedin.com/company/yourstore",
    color: "#0A66C2",
    icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    key: "pinterest",
    label: { ar: "بنترست", en: "Pinterest" },
    input: "handle",
    domains: ["pinterest.com", "pin.it"],
    handle: /^[A-Za-z0-9_]{3,30}$/,
    fromHandle: (h) => `https://www.pinterest.com/${h}`,
    placeholder: "@yourstore",
    color: "#BD081C",
    icon: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z",
  },
  {
    key: "threads",
    label: { ar: "ثريدز", en: "Threads" },
    input: "handle",
    domains: ["threads.net", "threads.com"],
    handle: /^[A-Za-z0-9._]{1,30}$/,
    fromHandle: (h) => `https://www.threads.net/@${h}`,
    placeholder: "@yourstore",
    color: "#000000",
    icon: "M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z",
  },
];

const BY_KEY = new Map<string, SocialPlatform>(SOCIAL_PLATFORMS.map((p) => [p.key, p]));

export function getSocialPlatform(key: string): SocialPlatform | undefined {
  return BY_KEY.get(key);
}

export const SOCIAL_VALUE_MAX = 300;

// Invisible direction / zero-width marks that phones add when a number is pasted.
const INVISIBLE_MARKS = /[​-‏‪-‮⁦-⁩﻿]/g;

/** Arabic-Indic (٠١٢) and Persian (۰۱۲) digits → 0-9, invisible marks removed. */
export function toLatinDigits(input: string): string {
  return input
    .replace(INVISIBLE_MARKS, "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * A phone number as country code + digits (wa.me's form), Egypt first: our
 * sellers type `01xxxxxxxxx`, `1xxxxxxxxx`, `201xxxxxxxxx`, `+20 1xx…`,
 * `00201…` or `2001…`, in Latin or Arabic digits, and all become
 * `201xxxxxxxxx`. Egyptian landlines (`02xxxxxxxx`) get `20` too. Any other
 * number with its country code (8–15 digits) is kept. Null when it is not a
 * plausible number.
 */
export function phoneDigits(input: string): string | null {
  const value = toLatinDigits(input).trim();
  if (!/^[+()\d\s.-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Egyptian mobile, local or with the country code (and a stray trunk zero).
  const mobile = /^(?:20)?0?(1[0125]\d{8})$/.exec(digits);
  if (mobile) return `20${mobile[1]}`;
  // Egyptian landline written locally: 0 + area code + number.
  if (/^0[2-9]\d{7,8}$/.test(digits)) return `20${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

/** WhatsApp takes the same numbers (kept for existing callers). */
export const whatsappDigits = phoneDigits;

/**
 * How a contact number is saved and shown: Egyptian numbers in the local form
 * people read (`01xxxxxxxxx`), others as `+<country code><number>`. Null when
 * it is not a plausible number.
 */
export function formatPhone(input: string): string | null {
  const digits = phoneDigits(input);
  if (!digits) return null;
  return digits.startsWith("20") ? `0${digits.slice(2)}` : `+${digits}`;
}

function onDomain(host: string, domains: readonly string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

function parseUrl(input: string): URL | null {
  const raw = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * The canonical https URL for what the seller typed, or null when it is not a
 * valid link for this platform.
 */
export function normalizeSocialLink(platformKey: string, value: string): string | null {
  const platform = getSocialPlatform(platformKey);
  const input = typeof value === "string" ? value.trim() : "";
  if (!platform || !input || input.length > SOCIAL_VALUE_MAX) return null;

  if (platform.input === "phone") {
    const digits = whatsappDigits(input);
    if (digits) return `https://wa.me/${digits}`;
  }
  // Phone numbers may contain spaces; handles and URLs may not.
  if (/\s/.test(input)) return null;

  if (platform.handle && platform.fromHandle) {
    const handle = input.replace(/^@/, "");
    if (!input.includes("/") && !input.includes(":") && platform.handle.test(handle)) {
      return platform.fromHandle(handle);
    }
  }

  // Otherwise it must be a URL on one of the platform's domains.
  if (!/[./]/.test(input)) return null;
  const url = parseUrl(input);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return null;
  if (url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!onDomain(host, platform.domains)) return null;
  const path = url.pathname.replace(/\/+$/, "");

  if (platform.key === "whatsapp") {
    // wa.me/@<username>, wa.me/<digits>, or api.whatsapp.com/send?phone=<digits>.
    const username = host === "wa.me" ? /^\/@([^/]+)$/.exec(path)?.[1] : undefined;
    if (username) return platform.handle!.test(username) ? platform.fromHandle!(username) : null;
    const digits = host === "wa.me" ? whatsappDigits(path.slice(1)) : whatsappDigits(url.searchParams.get("phone") ?? "");
    return digits ? `https://wa.me/${digits}` : null;
  }
  if (!path || path === "/") return null;
  const search = url.search.length > 1 ? url.search : "";
  const normalized = `https://${host}${path}${search}`;
  return normalized.length <= SOCIAL_VALUE_MAX ? normalized : null;
}
