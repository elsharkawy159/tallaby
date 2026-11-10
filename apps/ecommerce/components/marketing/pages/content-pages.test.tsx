import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DetailPageView } from "@/components/marketing/features/detail-page";
import IntegrationsPage from "@/app/[locale]/(marketing)/(site)/integrations/page";
import CompareHub from "@/app/[locale]/(marketing)/(site)/compare/page";
import IndustriesHub from "@/app/[locale]/(marketing)/(site)/industries/page";
import { ComparePageView } from "@/components/marketing/compare/compare-page";
import { AlternativesPageView } from "@/components/marketing/compare/alternatives-page";
import { MarginToolPage } from "@/components/marketing/tools/margin-tool-page";
import { IndustryPageView } from "@/components/marketing/industries/industry-page";
import { SolutionPageView } from "@/components/marketing/solutions/solution-page";
import { RankingArticleView } from "@/components/marketing/blog-ranking/ranking-article";
import { Breadcrumb } from "@/components/marketing/site/breadcrumb";
import { loadAllMessages } from "@/i18n/messages";
import { alternativeCompetitors, alternativesShortlist, competitorSources, publishableCompetitors } from "@/lib/marketing/compare.lib";
import { FEATURE_PAGES, INTEGRATION_PAGES } from "@/lib/marketing/detail-pages.lib";
import { INDUSTRIES } from "@/lib/marketing/industries.lib";
import { SOLUTIONS } from "@/lib/marketing/solutions.lib";
import type { RankingArticle } from "@/lib/marketing/ranking.lib";

const state = vi.hoisted(() => ({ locale: "ar", messages: {} as Record<string, unknown> }));

function translator(namespace?: string) {
  return createTranslator({
    locale: state.locale,
    messages: state.messages as never,
    namespace: namespace as never,
    onError: (error: unknown) => {
      throw error;
    },
  });
}

vi.mock("next-intl/server", () => ({
  getLocale: async () => state.locale,
  getTranslations: async (arg?: string | { namespace?: string }) => translator(typeof arg === "string" ? arg : arg?.namespace),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
// eslint-disable-next-line @next/next/no-img-element
vi.mock("next/image", () => ({ default: ({ alt }: { alt: string }) => <img alt={alt} /> }));
vi.mock("@/components/marketing/signup/signup-trigger.client", () => ({
  SignupTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
}));
vi.mock("@/lib/marketing/templates.server", () => ({
  getTemplateGallery: async () => [
    { id: "fashion-one", category: "fa", name: "Fashion one", description: "A real blurb", thumbnailUrl: null, previewUrl: null, price: null, palette: [], pages: [], sortOrder: 1 },
    { id: "beauty-one", category: "be", name: "Beauty one", description: null, thumbnailUrl: null, previewUrl: null, price: null, palette: [], pages: [], sortOrder: 2 },
  ],
}));

/** Stands in for the RSC renderer: awaits server components, and leaves hook users to the real renderer. */
async function resolve(node: React.ReactNode): Promise<React.ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolve));
  if (!React.isValidElement(node)) return node;
  const { type, props } = node as React.ReactElement<Record<string, unknown>>;
  const resolvedProps: Record<string, unknown> = { ...props };
  for (const [key, value] of Object.entries(props)) {
    if (key === "children" ? typeof value !== "function" : React.isValidElement(value) || Array.isArray(value)) {
      resolvedProps[key] = await resolve(value as React.ReactNode);
    }
  }
  if (typeof type === "function") {
    try {
      return await resolve(await (type as (p: unknown) => React.ReactNode)(resolvedProps));
    } catch (error) {
      if (!/reading 'use|Invalid hook call|useContext|null \(reading|context from `NextIntlClientProvider`/.test(String(error))) throw error;
    }
  }
  return React.createElement(type as React.ElementType, { ...resolvedProps, key: node.key });
}

async function html(element: React.ReactNode): Promise<string> {
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale={state.locale}
      messages={state.messages as never}
      onError={(error) => {
        throw error;
      }}
    >
      {await resolve(element)}
    </NextIntlClientProvider>,
  );
}

