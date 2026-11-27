"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, MessageCircle } from "lucide-react";

import { SocialIcon } from "@workspace/store-sections/social-icon";
import {
  WHATSAPP_BUTTON_DEVICES,
  WHATSAPP_BUTTON_LABEL_MAX,
  WHATSAPP_BUTTON_MESSAGE_MAX,
  WHATSAPP_BUTTON_OFFSET,
  WHATSAPP_BUTTON_POSITIONS,
  WHATSAPP_BUTTON_SIZES,
  WHATSAPP_BUTTON_SIZE_PX,
  cleanWhatsAppButtonPhone,
  parseStoreWhatsAppButton,
  type StoreWhatsAppButtonSettings as Settings,
} from "@workspace/lib/stores/whatsapp-button";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Field,
  Note,
  OptionCard,
  OptionCards,
  SaveBar,
  SectionCard,
  Segmented,
  SellerCard,
  StatusBadge,
  Tag,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveStoreWhatsAppButton, setWhatsAppButtonInstalled } from "./whatsapp-button.server";

type NumberMode = "store" | "custom";
type PreviewDevice = "desktop" | "mobile";

/** The form's state: offsets stay text while typed; the server clamps them again. */
type Draft = Omit<Settings, "offsetDesktop" | "offsetMobile"> & { offsetDesktop: string; offsetMobile: string };

function toDraft(settings: Settings): Draft {
  return { ...settings, offsetDesktop: String(settings.offsetDesktop), offsetMobile: String(settings.offsetMobile) };
}

/**
 * Store › Apps › WhatsApp button (owner, 2026-11-27). The install switch, then
 * the button's number, message, label, side, devices, size and distance from
 * the bottom, with a live desktop / phone preview.
 */
