/**
 * One-way platform switches (ROADMAP.md F-87a, docs/plans/stores-separation.md
 * §2.4). Code for a big data move ships dark and reads its switch; the
 * migration that moves the data turns the switch on as its last statement
 * (0163: `stores_catalog_split`, 0164: `stores_wallet_split`). Rows live in
 * `platform_switches` (0160). Pure: safe to import anywhere.
 */
export const PLATFORM_SWITCHES = ["stores_catalog_split", "stores_wallet_split"] as const;

export type PlatformSwitchKey = (typeof PLATFORM_SWITCHES)[number];

export function isPlatformSwitchKey(value: unknown): value is PlatformSwitchKey {
  return typeof value === "string" && (PLATFORM_SWITCHES as readonly string[]).includes(value);
}

/** Only a stored `true` turns a switch on: a missing row, NULL or any other value is off. */
export function switchEnabled(row: { enabled: unknown } | null | undefined): boolean {
  return row?.enabled === true;
}
