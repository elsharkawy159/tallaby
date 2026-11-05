"use client";

import { useState, useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { BadgePercent, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DiscountRule, DiscountRuleType } from "@workspace/lib/orders/automatic-discounts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { formatMoney, isArabicPound, moneyNumberOptions, moneyParams, type MoneyUnit } from "@/lib/i18n/format";
import {
  Chip,
  Chips,
  EmptyState,
  Field,
  FieldRow,
  IconButton,
  NativeSelect,
  Row,
  Rows,
  SectionCard,
  SellerButton,
  StatusBadge,
  TextInput,
  Toggle,
} from "@/components/seller-ui";
import { ChipLink } from "../../orders/orders-ui";
import { CouponProductPicker } from "../../coupons/_components/coupon-product-picker";
import { deleteDiscountRule, saveDiscountRule, setDiscountRuleActive, type RuleResult } from "./discount-rules.server";
import { toAsciiDigits } from "@/components/form/form-ui";

const RULE_TYPES: DiscountRuleType[] = ["percent_off", "buy_x_get_y", "free_gift"];

type Draft = {
  id: string | null;
  name: string;
  ruleType: DiscountRuleType;
  scope: "all" | "categories";
  categoryIds: string[];
  discountPercent: string;
  buyQuantity: string;
  getQuantity: string;
  minSubtotal: string;
  giftProductIds: string[];
  startsAt: string;
  endsAt: string;
};

const EMPTY: Draft = {
  id: null,
  name: "",
  ruleType: "percent_off",
  scope: "all",
  categoryIds: [],
  discountPercent: "10",
  buyQuantity: "2",
  getQuantity: "1",
  minSubtotal: "500",
  giftProductIds: [],
  startsAt: "",
  endsAt: "",
};

/** `datetime-local` works in the seller's own time; the server keeps the instant. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
const toIso = (local: string): string | null => (local ? new Date(local).toISOString() : null);

function toDraft(rule: DiscountRule): Draft {
  return {
    id: rule.id,
    name: rule.name,
    ruleType: rule.ruleType,
    scope: rule.scope,
    categoryIds: rule.categoryIds,
    discountPercent: String(rule.discountPercent ?? 10),
    buyQuantity: String(rule.buyQuantity ?? 2),
    getQuantity: String(rule.getQuantity ?? 1),
    minSubtotal: String((rule.minSubtotalPiastres ?? 50000) / 100),
    giftProductIds: rule.giftProductIds,
    startsAt: toLocalInput(rule.startsAt),
    endsAt: toLocalInput(rule.endsAt),
  };
}

export function DiscountRulesView({
  money,
  stores,
  storeId,
  initial,
  categories,
}: {
  stores: { id: string; name: string }[];
  storeId: string | null;
  /** The store's currency: the order amount is in it. */
  money: MoneyUnit;
  initial: DiscountRule[];
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations("discountRules");
  const format = useFormatter();
  const locale = useLocale();
  const [rules, setRules] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toRemove, setToRemove] = useState<DiscountRule | null>(null);
  const [pending, startTransition] = useTransition();
  const [now] = useState(() => Date.now());

  const run = (action: () => Promise<RuleResult>, done?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setRules(result.rules);
        done?.();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  if (!storeId) return <EmptyState icon={BadgePercent} title={t("noStore")} />;

  const save = () => {
    if (!draft) return;
    run(
      () =>
        saveDiscountRule({
          storeId,
          id: draft.id,
          rule: {
            name: draft.name,
            ruleType: draft.ruleType,
            scope: draft.scope,
            categoryIds: draft.categoryIds,
            discountPercent: Number(draft.discountPercent),
            buyQuantity: Number(draft.buyQuantity),
            getQuantity: Number(draft.getQuantity),
            minSubtotal: Number(draft.minSubtotal),
            giftProductIds: draft.giftProductIds,
            startsAt: toIso(draft.startsAt),
            endsAt: toIso(draft.endsAt),
          },
        }),
      () => {
        setDraft(null);
        toast.success(t("saved"));
      },
    );
  };

  const summary = (rule: DiscountRule) =>
    rule.ruleType === "free_gift"
      ? t("summaryGift", { amount: isArabicPound(locale, money) ? formatMoney((rule.minSubtotalPiastres ?? 0) / 100, locale) : format.number((rule.minSubtotalPiastres ?? 0) / 100, moneyNumberOptions(money)), count: rule.giftProductIds.length })
      : rule.ruleType === "buy_x_get_y"
      ? rule.discountPercent === 100
        ? t("summaryBuyGetFree", { buy: rule.buyQuantity ?? 0, get: rule.getQuantity ?? 0 })
        : t("summaryBuyGetPercent", { buy: rule.buyQuantity ?? 0, get: rule.getQuantity ?? 0, percent: rule.discountPercent ?? 0 })
      : t("summaryPercent", { percent: rule.discountPercent ?? 0 });

  const when = (rule: DiscountRule) => {
    if (rule.endsAt && new Date(rule.endsAt).getTime() <= now) return { label: t("ended"), live: false };
    if (new Date(rule.startsAt).getTime() > now) return { label: t("startsOn", { date: format.dateTime(new Date(rule.startsAt), { dateStyle: "medium" }) }), live: false };
    if (rule.endsAt) return { label: t("endsOn", { date: format.dateTime(new Date(rule.endsAt), { dateStyle: "medium" }) }), live: true };
    return { label: t("noEnd"), live: true };
  };

  return (
    <>
      {stores.length > 1 && (
        <nav aria-label={t("chooseStore")} className="flex flex-wrap gap-1.5">
          {stores.map((store) => (
            <ChipLink key={store.id} href={`/marketing/discounts?store=${store.id}`} active={store.id === storeId}>
              {store.name}
            </ChipLink>
          ))}
        </nav>
      )}

      {draft && (
        <SectionCard icon={BadgePercent} title={draft.id ? t("edit") : t("add")}>
          <Field label={t("name")} htmlFor="rule-name" note={t("nameHint")}>
            <TextInput id="rule-name" maxLength={80} placeholder={t("namePlaceholder")} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </Field>

          <FieldRow>
            <Field label={t("type")} htmlFor="rule-type">
              <NativeSelect
                id="rule-type"
                value={draft.ruleType}
                onChange={(event) => {
                  const ruleType = event.target.value as DiscountRuleType;
                  setDraft({ ...draft, ruleType, discountPercent: ruleType === "buy_x_get_y" ? "100" : "10" });
                }}
              >
                {RULE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            {draft.ruleType === "free_gift" ? (
              <Field label={t("minSubtotal", moneyParams(locale, money))} htmlFor="rule-min" note={t("minSubtotalHint")}>
                <TextInput id="rule-min" inputMode="decimal" dir="ltr" value={draft.minSubtotal} onChange={(event) => setDraft({ ...draft, minSubtotal: toAsciiDigits(event.target.value) })} />
              </Field>
            ) : (
              <Field label={t(draft.ruleType === "buy_x_get_y" ? "getPercent" : "percent")} htmlFor="rule-percent">
                <TextInput id="rule-percent" inputMode="decimal" dir="ltr" value={draft.discountPercent} onChange={(event) => setDraft({ ...draft, discountPercent: toAsciiDigits(event.target.value) })} />
              </Field>
            )}
          </FieldRow>

          {draft.ruleType === "free_gift" && (
            <Field label={t("giftProducts")} note={t("giftProductsHint")}>
              <CouponProductPicker selectedIds={draft.giftProductIds} onChange={(giftProductIds) => setDraft({ ...draft, giftProductIds })} />
            </Field>
          )}

          {draft.ruleType === "buy_x_get_y" && (
            <FieldRow>
              <Field label={t("buyQuantity")} htmlFor="rule-buy">
                <TextInput id="rule-buy" inputMode="numeric" dir="ltr" value={draft.buyQuantity} onChange={(event) => setDraft({ ...draft, buyQuantity: toAsciiDigits(event.target.value) })} />
              </Field>
              <Field label={t("getQuantity")} htmlFor="rule-get">
                <TextInput id="rule-get" inputMode="numeric" dir="ltr" value={draft.getQuantity} onChange={(event) => setDraft({ ...draft, getQuantity: toAsciiDigits(event.target.value) })} />
              </Field>
            </FieldRow>
          )}

          {draft.ruleType !== "free_gift" && (
            <Field label={t("scope")} htmlFor="rule-scope">
              <NativeSelect
                id="rule-scope"
                value={draft.scope}
                onChange={(event) => setDraft({ ...draft, scope: event.target.value === "categories" ? "categories" : "all" })}
              >
                <option value="all">{t("scopeAll")}</option>
                <option value="categories">{t("scopeCategories")}</option>
              </NativeSelect>
              {draft.scope === "categories" &&
                (categories.length === 0 ? (
                  <p className="text-xs text-(--s-faint)">{t("noCategories")}</p>
                ) : (
                  <Chips>
                    {categories.map((category) => {
                      const on = draft.categoryIds.includes(category.id);
                      return (
                        <Chip
                          key={category.id}
                          pressed={on}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              categoryIds: on ? draft.categoryIds.filter((id) => id !== category.id) : [...draft.categoryIds, category.id],
                            })
                          }
                        >
                          {category.name}
                        </Chip>
                      );
                    })}
                  </Chips>
                ))}
            </Field>
          )}

          <FieldRow>
            <Field label={t("startsAt")} htmlFor="rule-start" note={t("startsHint")}>
              <TextInput id="rule-start" type="datetime-local" dir="ltr" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} />
            </Field>
            <Field label={t("endsAt")} htmlFor="rule-end" note={t("endsHint")}>
              <TextInput id="rule-end" type="datetime-local" dir="ltr" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} />
            </Field>
          </FieldRow>

          <p className="text-pretty text-xs text-(--s-faint)">{t("stackingNote")}</p>
          <div className="flex flex-wrap gap-2">
            <SellerButton type="button" disabled={pending} onClick={save}>
              {t("save")}
            </SellerButton>
            <SellerButton type="button" variant="outline" onClick={() => setDraft(null)}>
              {t("cancel")}
            </SellerButton>
          </div>
        </SectionCard>
      )}

      <SectionCard
        icon={BadgePercent}
        title={t("title")}
        action={
          !draft && rules.length > 0 ? (
            <SellerButton type="button" size="sm" onClick={() => setDraft(EMPTY)}>
              <Plus aria-hidden />
              {t("add")}
            </SellerButton>
          ) : undefined
        }
      >
        {rules.length === 0 ? (
          <EmptyState
            title={t("empty")}
            action={
              !draft ? (
                <SellerButton type="button" onClick={() => setDraft(EMPTY)}>
                  <Plus aria-hidden />
                  {t("add")}
                </SellerButton>
              ) : undefined
            }
          />
        ) : (
          <Rows>
            {rules.map((rule) => {
              const status = when(rule);
              return (
                <Row
                  key={rule.id}
                  className="flex-wrap"
                  title={rule.name}
                  description={
                    <>
                      {summary(rule)}
                      {rule.ruleType !== "free_gift" && <> · {rule.scope === "all" ? t("scopeAll") : t("scopeCategoriesCount", { count: rule.categoryIds.length })}</>}
                      <StatusBadge tone={status.live && rule.isActive ? "success" : "muted"} className="mt-1.5 flex w-fit">
                        {status.label}
                      </StatusBadge>
                    </>
                  }
                  end={
                    <>
                      <Toggle
                        aria-label={t("active")}
                        checked={rule.isActive}
                        disabled={pending}
                        onCheckedChange={(isActive) => run(() => setDiscountRuleActive({ storeId, id: rule.id, isActive }))}
                      />
                      <IconButton aria-label={t("edit")} onClick={() => setDraft(toDraft(rule))}>
                        <Pencil aria-hidden />
                      </IconButton>
                      <IconButton aria-label={t("remove")} disabled={pending} onClick={() => setToRemove(rule)}>
                        <Trash2 aria-hidden />
                      </IconButton>
                    </>
                  }
                />
              );
            })}
          </Rows>
        )}
      </SectionCard>

      <AlertDialog open={!!toRemove} onOpenChange={(open) => !open && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeTitle", { name: toRemove?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("removeBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                const id = toRemove?.id;
                if (id) run(() => deleteDiscountRule({ storeId, id }));
              }}
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
