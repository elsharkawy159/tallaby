/**
 * Website › Domain & SEO › "Get your own domain" (ROADMAP.md F-78): the
 * registrars we suggest to a seller who has no domain yet, and the reasons to
 * use one. Plain outbound links, no affiliate parameters, no prices (they
 * change). `paysInEgp` is set only where the provider's own site showed EGP
 * prices or Egyptian payment methods (checked 2026-11-06; sources in
 * ROADMAP.md §7). Each `note` is a message key under
 * `domainSeo.domain.buy.providers`.
 */

export type DomainProvider = {
  id: string;
  name: string;
  url: string;
  /** Lets an Egyptian seller pay in جنيه (EGP prices, Fawry, InstaPay, Meeza or Vodafone Cash). */
  paysInEgp: boolean;
  /** Logo in `public/domain-logos/`. */
  logo: string;
  /** Popularity / recommendation order within its group; lower first. */
  rank: number;
};

export const DOMAIN_PROVIDERS: readonly DomainProvider[] = [
  { id: "namecheap", name: "Namecheap", url: "https://www.namecheap.com/", paysInEgp: false, logo: "/domain-logos/namecheap.png", rank: 1 },
  { id: "godaddy", name: "GoDaddy", url: "https://www.godaddy.com/", paysInEgp: false, logo: "/domain-logos/godaddy.png", rank: 2 },
  { id: "hostinger", name: "Hostinger", url: "https://www.hostinger.com/eg/domain-name-search", paysInEgp: true, logo: "/domain-logos/hostinger.png", rank: 1 },
  { id: "cloudflare", name: "Cloudflare Registrar", url: "https://www.cloudflare.com/products/registrar/", paysInEgp: false, logo: "/domain-logos/cloudflare.png", rank: 3 },
  { id: "egyhosting", name: "EgyHosting", url: "https://egyhosting.com/", paysInEgp: true, logo: "/domain-logos/egyhosting.png", rank: 2 },
];

/** EGP-paying providers first, then the rest; each group by `rank`. Does not mutate. */
export function sortDomainProviders(list: readonly DomainProvider[]): DomainProvider[] {
  return [...list].sort((a, b) => Number(b.paysInEgp) - Number(a.paysInEgp) || a.rank - b.rank);
}

export const SORTED_DOMAIN_PROVIDERS = sortDomainProviders(DOMAIN_PROVIDERS);

/** Keys under `domainSeo.domain.buy.benefits`, in display order. */
export const DOMAIN_BENEFITS = ["remember", "trust", "brand", "seo", "keep", "email"] as const;
export type DomainBenefit = (typeof DOMAIN_BENEFITS)[number];
