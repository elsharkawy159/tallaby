"use client";

import * as React from "react";
import { Check, Handshake, ShoppingBag, Sparkles, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import { ChoiceGroup } from "@/components/marketing/site/choice-group.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ROOT_DOMAIN, slugify } from "@/lib/marketing/site.lib";
import { CONTACT_ROLES, type ContactRole } from "./contact.dto";
import { submitContactMessage } from "./contact.server";

const ROLE_ICONS: Record<ContactRole, React.ComponentType<{ className?: string }>> = {
  seller: Store,
  new: Sparkles,
  shopper: ShoppingBag,
  partner: Handshake,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fieldClass =
  "h-[50px] rounded-xl border-neutral-200 bg-white px-3.5 text-[15px] shadow-none focus-visible:border-teal-700 focus-visible:ring-[3px] focus-visible:ring-teal-700/12";

type Errors = Partial<Record<"name" | "email" | "message" | "form", string>>;

export function ContactForm() {
  const t = useTranslations("contact");
  const [role, setRole] = React.useState<ContactRole>("seller");
  const [topic, setTopic] = React.useState("0");
  const [errors, setErrors] = React.useState<Errors>({});
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  const topics = t.raw(`topics.${role}`) as string[];

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const storeLink = slugify(String(data.get("store") ?? ""));

    const next: Errors = {};
    if (!fullName) next.name = t("errName");
    if (!EMAIL.test(email)) next.email = t("errEmail");
    if (message.length < 10) next.message = t("errMessage");
    setErrors(next);
    if (Object.keys(next).length) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }

    startTransition(async () => {
      const result = await submitContactMessage({
        role,
        topic: topics[Number(topic)] ?? topics[0]!,
        fullName,
        email,
        message,
        storeLink: role === "seller" && storeLink ? storeLink : undefined,
      });
      if (result.ok) setSent(true);
      else setErrors({ form: result.error === "rateLimited" ? t("errRate") : t("errGeneric") });
    });
  };

  if (sent) {
    return (
      <div className="px-2.5 py-10 text-center">
        <span className="mx-auto mb-[18px] grid size-[72px] place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-[34px]" aria-hidden />
        </span>
        <h2 className="text-[26px] font-bold text-teal-900">{t("sent")}</h2>
        <p className="mt-2 mb-6 text-slate-ink">{t("sentBody")}</p>
        <CtaButton
          tone="outline"
          onClick={() => {
            setSent(false);
            setErrors({});
          }}
        >
          {t("again")}
        </CtaButton>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <h2 className="text-[26px] font-bold text-teal-900">{t("formTitle")}</h2>
      <p className="mt-1.5 mb-[26px] text-[15px] text-neutral-600">{t("formBody")}</p>

      <span className="mb-1.5 block text-sm font-semibold text-neutral-800">{t("iAm")}</span>
      <ToggleGroup
        type="single"
        value={role}
        onValueChange={(v) => {
          if (!v) return;
          setRole(v as ContactRole);
          setTopic("0");
        }}
        aria-label={t("iAm")}
        className="mb-6 grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {CONTACT_ROLES.map((r) => {
          const Icon = ROLE_ICONS[r];
          return (
            <ToggleGroupItem
              key={r}
              value={r}
              className="group h-auto flex-col gap-1.5 rounded-[14px]! border border-neutral-200 px-2.5 py-3.5 text-[13px] font-semibold whitespace-normal text-neutral-700 hover:bg-white data-[state=on]:border-teal-900 data-[state=on]:bg-teal-900 data-[state=on]:text-white"
            >
              <Icon className="size-[22px]! text-teal-500 group-data-[state=on]:text-amber-600" />
              {t(`who.${r}`)}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label={t("name")} error={errors.name}>
          <Input id="contact-name" name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} className={fieldClass} />
        </Field>
        <Field id="contact-email" label={t("emailLabel")} error={errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            className={fieldClass}
          />
        </Field>
      </div>

      {role === "seller" ? (
        <Field id="contact-store" label={t("storeLink")}>
          <div dir="ltr" className={cn("flex items-center border", fieldClass, "focus-within:border-teal-700 focus-within:ring-[3px] focus-within:ring-teal-700/12")}>
            <input id="contact-store" name="store" placeholder="yourbrand" className="min-w-0 flex-1 bg-transparent font-latin font-semibold outline-none" />
            <span className="font-latin text-neutral-500">.{ROOT_DOMAIN}</span>
          </div>
        </Field>
      ) : null}

      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-semibold text-neutral-800">{t("topic")}</span>
        <ChoiceGroup
          value={topic}
          onChange={setTopic}
          label={t("topic")}
          className="flex-wrap overflow-visible"
          options={topics.map((label, i) => ({ value: String(i), label }))}
        />
      </div>

      <Field id="contact-message" label={t("message")} error={errors.message}>
        <Textarea
          id="contact-message"
          name="message"
          placeholder={t("messagePlaceholder")}
          aria-invalid={Boolean(errors.message)}
          className={cn(fieldClass, "h-auto min-h-[130px] py-3 leading-[1.6]")}
        />
      </Field>

      {errors.form ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {errors.form}
        </p>
      ) : null}

      <CtaButton type="submit" size="lg" disabled={pending} className="mt-1.5 w-full rounded-[14px]">
        {pending ? t("sending") : t("send")}
      </CtaButton>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="mb-1.5 text-sm font-semibold text-neutral-800">
        {label}
      </Label>
      {children}
      <div role={error ? "alert" : undefined} className="mt-1 min-h-[18px] text-[12.5px] text-destructive">
        {error}
      </div>
    </div>
  );
}
