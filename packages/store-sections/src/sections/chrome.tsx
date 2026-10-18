import { z } from "zod";
import { sectionText, type SectionCopyKey } from "../core/copy";
import type { SectionDefinition } from "../core/types";
import { SocialIcon } from "../social/icon";
import { getSocialPlatform } from "../social/platforms";
import { SectionImage, SmartLink, cn, text } from "./_primitives";

const POLICY_COPY: Record<"return" | "shipping" | "privacy" | "terms", SectionCopyKey> = {
  return: "policyReturn",
  shipping: "policyShipping",
  privacy: "policyPrivacy",
  terms: "policyTerms",
};

// ---------------------------------------------------------------------------
// store-header
// ---------------------------------------------------------------------------

const headerSchema = z.object({
  showLogo: z.boolean().catch(true),
  showName: z.boolean().catch(true),
  showNav: z.boolean().catch(true),
  announcement: text(160),
});
type HeaderProps = z.infer<typeof headerSchema>;

export const storeHeader: SectionDefinition<HeaderProps> = {
  id: "store-header",
  version: 1,
  category: "header",
  chrome: "header",
  displayName: { ar: "رأس الموقع", en: "Header" },
  description: { ar: "الشعار والقائمة والسلة.", en: "Logo, menu and cart." },
  propsSchema: headerSchema,
  defaultProps: { showLogo: true, showName: true, showNav: true, announcement: "" },
  propDefinitions: [
    { key: "announcement", label: { ar: "شريط إعلان", en: "Announcement bar" }, type: "text", maxLength: 160, translatable: true },
    { key: "showLogo", label: { ar: "إظهار الشعار", en: "Show logo" }, type: "switch" },
    { key: "showName", label: { ar: "إظهار اسم المتجر", en: "Show store name" }, type: "switch" },
    { key: "showNav", label: { ar: "إظهار الصفحات", en: "Show pages" }, type: "switch" },
  ],
  Component: ({ props, ctx }) => {
    const nav = ctx.pages.filter((p) => !p.isHome);
    return (
      <header className="sticky top-0 z-40 border-b border-(--sf-line) bg-(--sf-paper)/95 backdrop-blur">
        {props.announcement && (
          <p className="bg-(--sf-brand) px-4 py-2 text-center text-xs font-medium text-(--sf-brand-ink,#fff)">{props.announcement}</p>
        )}
        <div className="mx-auto flex h-16 w-full max-w-(--sf-max-width,1200px) items-center gap-4 px-4 md:px-8">
          <SmartLink ctx={ctx} href="/" className="flex min-w-0 items-center gap-2.5" label={sectionText("home", ctx.locale)}>
            {props.showLogo && ctx.store.logoUrl && (
              <SectionImage ctx={ctx} src={ctx.store.logoUrl} alt="" className="size-10 rounded-full border border-(--sf-line)" eager />
            )}
            {props.showName && <span className="truncate text-lg font-bold">{ctx.store.name}</span>}
          </SmartLink>
          {props.showNav && nav.length > 0 && (
            <nav aria-label={sectionText("menu", ctx.locale)} className="hidden flex-1 md:block">
              <ul className="flex flex-wrap gap-5 text-sm font-medium">
                {nav.map((page) => (
                  <li key={page.href}>
                    <SmartLink ctx={ctx} href={page.href} className="text-(--sf-muted) hover:text-(--sf-ink)">
                      {page.name}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="ms-auto flex items-center gap-2">{ctx.renderCartButton?.()}</div>
        </div>
        {props.showNav && nav.length > 0 && (
          <nav aria-label={sectionText("menu", ctx.locale)} className="border-t border-(--sf-line) md:hidden">
            <ul className="flex gap-4 overflow-x-auto px-4 py-2 text-sm">
              {nav.map((page) => (
                <li key={page.href} className="shrink-0">
                  <SmartLink ctx={ctx} href={page.href} className="text-(--sf-muted)">
                    {page.name}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    );
  },
};

// ---------------------------------------------------------------------------
// store-footer
// ---------------------------------------------------------------------------

const footerSchema = z.object({
  about: text(400),
  showPolicies: z.boolean().catch(true),
  showSocial: z.boolean().catch(true),
  showContact: z.boolean().catch(true),
});
type FooterProps = z.infer<typeof footerSchema>;

export const storeFooter: SectionDefinition<FooterProps> = {
  id: "store-footer",
  version: 1,
  category: "footer",
  chrome: "footer",
  displayName: { ar: "تذييل الموقع", en: "Footer" },
  description: { ar: "نبذة والسياسات والتواصل والروابط الاجتماعية.", en: "About, policies, contact and social links." },
  propsSchema: footerSchema,
  defaultProps: { about: "", showPolicies: true, showSocial: true, showContact: true },
  propDefinitions: [
    { key: "about", label: { ar: "نبذة", en: "About" }, type: "textarea", maxLength: 400, translatable: true },
    { key: "showPolicies", label: { ar: "إظهار السياسات", en: "Show policies" }, type: "switch" },
    { key: "showSocial", label: { ar: "إظهار الروابط الاجتماعية", en: "Show social links" }, type: "switch" },
    { key: "showContact", label: { ar: "إظهار التواصل", en: "Show contact" }, type: "switch" },
  ],
  Component: ({ props, ctx }) => {
    const policies = props.showPolicies ? (ctx.store.policies ?? []) : [];
    const social = props.showSocial ? (ctx.store.social ?? []) : [];
    const contact = props.showContact ? ctx.store.contact : undefined;
    return (
      <footer className="mt-auto border-t border-(--sf-line) bg-(--sf-shelf)">
        <div className="mx-auto grid w-full max-w-(--sf-max-width,1200px) gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
          <div className="space-y-2">
            <p className="text-lg font-bold">{ctx.store.name}</p>
            {(props.about || ctx.store.description) && (
              <p className="text-pretty text-sm leading-relaxed text-(--sf-muted)">{props.about || ctx.store.description}</p>
            )}
          </div>
          {policies.length > 0 && (
            <nav aria-label={sectionText("policies", ctx.locale)}>
              <p className="mb-2 text-sm font-semibold">{sectionText("policies", ctx.locale)}</p>
              <ul className="space-y-1.5 text-sm">
                {policies.map((policy) => (
                  <li key={policy.key}>
                    <SmartLink ctx={ctx} href={policy.href} className="text-(--sf-muted) hover:text-(--sf-ink)">
                      {sectionText(POLICY_COPY[policy.key], ctx.locale)}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="space-y-3">
            {contact && (contact.phone || contact.email) && (
              <div>
                <p className="mb-2 text-sm font-semibold">{sectionText("contactUs", ctx.locale)}</p>
                <ul className="space-y-1 text-sm text-(--sf-muted)">
                  {contact.phone && (
                    <li>
                      <SmartLink ctx={ctx} href={`tel:${contact.phone}`}>
                        <span dir="ltr">{contact.phone}</span>
                      </SmartLink>
                    </li>
                  )}
                  {contact.email && (
                    <li className="[overflow-wrap:anywhere]">
                      <SmartLink ctx={ctx} href={`mailto:${contact.email}`}>{contact.email}</SmartLink>
                    </li>
                  )}
                </ul>
              </div>
            )}
            {social.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">{sectionText("followUs", ctx.locale)}</p>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {social.map((link) => {
                    const platform = getSocialPlatform(link.platform);
                    return (
                      <li key={link.url}>
                        <SmartLink
                          ctx={ctx}
                          href={link.url}
                          label={platform ? platform.label[ctx.locale] : link.platform}
                          className={cn(
                            "grid size-9 place-items-center rounded-full border border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) hover:text-(--sf-brand)",
                          )}
                        >
                          <SocialIcon platform={link.platform} className="size-4" />
                        </SmartLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
        <p className="border-t border-(--sf-line) px-4 py-4 text-center text-xs text-(--sf-muted)">
          {sectionText("copyright", ctx.locale, { year: new Date().getFullYear(), store: ctx.store.name })}
        </p>
      </footer>
    );
  },
};