describe.each(["ar", "en"])("content pages render (%s)", (locale) => {
  beforeAll(async () => {
    state.locale = locale;
    state.messages = await loadAllMessages(locale);
    // The first provider render in a test file loses its context under this stand-in renderer.
    await html(<span />).catch(() => "");
    await html(<Breadcrumb items={[]} />).catch(() => "");
  });

  const check = (out: string) => {
    expect(out.length).toBeGreaterThan(1000);
    expect(out).not.toContain("يُراجع");
    expect(out).not.toContain("MISSING_MESSAGE");
    expect(out).toContain("<h1");
  };

  it("feature and integration pages", async () => {
    for (const page of [...FEATURE_PAGES, ...INTEGRATION_PAGES]) check(await html(<DetailPageView page={page} />));
  });

  it("the integrations hub, with soon items and a link only where a page exists", async () => {
    const out = await html(await IntegrationsPage());
    check(out);
    expect(out).toContain('href="/integrations/meta-pixel"');
    expect(out).not.toContain('href="/integrations/bosta"');
  });

  it("the compare hub and every comparison, without unverified rows", async () => {
    check(await html(await CompareHub()));
    for (const competitor of publishableCompetitors()) {
      const out = await html(<ComparePageView competitor={competitor} />);
      check(out);
      // A real table with a caption, row headers and a visible, linked sources list.
      expect(out).toContain("<caption");
      expect(out).toContain('scope="row"');
      expect(out).toContain('id="sources"');
      for (const source of competitorSources(competitor)) expect(out, competitor.id).toContain(`href="${source.url.replace(/&/g, "&amp;")}"`);
    }
  });

  it("the alternatives pages, with Tallaby first and only options that work in Egypt", async () => {
    for (const competitor of alternativeCompetitors()) {
      const out = await html(<AlternativesPageView competitor={competitor} />);
      check(out);
      expect(out).not.toContain("tallaby-vs-salla");
      for (const other of alternativesShortlist(competitor)) expect(out).toContain(`href="/compare/tallaby-vs-${other.id}"`);
    }
  });

  it("the tool page, with its fee from the current price", async () => {
    const out = await html(await MarginToolPage());
    check(out);
    expect(out).toContain("306.5");
    expect(out).toContain("143.5");
  });

  it("industry pages, with templates from the catalog and a linked hub crumb", async () => {
    for (const industry of INDUSTRIES) {
      const out = await html(<IndustryPageView industry={industry} />);
      check(out);
      // Only the industry's own templates: the category for clothing, the niche's keys elsewhere.
      if (industry.slug === "clothing-store") expect(out).toContain("Fashion one");
      else expect(out, industry.slug).not.toContain("Fashion one");
      expect(out).not.toContain("Beauty one");
      // Home › Industries › page, in the trail and in BreadcrumbList.
      expect(out, industry.slug).toContain('href="/industries"');
      expect(out.match(/"@type":"ListItem"/g)?.length, industry.slug).toBe(3);
      // Never a clothing mock on another industry's page.
      if (industry.slug !== "clothing-store") expect(out, industry.slug).not.toContain("nomad");
    }
  });

  it("the industries hub, linking every industry page", async () => {
    const out = await html(await IndustriesHub());
    check(out);
    for (const industry of INDUSTRIES) expect(out, industry.slug).toContain(`href="/industries/${industry.slug}"`);
  });

  it("solution pages", async () => {
    for (const solution of SOLUTIONS) check(await html(<SolutionPageView solution={solution} />));
  });

  it("the ranking layout leaves out what an item doesn't have", async () => {
    const article: RankingArticle = {
      slug: "sample",
      title: "Sample list",
      description: "",
      author: "Team",
      publishedAt: "2026-10-15",
      updatedAt: "2026-11-01",
      readMinutes: 5,
      intro: "Intro",
      method: "Method",
      criteria: [],
      listTitle: "List",
      ctaAfter: 1,
      items: [
        { id: "p1", name: "Tallaby", pick: true, price: "$0", pros: ["Good"] },
        { id: "p2", name: "Other", description: "Only a sentence" },
      ],
      chooseLead: "Choose",
      checklist: [{ title: "Check", body: "Body" }],
      faq: [{ q: "Q", a: "A" }],
    };
    const out = await html(await RankingArticleView({ article }));
    check(out);
    const t = translator("blogRanking") as unknown as (key: string) => string;
    expect(out).not.toContain(`>${t("columns.rating")}<`);
    expect(out).not.toContain(t("columns.bestFor"));
    expect(out).toContain(t("columns.price"));
  });
});
