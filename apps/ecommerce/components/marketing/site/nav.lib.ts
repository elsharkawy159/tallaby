/** Header navigation. "key" is the "nav.*" message and the page id for aria-current. */
export const NAV_ITEMS = [
  { key: "features", href: "/#features" },
  { key: "ai", href: "/#ai" },
  { key: "templates", href: "/templates" },
  { key: "marketing", href: "/#marketing" },
  { key: "pricing", href: "/pricing" },
  { key: "faq", href: "/faq" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

/** Which nav item a pathname (without locale prefix) belongs to. Home page sections are never current. */
export function activeNavKey(pathname: string): NavKey | null {
  const match = NAV_ITEMS.find((item) => !item.href.includes("#") && (pathname === item.href || pathname.startsWith(item.href + "/")));
  return match?.key ?? null;
}
