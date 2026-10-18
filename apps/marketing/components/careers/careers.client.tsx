"use client";

import * as React from "react";
import { Clock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { cn } from "@workspace/ui/lib/utils";
import { ChoiceGroup } from "@/components/site/choice-group.client";
import { CtaButton } from "@/components/site/cta-button";
import { ForwardChevron } from "@/components/site/direction-icons";
import { CONTACT } from "@/lib/site.lib";

const DEPARTMENTS = ["all", "eng", "des", "gro", "ss"] as const;
type Department = (typeof DEPARTMENTS)[number];

type Role = {
  id: string;
  dept: Exclude<Department, "all">;
  title: string;
  location: string;
  type: string;
  about: string;
  needs: string[];
};

/** "Come help us [build]" — the verb rotates. */
export function RotatingWord() {
  const t = useTranslations("careers");
  const words = t.raw("words") as string[];
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 2400);
    return () => window.clearInterval(id);
  }, [words.length]);

  return (
    <span className="inline-grid h-[1.22em] overflow-hidden align-bottom en:h-[1.05em]">
      {words.map((w, i) => (
        <span
          key={w}
          aria-hidden={i !== index}
          className={cn(
            "[grid-area:1/1] text-amber-600 transition-transform duration-[600ms] ease-[cubic-bezier(.2,.6,.2,1)]",
            i === index ? "translate-y-0" : i === (index - 1 + words.length) % words.length ? "-translate-y-[110%]" : "translate-y-[110%] transition-none",
          )}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

/** Open roles with department chips; each role expands to details and "Apply". */
export function RolesList() {
  const t = useTranslations("careers");
  const roles = t.raw("roles") as Role[];
  const [dept, setDept] = React.useState<Department>("all");
  const visible = roles.filter((r) => dept === "all" || r.dept === dept);

  // No openings: just the heading and an invitation to write in.
  if (!roles.length) {
    return (
      <>
        <div className="mb-6 max-w-[680px]">
          <span className="mb-2.5 block text-[13px] font-bold text-amber-700 en:text-xs en:tracking-[0.1em] en:uppercase">{t("rolesKicker")}</span>
          <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.25] font-extrabold text-teal-900 en:leading-[1.12] en:tracking-[-0.02em]">{t("rolesTitle")}</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <b className="mb-1.5 block text-lg text-teal-900">{t("noneTitle")}</b>
          <p className="mx-auto mb-5 max-w-[520px] text-slate-ink">{t("noneBody")}</p>
          <CtaButton asChild tone="teal" size="sm">
            <a href={`mailto:${CONTACT.email}?subject=Careers`}>{t("emailUs")}</a>
          </CtaButton>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-[680px]">
          <span className="mb-2.5 block text-[13px] font-bold text-amber-700 en:text-xs en:tracking-[0.1em] en:uppercase">{t("rolesKicker")}</span>
          <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.25] font-extrabold text-teal-900 en:leading-[1.12] en:tracking-[-0.02em]">{t("rolesTitle")}</h2>
        </div>
        <ChoiceGroup
          value={dept}
          onChange={setDept}
          label={t("rolesTitle")}
          options={DEPARTMENTS.map((d) => ({
            value: d,
            label: (
              <>
                {t(`departments.${d}`)}
                <span className="font-latin opacity-60">{d === "all" ? roles.length : roles.filter((r) => r.dept === d).length}</span>
              </>
            ),
          }))}
        />
      </div>

      {visible.length ? (
        <Accordion type="multiple" key={dept}>
          {visible.map((role) => (
            <AccordionItem key={role.id} value={role.id} className="border-t border-neutral-200 last:border-b! [&_[data-slot=accordion-content]]:p-0">
              <AccordionTrigger className="group grid grid-cols-[1fr_40px] items-center gap-4 rounded-none bg-transparent px-1 py-6! text-start hover:bg-neutral-50 hover:no-underline md:grid-cols-[minmax(0,1fr)_180px_160px_40px] [&>svg:last-child]:hidden">
                <div>
                  <span className="block text-[19px] font-bold text-teal-900">{role.title}</span>
                  <span className="text-[13px] font-semibold text-amber-700">{t(`departments.${role.dept}`)}</span>
                </div>
                <span className="hidden items-center gap-1.5 text-[13px] font-normal text-neutral-600 md:flex">
                  <MapPin className="size-[15px]" aria-hidden />
                  {role.location}
                </span>
                <span className="hidden items-center gap-1.5 text-[13px] font-normal text-neutral-600 md:flex">
                  <Clock className="size-[15px]" aria-hidden />
                  {role.type}
                </span>
                <span className="grid size-10 place-items-center rounded-full bg-teal-50 text-teal-700 transition-[transform,background-color] duration-200 group-data-[state=open]:bg-amber-600 group-data-[state=open]:text-teal-900 ltr:group-data-[state=open]:rotate-90 rtl:group-data-[state=open]:-rotate-90">
                  <ForwardChevron className="size-[18px]" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="grid gap-8 px-1 pt-0 pb-7 text-[15px] text-slate-ink md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <h4 className="mb-2 text-sm font-bold text-teal-900">{t("theRole")}</h4>
                  <p>{role.about}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold text-teal-900">{t("youBring")}</h4>
                  <ul className="m-0 grid list-disc gap-1 ps-[18px]">
                    {role.needs.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
                <CtaButton asChild size="sm" className="self-start">
                  <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(role.title)}`}>{t("apply")}</a>
                </CtaButton>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-600">{t("empty")}</div>
      )}
    </>
  );
}
