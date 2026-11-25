import * as React from "react";
import { Banknote, Bike, Check, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Container, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { SignupTrigger, SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { getTallabyPayFacts } from "@/lib/marketing/tallaby-pay.server";
import { loop } from "./home-bento";

/** Google's "G" mark, for the sign-in button look (it opens the real signup, which offers Google). */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-[18px]", className)}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** A uniform logo tile: a real brand file, our own mark, or an icon for our own features. */
export function LogoTile({ src, icon: Icon, label, highlight }: { src?: string; icon?: React.ComponentType<{ className?: string }>; label: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 rounded-xl border bg-white px-1.5 py-2 text-center shadow-soft",
        highlight ? "border-amber-500 ring-2 ring-amber-100" : "border-line",
      )}
    >
      {src ? (
        <Image src={src} alt="" width={32} height={32} className="size-8 rounded-lg object-contain" />
      ) : Icon ? (
        <span className="grid size-8 place-items-center rounded-lg bg-teal-50 text-teal-700">
          <Icon className="size-[18px]" />
        </span>
      ) : null}
      <span className="line-clamp-2 w-full text-[10.5px] leading-tight font-semibold text-balance text-ink-700">{label}</span>
    </span>
  );
}

function StepCard({ index, title, body, children }: { index: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <Reveal as="li" className="flex min-w-0 flex-col gap-4 rounded-card-lg border border-line bg-white p-4 shadow-soft min-[641px]:p-5">
      <div className="flex items-center gap-3">
        <Num className="grid size-10 flex-none place-items-center rounded-full bg-amber-500 text-[17px] font-bold text-amber-ink">{index}</Num>
        <h3 className="text-[18px] leading-snug font-bold text-teal-900">{title}</h3>
      </div>
      <p className="text-sm text-pretty text-ink-500">{body}</p>
      <div className="relative mt-auto flex min-h-[230px] flex-col justify-center gap-3 overflow-hidden rounded-card-sm border border-line-soft bg-[linear-gradient(160deg,#f3f8f9_0%,#fff_70%)] p-3.5">
        {children}
      </div>
    </Reveal>
  );
}

/**
 * "Create your store in 3 minutes" (2026-11-25): three numbered cards, each with
 * a small mock-up. Step 1 is the real signup (Google button look and the link
 * field both open the signup dialog). Payment logos list Tallaby Pay first, while its switch is on.
 */
export async function HomeSteps() {
  const [t, pay] = await Promise.all([getTranslations("home.steps"), getTallabyPayFacts()]);
  const payLive = Boolean(pay?.live);
  const themes = [
    { key: "a", top: "bg-teal-700", tile: "bg-amber-100" },
    { key: "b", top: "bg-amber-500", tile: "bg-teal-50" },
    { key: "c", top: "bg-ink-700", tile: "bg-[#f4e9e1]" },
  ];

  return (
    <Section id="how" aria-labelledby="how-title">
      <Container>
        <Reveal>
          <SectionHeading id="how-title" kicker={t("kicker")} title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })} description={t("lead")} centered />
        </Reveal>
        <ol className="m-0 grid list-none gap-4 p-0 min-[1081px]:grid-cols-3 min-[1081px]:gap-5">
          <StepCard index={1} title={t("one.title")} body={t("one.body")}>
            <SignupTrigger tone="outline" className="w-full gap-2.5 bg-white">
              <GoogleMark />
              {t("one.google")}
            </SignupTrigger>
            <span className="flex items-center gap-2 text-[12px] text-ink-400">
              <span className="h-px flex-1 bg-line" />
              {t("one.or")}
              <span className="h-px flex-1 bg-line" />
            </span>
            <SlugClaimForm flat className="border border-line" submitLabel={t("one.claim")} />
          </StepCard>

          <StepCard index={2} title={t("two.title")} body={t("two.body")}>
            <div aria-hidden className="grid grid-cols-3 gap-2">
              {themes.map((theme, index) => (
                <span key={theme.key} className={cn("relative flex flex-col gap-1 rounded-lg border bg-white p-1.5", index === 0 ? "border-amber-500 ring-2 ring-amber-100" : "border-line")}>
                  <span className={cn("h-2 rounded-sm", theme.top)} />
                  <span className={cn("h-7 rounded-sm", theme.tile)} />
                  <span className="grid grid-cols-2 gap-1">
                    <span className="h-3 rounded-sm bg-teal-50" />
                    <span className="h-3 rounded-sm bg-teal-50" />
                  </span>
                  {index === 0 ? (
                    <span className="absolute -top-1.5 -end-1.5 grid size-4 place-items-center rounded-full bg-amber-500 text-amber-ink">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
            <div aria-hidden className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5 shadow-soft">
              <span className="grid size-12 flex-none place-items-center rounded-lg bg-[linear-gradient(135deg,var(--color-amber-100),var(--color-teal-50))]">
                <ShoppingBag className="size-5 text-teal-700" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-[12px] font-bold text-teal-900">{t("two.product")}</span>
                <span style={loop(0)} className="mk-shimmer h-1.5 w-full rounded-full bg-teal-100" />
                <span style={loop(0.3)} className="mk-shimmer h-1.5 w-3/4 rounded-full bg-teal-100" />
              </span>
            </div>
            <span aria-hidden className="inline-flex items-center gap-1.5 self-start rounded-full bg-teal-900 px-3 py-1.5 text-[11.5px] font-bold text-white">
              <Sparkles className="mk-pulse size-3.5 text-amber-300" />
              {t("two.ai")}
            </span>
          </StepCard>

          <StepCard index={3} title={t("three.title")} body={t(payLive ? "three.body" : "three.bodyNoPay")}>
            <span className="text-[11.5px] font-bold text-ink-500">{t("three.shipping")}</span>
            <div className="grid grid-cols-3 gap-2">
              <LogoTile src="/marketing/home/logos/bosta.png" label="Bosta" />
              <LogoTile src="/marketing/home/logos/egypt-post.png" label={t("three.wassalha")} />
              <LogoTile icon={Bike} label={t("three.riders")} />
            </div>
            <span className="text-[11.5px] font-bold text-ink-500">{t("three.payments")}</span>
            <div className={cn("grid gap-2", payLive ? "grid-cols-4" : "grid-cols-3")}>
              {payLive ? <LogoTile src="/logo-mark.png" label={t("three.tallabyPay")} highlight /> : null}
              <LogoTile src="/marketing/home/logos/paymob.png" label="Paymob" />
              <LogoTile src="/marketing/home/logos/kashier.png" label="Kashier" />
              <LogoTile icon={Banknote} label={t("three.cod")} />
            </div>
            <span
              aria-hidden
              style={loop(0.6, 6)}
              className="mk-toast mt-1 flex items-center gap-2 rounded-xl bg-teal-900 px-3 py-2 text-[12px] text-white shadow-raise"
            >
              <span className="size-2 rounded-full bg-[#4ade80]" />
              <span className="font-bold">{t("three.toast")}</span>
              <span className="ms-auto">
                <Num>1,340</Num> {t("three.currency")}
              </span>
            </span>
          </StepCard>
        </ol>
      </Container>
    </Section>
  );
}

