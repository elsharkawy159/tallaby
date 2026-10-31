/**
 * Public-address check for server-side fetches of URLs chosen by others (CIMD
 * documents now, product image imports in F-29f). Pure; rejects loopback,
 * private, link-local, CGNAT, multicast, reserved and documentation ranges.
 */
import { isIP } from "node:net";

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = value * 256 + n;
  }
  return value;
}

const V4_BLOCKED: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isPublicIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return false;
  return !V4_BLOCKED.some(([base, bits]) => {
    const baseValue = ipv4ToInt(base)!;
    const size = 2 ** (32 - bits);
    return value >= baseValue && value < baseValue + size;
  });
}

function expandIpv6(ip: string): number[] | null {
  let address = ip.toLowerCase();
  const zone = address.indexOf("%");
  if (zone !== -1) return null; // zone ids only exist on link-local
  // Embedded IPv4 tail (::ffff:1.2.3.4).
  const v4Match = address.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4Match) {
    const v4 = ipv4ToInt(v4Match[1]!);
    if (v4 === null) return null;
    address = address.slice(0, -v4Match[1]!.length) + `${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 && missing !== 0) return null;
  if (missing < 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  const values = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return values.some(Number.isNaN) ? null : values;
}

function isPublicIpv6(ip: string): boolean {
  const g = expandIpv6(ip);
  if (!g) return false;
  const first = g[0]!;
  if (g.every((v) => v === 0)) return false; // ::
  if (g.slice(0, 7).every((v) => v === 0) && g[7] === 1) return false; // ::1
  // IPv4-mapped / translated: judge the embedded IPv4 address.
  const isMapped = g.slice(0, 5).every((v) => v === 0) && g[5] === 0xffff;
  const isNat64 = first === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((v) => v === 0);
  if (isMapped || isNat64) {
    return isPublicIpv4(`${g[6]! >> 8}.${g[6]! & 0xff}.${g[7]! >> 8}.${g[7]! & 0xff}`);
  }
  if ((first & 0xfe00) === 0xfc00) return false; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return false; // fe80::/10 link-local
  if ((first & 0xffc0) === 0xfec0) return false; // fec0::/10 site-local (old)
  if ((first & 0xff00) === 0xff00) return false; // multicast
  if (first === 0x2001 && g[1] === 0x0db8) return false; // documentation
  if (first === 0x0100 && g.slice(1, 4).every((v) => v === 0)) return false; // discard-only
  // Global unicast is 2000::/3; everything else is reserved.
  return (first & 0xe000) === 0x2000;
}

export function isPublicIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isPublicIpv4(ip);
  if (family === 6) return isPublicIpv6(ip);
  return false;
}
