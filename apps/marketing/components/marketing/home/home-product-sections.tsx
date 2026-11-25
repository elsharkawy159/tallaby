import * as React from "react";
import {
  Bell,
  CircleCheck,
  CreditCard,
  FileText,
  GripVertical,
  LayoutGrid,
  Mail,
  MessageCircle,
  MousePointerClick,
  QrCode,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  UserRound,
  Wallet,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { siGoogleanalytics, siGooglesheets, siGoogletagmanager, siMeta, siShopify, siSnapchat, siTiktok } from "simple-icons";
import { APPS, localize, type AppId } from "@workspace/apps";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Kicker, Ltr, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { storeBuilderEnabled } from "@/lib/store-build/intake-request.server";
import { getTallabyPayFacts } from "@/lib/marketing/tallaby-pay.server";
import { ChatGptMark, ClaudeMark } from "./ai-brand-marks";
import { BentoBox, MockChip, loop } from "./home-bento";
import { McpChatDemo } from "./mcp-chat-demo";

/** "Soon": a feature that isn't live yet. Never drop it from a box that isn't built. */
async function SoonBadge() {
  const t = await getTranslations("home.common");
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-ink">{t("soon")}</span>;
}

async function NewBadge() {
  const t = await getTranslations("home.common");
  return <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">{t("new")}</span>;
}

function PayMark({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <span className={cn("grid h-6 w-10 place-items-center rounded-md border border-line bg-white px-1", className)}>
      <Image src={src} alt={alt} width={36} height={20} unoptimized className="max-h-4 w-auto object-contain" />
    </span>
  );
}

/* ------------------------------------------------------------------ Tallaby Pay */

/**
 * Tallaby Pay (ROADMAP.md F-100, live since 2026-11-20). Shown only while the
 * `tallaby_pay_live` switch is on, with the fee read from the settings
 * checkout uses. Methods and payouts follow packages/apps/src/manifests/tallaby-pay.ts
 * and packages/lib/src/tallaby-pay/payouts.lib.ts. "Customer pays the fee"
 * waits for migration 0178, so it isn't claimed here.
 */
export async function HomeTallabyPay() {
  const facts = await getTallabyPayFacts();
  if (!facts?.live) return null;
  const t = await getTranslations("home.pay");
  const points = ["methods", "fee", "release", "egp"] as const;
  const methods = [
    { key: "card", icon: CreditCard, marks: [{ src: "/icons/payments/visa.svg", alt: "Visa" }, { src: "/icons/payments/mastercard.svg", alt: "Mastercard" }] },
    { key: "wallet", icon: Smartphone, marks: [{ src: "/icons/payments/vodafone-cash.png", alt: "Vodafone Cash" }] },
    { key: "meeza", icon: CreditCard, marks: [{ src: "/icons/payments/meeza.svg", alt: "Meeza" }] },
    { key: "cash", icon: Wallet, marks: [{ src: "/marketing/home/logos/fawry.svg", alt: "Fawry" }, { src: "/marketing/home/logos/aman.svg", alt: "Aman" }] },
  ] as const;

  return (
    <Section id="tallaby-pay" aria-labelledby="tallaby-pay-title">
      <Container>
        <div className="cta-glow relative grid items-center gap-8 overflow-hidden rounded-band bg-teal-900 px-5 py-10 text-ink-on-dark min-[641px]:px-10 min-[1081px]:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] min-[1081px]:gap-14 min-[1081px]:px-14 min-[1081px]:py-14">
          <Reveal className="relative flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-2">
              <Image src="/logo-mark.png" alt="" width={36} height={36} className="size-9 rounded-xl bg-white p-1" />
              <Kicker className="border-white/15 bg-white/10 text-amber-300">{t("kicker")}</Kicker>
            </span>
            <h2 id="tallaby-pay-title" className="text-[clamp(28px,4vw,44px)] leading-[1.3] font-bold text-balance text-white en:leading-[1.15] en:tracking-[-0.01em] [&_em]:text-amber-300 [&_em]:not-italic">
              {t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
            </h2>
            <p className="max-w-[560px] text-[17px] text-pretty text-white/75">{t("lead")}</p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[15px] text-white/90">
                  <CircleCheck className="mt-1 size-[18px] flex-none text-amber-300" aria-hidden />
                  <span>{t.rich(`points.${point}`, { fee: () => <Num className="font-bold text-white">{facts.feePercent}%</Num> })}</span>
                </li>
              ))}
            </ul>
            <SignupTrigger className="mt-2">{t("cta")}</SignupTrigger>
          </Reveal>

          {/* A checkout's payment step and the seller's earnings, coded; sample figures. */}
          <div aria-hidden className="relative mx-auto flex w-full max-w-[420px] flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-card bg-white p-4 text-ink-700 shadow-stage">
              <span className="flex items-center justify-between text-[13px] font-bold text-teal-900">
                {t("mock.checkout")}
                <span className="inline-flex items-center gap-1 text-[11px] text-[#16a34a]">
                  <ShieldCheck className="size-3.5" />
                  Tallaby Pay
                </span>
              </span>
              {methods.map((method, index) => (
                <span key={method.key} className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2", index === 0 ? "border-amber-500 bg-amber-50" : "border-line")}>
                  <span className={cn("grid size-4 place-items-center rounded-full border-2", index === 0 ? "border-amber-600" : "border-line-strong")}>
                    {index === 0 ? <span className="size-1.5 rounded-full bg-amber-600" /> : null}
                  </span>
                  <method.icon className="size-4 text-teal-700" />
                  <span className="text-[12.5px] font-semibold">{t(`mock.${method.key}`)}</span>
                  <span className="ms-auto flex gap-1">
                    {method.marks.map((mark) => (
                      <PayMark key={mark.alt} src={mark.src} alt="" />
                    ))}
                  </span>
                </span>
              ))}
              <span className="mk-shimmer mt-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-[13px] font-bold text-amber-ink">
                {t("mock.pay")} <Num>1,340</Num> {t("mock.currency")}
              </span>
            </div>
            <div style={loop(0.8, 6)} className="mk-toast flex items-center gap-3 rounded-card-sm bg-white/95 p-3 text-ink-700 shadow-raise min-[641px]:ms-10">
              <span className="grid size-9 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]">
                <CircleCheck className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-[12.5px] font-bold text-teal-900">{t("mock.delivered")}</span>
                <span className="text-[11.5px] text-ink-500">{t("mock.available")}</span>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ Builder */

/**
 * Design with AI and Drag & Drop. The AI Store Builder is on unless
 * STORE_BUILDER_AI_ENABLED=0 (owner, 2026-11-09; builder-access.server.ts in
 * the dashboard reads the same variable); off, its row shows "Soon".
 * The editor is packages/store-editor; the live site changes only on Publish.
 */
export async function HomeBuilder() {
  const t = await getTranslations("home.builder");
  const aiLive = storeBuilderEnabled();
  const soon = aiLive ? null : await SoonBadge();
  const sections = ["header", "hero", "products", "footer"] as const;

  return (
    <Section id="design" aria-labelledby="design-title">
      <Container className="grid items-center gap-10 min-[1081px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] min-[1081px]:gap-14">
        <Reveal className="flex flex-col items-start">
          <SectionHeading id="design-title" kicker={t("kicker")} title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })} description={t("lead")} className="mb-6" />
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {[
              { key: "ai", icon: WandSparkles, badge: soon },
              { key: "dnd", icon: MousePointerClick, badge: null },
              { key: "publish", icon: CircleCheck, badge: null },
            ].map((row) => (
              <li key={row.key} className="flex items-start gap-3 rounded-card-sm border border-line bg-white p-3.5 shadow-soft">
                <span className="grid size-10 flex-none place-items-center rounded-[12px] bg-teal-50 text-teal-700">
                  <row.icon className="size-5" aria-hidden />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 text-[15.5px] font-bold text-teal-900">
                    {t(`rows.${row.key}.title`)}
                    {row.badge}
                  </span>
                  <span className="text-sm text-pretty text-ink-500">{t(`rows.${row.key}.body`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* The editor, coded: section list (one being dragged), the page, and the AI prompt. */}
        <div aria-hidden className="overflow-hidden rounded-card-lg border border-line bg-white shadow-stage">
          <div className="flex items-center gap-2 border-b border-line-soft px-4 py-2.5">
            <span className="flex gap-1">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="text-[12px] font-bold text-teal-900">{t("mock.editor")}</span>
            <span className="ms-auto rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-amber-ink">{t("mock.publish")}</span>
          </div>
          <div className="grid grid-cols-[120px_minmax(0,1fr)] min-[641px]:grid-cols-[160px_minmax(0,1fr)]">
            <div className="flex flex-col gap-1.5 border-e border-line-soft bg-[#f8fbfb] p-2.5">
              <span className="px-1 text-[10.5px] font-bold text-ink-400">{t("mock.sections")}</span>
              {sections.map((section, index) => (
                <span
                  key={section}
                  style={index === 2 ? loop(0, 3.5) : undefined}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border bg-white px-1.5 py-1.5 text-[11px] font-semibold text-ink-700",
                    index === 2 ? "mk-bob relative z-10 border-amber-500 shadow-raise" : "border-line",
                  )}
                >
                  <GripVertical className="size-3.5 flex-none text-ink-400" />
                  <span className="truncate">{t(`mock.${section}`)}</span>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2 p-3">
              <span className="h-3 w-1/3 rounded-full bg-teal-100" />
              <span className="relative grid h-24 place-items-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--color-teal-700),var(--color-teal-900))] min-[641px]:h-28">
                <span className="flex flex-col items-center gap-1.5">
                  <span className="h-2.5 w-28 rounded-full bg-white/80" />
                  <span className="h-2 w-20 rounded-full bg-white/40" />
                  <span className="mt-1 h-4 w-16 rounded-full bg-amber-500" />
                </span>
                <span className="absolute inset-1 rounded-lg border-2 border-dashed border-amber-300/80" />
              </span>
              <span className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((tile) => (
                  <span key={tile} className="flex flex-col gap-1 rounded-lg border border-line p-1.5">
                    <span className="h-9 rounded-md bg-teal-50 min-[641px]:h-12" />
                    <span className="h-1.5 w-3/4 rounded-full bg-teal-100" />
                  </span>
                ))}
              </span>
              <span className="mt-1 flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 shadow-soft">
                <Sparkles className="size-4 flex-none text-amber-600" />
                <span className="truncate text-[11.5px] text-ink-600">{t("mock.prompt")}</span>
                <span className="animate-blink h-3.5 w-px flex-none bg-teal-900" />
              </span>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ Your customers */

/**
 * Features the seller's customers feel. Each was checked in code (2026-11-25):
 * deposit (cod-deposit.lib.ts: 10/20/30/50%), order confirmation email
 * (place-order.ts, every plan; later updates need the Order notifications app),
 * delivery record per phone (customers.lib.ts), the store app (ecommerce
 * manifest.ts), sign-in and the Tallaby wallet (checkout.data.tsx). Automated
 * WhatsApp messages are not built, so that line carries "Soon".
 */
export async function HomeCustomers() {
  const t = await getTranslations("home.customers");
  const soon = await SoonBadge();
  const percents = [10, 20, 30, 50];

  return (
    <Section id="customers" aria-labelledby="customers-title">
      <Container>
        <Reveal>
          <SectionHeading id="customers-title" kicker={t("kicker")} title={t("title")} description={t("lead")} centered />
        </Reveal>
        <div className="grid gap-3 min-[641px]:grid-cols-2 min-[641px]:gap-4 min-[1081px]:grid-cols-3">
          <BentoBox
            title={t("deposit.title")}
            body={t("deposit.body")}
            stage={
              <div className="flex w-full max-w-[260px] flex-col gap-2.5 rounded-xl border border-line bg-white p-3 shadow-soft">
                <span className="flex justify-between text-[12px] font-bold text-teal-900">
                  {t("mock.depositNow")}
                  <Num>20%</Num>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-teal-50">
                  <span className="block h-full w-1/5 rounded-full bg-amber-500" />
                </span>
                <span className="flex gap-1.5">
                  {percents.map((percent) => (
                    <Num key={percent} className={cn("flex-1 rounded-lg border py-1 text-center text-[11px] font-bold", percent === 20 ? "border-amber-500 bg-amber-50 text-amber-ink" : "border-line text-ink-500")}>
                      {percent}%
                    </Num>
                  ))}
                </span>
              </div>
            }
          />
          <BentoBox
            title={t("confirm.title")}
            body={t("confirm.body")}
            stage={
              <div className="flex w-full max-w-[260px] flex-col gap-2">
                <span style={loop(0, 6)} className="mk-seq flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 shadow-soft">
                  <Mail className="size-4 text-teal-700" />
                  <span className="text-[11.5px] font-semibold text-ink-700">{t("mock.emailSent")}</span>
                  <CircleCheck className="ms-auto size-4 text-[#16a34a]" />
                </span>
                <span className="flex items-center gap-2 rounded-xl border border-dashed border-line-strong bg-white/60 px-3 py-2">
                  <MessageCircle className="size-4 text-ink-400" />
                  <span className="text-[11.5px] font-semibold text-ink-400">{t("mock.whatsapp")}</span>
                  <span className="ms-auto">{soon}</span>
                </span>
              </div>
            }
          />
          <BentoBox
            title={t("record.title")}
            body={t("record.body")}
            stage={
              <div className="flex w-full max-w-[260px] flex-col gap-2 rounded-xl border border-line bg-white p-3 shadow-soft">
                <span className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-teal-50 text-teal-700">
                    <UserRound className="size-4" />
                  </span>
                  <Ltr className="font-latin text-[12px] font-semibold text-ink-700">010 •••• 4821</Ltr>
                </span>
                <span className="flex justify-between text-[11px] text-ink-500">
                  <span>{t("mock.delivered")}</span>
                  <Num className="font-bold text-[#16a34a]">9</Num>
                </span>
                <span className="flex justify-between text-[11px] text-ink-500">
                  <span>{t("mock.refused")}</span>
                  <Num className="font-bold text-[#dc2626]">1</Num>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-[#fee2e2]">
                  <span style={loop(0, 5)} className="mk-fill block h-full w-[90%] rounded-full bg-[#16a34a]" />
                </span>
                <Num className="self-end text-[13px] font-bold text-teal-900">90%</Num>
              </div>
            }
          />
          <BentoBox
            title={t("app.title")}
            body={t("app.body")}
            stage={
              <div className="relative flex h-[140px] w-[104px] flex-col items-center gap-2 rounded-[18px] border-4 border-teal-900 bg-white p-2 pt-3 shadow-raise">
                <span className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2, 3, 4].map((tile) => (
                    <span key={tile} className="size-4 rounded-[5px] bg-teal-50" />
                  ))}
                  <span style={loop(0)} className="mk-pulse grid size-4 place-items-center rounded-[5px] bg-amber-500">
                    <ShoppingBag className="size-2.5 text-amber-ink" />
                  </span>
                </span>
                <span className="mt-auto rounded-full bg-teal-900 px-2 py-0.5 text-[9px] font-bold whitespace-nowrap text-white">{t("mock.install")}</span>
              </div>
            }
          />
          <BentoBox
            title={t("account.title")}
            body={t("account.body")}
            stage={
              <div className="flex w-full max-w-[250px] flex-col gap-2">
                <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 shadow-soft">
                  <UserRound className="size-4 text-teal-700" />
                  <span className="text-[11.5px] font-semibold text-ink-700">{t("mock.signedIn")}</span>
                </span>
                <span style={loop(0.4)} className="mk-bob flex items-center gap-2 rounded-xl bg-teal-900 px-3 py-2.5 text-white shadow-raise">
                  <Wallet className="size-4 text-amber-300" />
                  <span className="text-[11.5px] font-semibold">{t("mock.wallet")}</span>
                  <span className="ms-auto text-[12px] font-bold">
                    <Num>250</Num> {t("mock.currency")}
                  </span>
                </span>
              </div>
            }
          />
          <BentoBox
            title={t("more.title")}
            body={t("more.body")}
            stage={
              <div className="flex flex-wrap justify-center gap-1.5">
                {(["fake", "block", "unfinished", "coupons", "reviews"] as const).map((item, index) => (
                  <MockChip key={item} style={loop(index * 0.4)} className="mk-bob">
                    {t(`mock.more.${item}`)}
                  </MockChip>
                ))}
              </div>
            }
          />
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ Tallaby AI */

/**
 * Tallaby AI. Live: the AI assistants connection (MCP, product tools only,
 * apps/backend/src/mcp/tools), product autofill (dashboard /api/ai/product-autofill)
 * and the AI Store Builder (flag above). Not built: store evaluation and
 * AI blog writing, so they carry "Soon". Keeps the old #ai anchor.
 */
export async function HomeTallabyAi() {
  const t = await getTranslations("home.ai");
  const soon = await SoonBadge();
  const newBadge = await NewBadge();
  const builderLive = storeBuilderEnabled();

  return (
    <Section id="ai" aria-labelledby="ai-title">
      <Container>
        <Reveal>
          <SectionHeading id="ai-title" kicker={t("kicker")} title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })} description={t("lead")} centered />
        </Reveal>
        <div className="grid gap-3 min-[641px]:grid-cols-2 min-[641px]:gap-4 min-[1081px]:grid-cols-4">
          <BentoBox
            title={t("assistant.title")}
            badge={newBadge}
            body={t.rich("assistant.body", {
              claude: () => (
                <Ltr className="inline-flex items-center gap-1 align-baseline font-latin font-semibold text-ink-700">
                  <ClaudeMark className="size-[0.9em] flex-none self-center" />
                  Claude
                </Ltr>
              ),
              chatgpt: () => (
                <Ltr className="inline-flex items-center gap-1 align-baseline font-latin font-semibold text-ink-700">
                  <ChatGptMark className="size-[0.9em] flex-none self-center text-[#0d0d0d]" />
                  ChatGPT
                </Ltr>
              ),
            })}
            stage={<McpChatDemo />}
            className="min-[641px]:col-span-2 min-[1081px]:row-span-2"
            stageClassName="h-[300px] items-stretch p-3 min-[1081px]:h-auto min-[1081px]:flex-1"
          />
          <BentoBox
            title={t("product.title")}
            body={t("product.body")}
            stage={
              <div className="flex w-full max-w-[260px] items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-soft">
                <span className="grid size-14 flex-none place-items-center rounded-lg bg-[linear-gradient(135deg,var(--color-amber-100),var(--color-teal-50))]">
                  <ShoppingBag className="size-6 text-teal-700" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                    <Sparkles className="size-3.5" />
                    {t("mock.writing")}
                  </span>
                  <span style={loop(0)} className="mk-shimmer h-2 w-full rounded-full bg-teal-100" />
                  <span style={loop(0.25)} className="mk-shimmer h-2 w-4/5 rounded-full bg-teal-100" />
                  <span className="flex gap-1">
                    {["AR", "EN", "SEO"].map((tag) => (
                      <Ltr key={tag} className="rounded bg-teal-50 px-1.5 font-latin text-[10px] font-bold text-teal-700">
                        {tag}
                      </Ltr>
                    ))}
                  </span>
                </span>
              </div>
            }
          />
          <BentoBox
            title={t("design.title")}
            badge={builderLive ? null : soon}
            body={t("design.body")}
            stage={
              <div className="flex w-full max-w-[250px] flex-col gap-2">
                <span className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 shadow-soft">
                  <WandSparkles className="size-4 flex-none text-amber-600" />
                  <span className="truncate text-[11px] text-ink-600">{t("mock.prompt")}</span>
                </span>
                <span className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map((tile) => (
                    <span key={tile} style={loop(tile * 0.45, 6)} className={cn("mk-seq flex flex-col gap-1 rounded-lg border bg-white p-1.5", tile === 1 ? "border-amber-500" : "border-line")}>
                      <span className={cn("h-2 rounded-sm", tile === 0 ? "bg-teal-700" : tile === 1 ? "bg-amber-500" : "bg-ink-700")} />
                      <span className="h-8 rounded-sm bg-teal-50" />
                    </span>
                  ))}
                </span>
              </div>
            }
          />
          <BentoBox
            title={t("review.title")}
            badge={soon}
            body={t("review.body")}
            stage={
              <div className="flex w-full max-w-[230px] flex-col gap-2 opacity-80">
                {(["speed", "photos", "seo"] as const).map((row, index) => (
                  <span key={row} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5 shadow-soft">
                    <Star className={cn("size-3.5", index === 2 ? "text-ink-400" : "text-amber-600")} />
                    <span className="text-[11px] font-semibold text-ink-700">{t(`mock.review.${row}`)}</span>
                    <span className="ms-auto h-1.5 w-12 overflow-hidden rounded-full bg-teal-50">
                      <span style={loop(index * 0.4, 5)} className="mk-fill block h-full rounded-full bg-teal-500" />
                    </span>
                  </span>
                ))}
              </div>
            }
          />
          <BentoBox
            title={t("blog.title")}
            badge={soon}
            body={t("blog.body")}
            stage={
              <div className="flex w-full max-w-[230px] flex-col gap-2 rounded-xl border border-line bg-white p-3 opacity-80 shadow-soft">
                <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-teal-900">
                  <FileText className="size-4 text-teal-700" />
                  {t("mock.blog")}
                </span>
                <span style={loop(0)} className="mk-shimmer h-1.5 w-full rounded-full bg-teal-100" />
                <span style={loop(0.3)} className="mk-shimmer h-1.5 w-5/6 rounded-full bg-teal-100" />
                <span style={loop(0.6)} className="mk-shimmer h-1.5 w-2/3 rounded-full bg-teal-100" />
              </div>
            }
          />
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ Store apps */

/** Brand glyphs for apps whose manifest has no logo file (Simple Icons, as the dashboard's App Center). */
const APP_GLYPHS: Partial<Record<AppId, string>> = {
  meta_pixel: siMeta.path,
  meta_capi: siMeta.path,
  google_analytics: siGoogleanalytics.path,
  google_tag_manager: siGoogletagmanager.path,
  shopify_import: siShopify.path,
  google_sheets: siGooglesheets.path,
  tiktok_pixel: siTiktok.path,
  snapchat_pixel: siSnapchat.path,
};

/** Our own apps: a lucide icon. */
const APP_ICONS: Partial<Record<AppId, React.ComponentType<{ className?: string }>>> = {
  ai_assistants: Sparkles,
  customer_notifications: Bell,
  size_chart: Ruler,
  product_feeds: LayoutGrid,
  qr_codes: QrCode,
};

/** Logo files copied from the dashboard's public/app-logos (the manifests' `icon.image`). */
const APP_LOGOS: Partial<Record<AppId, string>> = {
  tallaby_pay: "/logo-mark.png",
  bosta: "/marketing/home/logos/bosta.png",
  wassalha: "/marketing/home/logos/egypt-post.png",
  paymob: "/marketing/home/logos/paymob.png",
  kashier: "/marketing/home/logos/kashier.png",
  easykash: "/marketing/home/logos/easykash.png",
};

/** Columns of the apps grid on wide screens (min-[1081px]:grid-cols-4). */
const APPS_WIDE_COLUMNS = 4;

/**
 * The store apps grid, from the App Center registry (@workspace/apps): live apps
 * only, Tallaby Pay first and only while its switch is on. On wide screens the
 * first apps take two columns so the last row is full. No prices (owner,
 * 2026-11-05: each app's cost is shown in the dashboard before the seller
 * turns it on).
 */
export async function HomeApps() {
  const [t, locale, pay] = await Promise.all([getTranslations("home.apps"), getLocale(), getTallabyPayFacts()]);
  const lang = locale === "en" ? "en" : "ar";
  // An app shows only with its own home line (home.apps.items.<id>): the manifests' summaries promise more than some apps do today.
  const apps = APPS.filter((app) => app.status === "live" && (app.id !== "tallaby_pay" || pay?.live) && t.has(`items.${app.id}`)).sort(
    (a, b) => Number(b.id === "tallaby_pay") - Number(a.id === "tallaby_pay"),
  );
  const wide = (APPS_WIDE_COLUMNS - (apps.length % APPS_WIDE_COLUMNS)) % APPS_WIDE_COLUMNS;

  return (
    <Section id="apps" aria-labelledby="apps-title">
      <Container>
        <Reveal>
          <SectionHeading id="apps-title" kicker={t("kicker")} title={t("title")} description={t("lead")} centered />
        </Reveal>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 min-[641px]:grid-cols-3 min-[641px]:gap-4 min-[1081px]:grid-cols-4">
          {apps.map((app, index) => {
            const logo = APP_LOGOS[app.id];
            const glyph = APP_GLYPHS[app.id];
            const Icon = APP_ICONS[app.id];
            return (
              <li
                key={app.id}
                className={cn(
                  "flex min-w-0 flex-col items-start gap-2.5 rounded-card-sm border border-line bg-white p-3 shadow-soft min-[641px]:p-4 min-[1081px]:flex-row min-[1081px]:gap-3",
                  index < wide && "min-[1081px]:col-span-2",
                )}
              >
                <span
                  className={cn("grid size-11 flex-none place-items-center overflow-hidden rounded-[12px]", logo && "border border-line bg-white")}
                  style={logo ? undefined : { background: app.icon.background, color: app.icon.foreground }}
                >
                  {logo ? (
                    <Image src={logo} alt="" width={44} height={44} className="size-full object-contain p-1" />
                  ) : glyph ? (
                    <svg viewBox="0 0 24 24" aria-hidden className="size-[22px] fill-current">
                      <path d={glyph} />
                    </svg>
                  ) : Icon ? (
                    <Icon className="size-[22px]" />
                  ) : (
                    <span className="font-latin text-lg font-bold">{localize(app.name, "en").charAt(0)}</span>
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14.5px] leading-snug font-bold text-teal-900 min-[1081px]:truncate">{localize(app.name, lang)}</span>
                  <span className="line-clamp-3 text-[12.5px] min-[1081px]:line-clamp-2 text-pretty text-ink-500">{t(`items.${app.id}`)}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-[13.5px] text-ink-500">{t("cost")}</p>
          <CtaButton asChild tone="outline">
            <Link href="/integrations">
              {t("more")}
              <ForwardArrow className="ms-2 size-4" />
            </Link>
          </CtaButton>
        </div>
      </Container>
    </Section>
  );
}
