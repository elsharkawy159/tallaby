/**
 * Public and editor renderer (PLAN.md P4-02, P5-01). No hooks and no editor
 * imports, so the storefront renders it as a server component.
 */
import type { PageContent, SectionInstance, SiteLocale } from "../config/schema";
import { resolveSectionForLocale } from "../core/locale";
import { applyMigrations, resolveSectionProps, type SectionRegistry } from "../core/registry";
import { SITE_ROOT_CLASS, designSystemToCss, type ThemeInput } from "../core/theme";
import type { RenderContext } from "../core/types";
import { shellLayout } from "../elements/shell";
import { collectPageCss, escapeStyleBlock, normalizeSectionStyle, type StyleCssMode } from "../elements/style";

export function SectionRenderer({
  instance,
  registry,
  ctx,
  defaultLocale = "ar",
}: {
  instance: SectionInstance;
  registry: SectionRegistry;
  ctx: RenderContext;
  defaultLocale?: SiteLocale;
}) {
  const definition = registry.get(instance.sectionId);
  // Unknown or retired sections are skipped, never an error page.
  if (!definition) return null;
  const migrated = applyMigrations(instance, definition);
  const localizedInstance = resolveSectionForLocale(migrated, ctx.locale, defaultLocale);
  const props = resolveSectionProps(definition, localizedInstance.props);
  const Component = definition.Component;
  const content = <Component instance={localizedInstance} props={props} ctx={ctx} />;
  const shell = shellLayout(normalizeSectionStyle(instance.style).shell, (src) => ctx.imageUrl(src));
  // No shell: the wrapper renders exactly as before the shell existed (P4B-05).
  if (!shell) {
    return (
      <div data-section-id={instance.id} data-section-type={instance.sectionId}>
        {content}
      </div>
    );
  }
  return (
    <div data-section-id={instance.id} data-section-type={instance.sectionId} {...shell.outer}>
      {shell.bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- shared by both apps; no next/image here */}
          <img src={shell.bgImage} alt="" aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full object-cover" loading="lazy" decoding="async" />
          {shell.overlay > 0 && <div aria-hidden className="absolute inset-0 -z-10" style={{ background: `rgb(0 0 0 / ${shell.overlay}%)` }} />}
        </>
      )}
      {shell.inner ? <div style={shell.inner}>{content}</div> : content}
    </div>
  );
}

export function PageRenderer({
  content,
  header,
  footer,
  registry,
  ctx,
  defaultLocale = "ar",
}: {
  content: PageContent;
  header?: SectionInstance | null;
  footer?: SectionInstance | null;
  registry: SectionRegistry;
  ctx: RenderContext;
  defaultLocale?: SiteLocale;
}) {
  return (
    <>
      {header && <SectionRenderer instance={header} registry={registry} ctx={ctx} defaultLocale={defaultLocale} />}
      <main className="flex-1">
        {content.sections.map((instance) => (
          <SectionRenderer key={instance.id} instance={instance} registry={registry} ctx={ctx} defaultLocale={defaultLocale} />
        ))}
      </main>
      {footer && <SectionRenderer instance={footer} registry={registry} ctx={ctx} defaultLocale={defaultLocale} />}
    </>
  );
}

/** Scoped theme tokens for a site root carrying `SITE_ROOT_CLASS`. */
export function SiteTheme({ designSystem }: { designSystem: ThemeInput | null | undefined }) {
  const css = designSystemToCss(designSystem);
  if (!css) return null;
  return <style data-site-theme dangerouslySetInnerHTML={{ __html: css.replace(/</g, "\\3c ") }} />;
}

/**
 * Section, part and element styles of one page (P4B-01), as one scoped block.
 * Render it inside the site root, after `SiteTheme`, with the header and
 * footer included.
 */
export function PageStyles({
  sections,
  mode = "public",
}: {
  sections: readonly (SectionInstance | null | undefined)[];
  mode?: StyleCssMode;
}) {
  const css = collectPageCss(sections, mode);
  if (!css) return null;
  return <style data-page-styles dangerouslySetInnerHTML={{ __html: escapeStyleBlock(css) }} />;
}

export { SITE_ROOT_CLASS };