export function WhatsAppButtonApp({
  storeId,
  installed,
  storeNumber,
  initial,
  readOnly,
}: {
  storeId: string;
  installed: boolean;
  /** The store's contact WhatsApp (else phone), as people read it; null when it has none. */
  storeNumber: string | null;
  initial: Settings;
  readOnly: boolean;
}) {
  const t = useTranslations("whatsappButtonApp");
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [mode, setMode] = useState<NumberMode>(initial.phone ? "custom" : "store");
  const [customPhone, setCustomPhone] = useState(initial.phone ?? "");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [isSaving, startSaving] = useTransition();
  const [isInstalling, startInstalling] = useTransition();

  const customValid = cleanWhatsAppButtonPhone(customPhone);
  const phone = mode === "custom" ? customValid : null;
  // What a save sends (and what the preview shows), cleaned like the server does.
  const next = parseStoreWhatsAppButton({ whatsappButton: { ...draft, phone } });
  const hasNumber = mode === "custom" ? Boolean(customValid) : Boolean(storeNumber);
  const invalidCustom = mode === "custom" && !customValid;
  const dirty = JSON.stringify(next) !== JSON.stringify(saved) || invalidCustom;
  const disabled = readOnly || isSaving;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const reset = (settings: Settings) => {
    setDraft(toDraft(settings));
    setMode(settings.phone ? "custom" : "store");
    setCustomPhone(settings.phone ?? "");
  };

  const save = () => {
    if (invalidCustom) {
      toast.error(t("errors.invalidPhone"));
      return;
    }
    startSaving(async () => {
      const result = await saveStoreWhatsAppButton(storeId, next);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setSaved(result.settings);
      reset(result.settings);
      toast.success(t("saved"));
    });
  };

  const toggleApp = (on: boolean) =>
    startInstalling(async () => {
      const result = await setWhatsAppButtonInstalled(storeId, on);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(on ? t("install.installed") : t("install.removed"));
      router.refresh();
    });

  const contactHref = `/stores/${storeId}/settings#contact`;

  return (
    <div className="flex flex-col gap-5">
      <SellerCard className="flex flex-wrap items-center gap-4 px-6 py-5 max-[720px]:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] text-(--s-ink)">{t("install.title")}</b>
            {installed ? <StatusBadge tone="success">{t("install.on")}</StatusBadge> : <Tag>{t("install.off")}</Tag>}
          </div>
          <p className="mt-1 text-pretty text-[13px] text-(--s-subtle)">{installed ? t("install.onBody") : t("install.offBody")}</p>
        </div>
        <Toggle
          checked={installed}
          disabled={isInstalling || readOnly}
          onCheckedChange={toggleApp}
          label={<span className="sr-only">{t("install.title")}</span>}
        />
        {isInstalling && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />}
      </SellerCard>

      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <SectionCard icon={MessageCircle} title={t("title")} description={t("description")}>
        {!hasNumber && mode === "store" && (
          <Note tone="amber">
            {t("noNumber")} <Link href={contactHref}>{t("noNumberLink")}</Link>
          </Note>
        )}

        <div className="grid grid-cols-2 items-start gap-5 max-[860px]:grid-cols-1">
          <div className="flex flex-col gap-5">
            <Field label={t("number.label")}>
              <OptionCards className="grid-cols-1">
                <OptionCard
                  name="wa-button-number"
                  value="store"
                  checked={mode === "store"}
                  disabled={disabled}
                  onChange={() => setMode("store")}
                  title={t("number.store")}
                  description={storeNumber ? <span dir="ltr">{storeNumber}</span> : t("number.storeMissing")}
                />
                <OptionCard
                  name="wa-button-number"
                  value="custom"
                  checked={mode === "custom"}
                  disabled={disabled}
                  onChange={() => setMode("custom")}
                  title={t("number.custom")}
                  description={t("number.customHint")}
                />
              </OptionCards>
            </Field>

            {mode === "custom" && (
              <Field
                label={t("number.customLabel")}
                htmlFor="wa-button-phone"
                error={customPhone.trim() && !customValid ? t("errors.invalidPhone") : undefined}
              >
                <TextInput
                  id="wa-button-phone"
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="off"
                  maxLength={40}
                  placeholder="01012345678"
                  value={customPhone}
                  disabled={disabled}
                  aria-invalid={Boolean(customPhone.trim()) && !customValid}
                  onChange={(event) => setCustomPhone(event.target.value)}
                />
              </Field>
            )}

            <Field
              label={t("message.label")}
              htmlFor="wa-button-message"
              hint={`${draft.message.length}/${WHATSAPP_BUTTON_MESSAGE_MAX}`}
              note={t("message.note")}
            >
              <TextArea
                id="wa-button-message"
                rows={3}
                maxLength={WHATSAPP_BUTTON_MESSAGE_MAX}
                placeholder={t("message.placeholder")}
                value={draft.message}
                disabled={disabled}
                onChange={(event) => set("message", event.target.value)}
              />
            </Field>

            <Field
              label={t("label.label")}
              htmlFor="wa-button-label"
              hint={`${draft.label.length}/${WHATSAPP_BUTTON_LABEL_MAX}`}
              note={t("label.note")}
            >
              <TextInput
                id="wa-button-label"
                maxLength={WHATSAPP_BUTTON_LABEL_MAX}
                placeholder={t("label.placeholder")}
                value={draft.label}
                disabled={disabled}
                onChange={(event) => set("label", event.target.value)}
              />
            </Field>

            <Field label={t("position.label")}>
              <OptionCards>
                {WHATSAPP_BUTTON_POSITIONS.map((value) => (
                  <OptionCard
                    key={value}
                    name="wa-button-position"
                    value={value}
                    checked={draft.position === value}
                    disabled={disabled}
                    onChange={() => set("position", value)}
                    title={t(`position.${value}`)}
                  />
                ))}
              </OptionCards>
            </Field>

            <Field label={t("devices.label")}>
              <OptionCards>
                {WHATSAPP_BUTTON_DEVICES.map((value) => (
                  <OptionCard
                    key={value}
                    name="wa-button-devices"
                    value={value}
                    checked={draft.devices === value}
                    disabled={disabled}
                    onChange={() => set("devices", value)}
                    title={t(`devices.${value}`)}
                  />
                ))}
              </OptionCards>
            </Field>

            <Field label={t("size.label")}>
              <Segmented
                label={t("size.label")}
                value={draft.size}
                onChange={(value) => !disabled && set("size", value)}
                options={WHATSAPP_BUTTON_SIZES.map((value) => ({ value, label: t(`size.${value}`) }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
              {(["offsetDesktop", "offsetMobile"] as const).map((key) => (
                <Field key={key} label={t(`offset.${key}`)} htmlFor={`wa-button-${key}`} note={t("offset.note")}>
                  <TextInput
                    id={`wa-button-${key}`}
                    type="number"
                    inputMode="numeric"
                    min={WHATSAPP_BUTTON_OFFSET.min}
                    max={WHATSAPP_BUTTON_OFFSET.max}
                    step={1}
                    dir="ltr"
                    value={draft[key]}
                    disabled={disabled}
                    onChange={(event) => set(key, event.target.value)}
                    className="max-w-[140px] font-montserrat"
                  />
                </Field>
              ))}
            </div>

            <Toggle
              id="wa-button-cart"
              checked={draft.showOnCart}
              disabled={disabled}
              onCheckedChange={(value) => set("showOnCart", value)}
              label={
                <span className="flex flex-col">
                  <b className="text-[13.5px] text-(--s-ink)">{t("showOnCart.label")}</b>
                  <small className="text-xs text-(--s-subtle)">{t("showOnCart.note")}</small>
                </span>
              }
            />
          </div>

          <div className="flex flex-col gap-2 min-[861px]:sticky min-[861px]:top-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13.5px] font-bold text-(--s-text)">{t("preview.title")}</span>
              <Segmented
                label={t("preview.title")}
                value={device}
                onChange={setDevice}
                options={[
                  { value: "desktop", label: t("preview.desktop") },
                  { value: "mobile", label: t("preview.mobile") },
                ]}
              />
            </div>
            <ButtonPreview settings={next} device={device} />
            <p className="text-pretty text-xs text-(--s-faint)">
              {!installed
                ? t("preview.notInstalled")
                : (device === "desktop" && next.devices === "mobile") || (device === "mobile" && next.devices === "desktop")
                  ? t("preview.hiddenHere")
                  : t("preview.hint")}
            </p>
          </div>
        </div>

        {!readOnly && <SaveBar dirty={dirty} saving={isSaving} onSave={save} onDiscard={() => reset(saved)} />}
      </SectionCard>
    </div>
  );
}

/** A mini desktop window or phone with the button at the chosen side, size, distance and label (scaled down). */
function ButtonPreview({ settings, device }: { settings: Settings; device: PreviewDevice }) {
  const mobile = device === "mobile";
  const scale = mobile ? 0.6 : 0.5;
  const size = WHATSAPP_BUTTON_SIZE_PX[settings.size] * scale;
  const hidden = (mobile && settings.devices === "desktop") || (!mobile && settings.devices === "mobile");
  const label = !mobile && settings.label.trim();
  const navHeight = 64 * scale;
  const side = (mobile ? 16 : 24) * scale;
  const bottom = (mobile ? settings.offsetMobile : settings.offsetDesktop) * scale;

  return (
    <div className={cn("flex justify-center rounded-[20px] border border-(--s-line) bg-(--s-tint) p-4", mobile ? "py-5" : "")}>
      <div
        aria-hidden
        className={cn(
          "relative overflow-hidden border border-(--s-line) bg-(--s-surface)",
          mobile ? "h-[340px] w-[180px] rounded-[26px] border-[5px] border-(--s-field-strong)" : "h-[230px] w-full rounded-2xl",
        )}
      >
        {!mobile && (
          <div className="flex h-7 items-center gap-1.5 border-b border-(--s-line-soft) px-3">
            <i className="size-2 rounded-full bg-(--s-field-strong)" />
            <i className="size-2 rounded-full bg-(--s-field-strong)" />
            <i className="size-2 rounded-full bg-(--s-field-strong)" />
          </div>
        )}
        <div className="flex flex-col gap-2 p-3">
          <i className="h-2.5 w-2/5 rounded-full bg-(--s-field-strong)" />
          <i className="h-2 w-4/5 rounded-full bg-(--s-field)" />
          <div className={cn("mt-1 grid gap-2", mobile ? "grid-cols-2" : "grid-cols-4")}>
            {Array.from({ length: 4 }, (_, i) => (
              <i key={i} className="aspect-square rounded-lg bg-(--s-tint)" />
            ))}
          </div>
        </div>
        {mobile && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-(--s-line) bg-(--s-surface)" style={{ height: navHeight }}>
            {Array.from({ length: 4 }, (_, i) => (
              <i key={i} className="size-3 rounded-full bg-(--s-field-strong)" />
            ))}
          </div>
        )}
        {!hidden && (
          <span
            className="absolute inline-flex items-center justify-center gap-1 rounded-full bg-[#25D366] font-bold text-white shadow-[0_4px_12px_rgb(0_0_0/0.18)] transition-all duration-200 motion-reduce:transition-none"
            style={{
              height: size,
              minWidth: size,
              bottom,
              ...(settings.position === "right" ? { right: side } : { left: side }),
              paddingInline: label ? `${size * 0.25}px ${size * 0.4}px` : 0,
              fontSize: 11,
            }}
          >
            <span className="inline-flex shrink-0 [&_svg]:size-full" style={{ width: size * 0.5, height: size * 0.5 }}>
              <SocialIcon platform="whatsapp" />
            </span>
            {label && <span className="whitespace-nowrap">{label}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
