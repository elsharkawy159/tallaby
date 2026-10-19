/** Header navigation. `key` is the `nav.*` message and the page id for aria-current. */
export const NAV_ITEMS = [
  { key: "howItWorks", href: "/#how" },
  { key: "templates", href: "/templates" },
  { key: "pricing", href: "/pricing" },
  { key: "blog", href: "/blog" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

/** Which nav item a pathname (without locale prefix) belongs to. */
export function activeNavKey(pathname: string): NavKey | null {
  const match = NAV_ITEMS.find((item) => item.href !== "/#how" && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
  return match?.key ?? null;
}
