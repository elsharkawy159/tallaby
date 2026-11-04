"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DiscountRule, DiscountRuleType } from "@workspace/lib/orders/automatic-discounts";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { deleteDiscountRule, saveDiscountRule, setDiscountRuleActive, type RuleResult } from "./discount-rules.server";

const RULE_TYPES: DiscountRuleType[] = ["percent_off", "buy_x_get_y"];

type Draft = {
  id: string | null;
  name: string;
  ruleType: DiscountRuleType;
  scope: "all" | "categories";
  categoryIds: string[];
  discountPercent: string;
  buyQuantity: string;
  getQuantity: string;
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
    startsAt: toLocalInput(rule.startsAt),
    endsAt: toLocalInput(rule.endsAt),
  };
}

export function DiscountRulesView({
  stores,
  storeId,
  initial,
  categories,
}: {
  stores: { id: string; name: string }[];
  storeId: string | null;
  initial: DiscountRule[];
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations("discountRules");
  const format = useFormatter();
  const [rules, setRules] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
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

  if (!storeId) return <p className="text-sm text-muted-foreground">{t("noStore")}</p>;

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
    rule.ruleType === "buy_x_get_y"
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
    <div className="space-y-4">
      {stores.length > 1 && (
        <nav aria-label={t("chooseStore")} className="flex flex-wrap gap-2">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/marketing/discounts?store=${store.id}`}
              scroll={false}
              aria-current={store.id === storeId ? "page" : undefined}
              className={cn("rounded-full border px-3 py-1.5 text-sm", store.id === storeId && "border-primary bg-primary/10 font-medium")}
            >
              {store.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{t("title")}</h2>
          {!draft && (
            <Button type="button" onClick={() => setDraft(EMPTY)}>
              <Plus className="size-4" aria-hidden />
              {t("add")}
            </Button>
          )}
        </div>

        {rules.length === 0 && !draft && <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>}

        {rules.length > 0 && (
          <ul className="mt-3 divide-y">
            {rules.map((rule) => {
              const status = when(rule);
              return (
                <li key={rule.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {summary(rule)} · {rule.scope === "all" ? t("scopeAll") : t("scopeCategoriesCount", { count: rule.categoryIds.length })}
                    </p>
                    <Badge variant={status.live && rule.isActive ? "secondary" : "outline"} className="mt-1 font-normal">
                      {status.label}
                    </Badge>
                  </div>
                  <Switch
                    aria-label={t("active")}
                    checked={rule.isActive}
                    disabled={pending}
                    onCheckedChange={(isActive) => run(() => setDiscountRuleActive({ storeId, id: rule.id, isActive }))}
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => setDraft(toDraft(rule))}>
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={t("remove")} disabled={pending} onClick={() => run(() => deleteDiscountRule({ storeId, id: rule.id }))}>
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {draft && (
        <div className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-2 sm:p-5">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="rule-name">{t("name")}</Label>
            <Input id="rule-name" maxLength={80} placeholder={t("namePlaceholder")} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rule-type">{t("type")}</Label>
            <select
              id="rule-type"
              className="h-10 rounded-[10px] border bg-background px-2 text-sm"
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
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rule-percent">{t(draft.ruleType === "buy_x_get_y" ? "getPercent" : "percent")}</Label>
            <Input id="rule-percent" inputMode="decimal" dir="ltr" value={draft.discountPercent} onChange={(event) => setDraft({ ...draft, discountPercent: event.target.value })} />
          </div>

          {draft.ruleType === "buy_x_get_y" && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="rule-buy">{t("buyQuantity")}</Label>
                <Input id="rule-buy" inputMode="numeric" dir="ltr" value={draft.buyQuantity} onChange={(event) => setDraft({ ...draft, buyQuantity: event.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rule-get">{t("getQuantity")}</Label>
                <Input id="rule-get" inputMode="numeric" dir="ltr" value={draft.getQuantity} onChange={(event) => setDraft({ ...draft, getQuantity: event.target.value })} />
              </div>
            </>
          )}

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="rule-scope">{t("scope")}</Label>
            <select
              id="rule-scope"
              className="h-10 rounded-[10px] border bg-background px-2 text-sm"
              value={draft.scope}
              onChange={(event) => setDraft({ ...draft, scope: event.target.value === "categories" ? "categories" : "all" })}
            >
              <option value="all">{t("scopeAll")}</option>
              <option value="categories">{t("scopeCategories")}</option>
            </select>
            {draft.scope === "categories" &&
              (categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noCategories")}</p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const on = draft.categoryIds.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        aria-pressed={on}
                        className={cn("rounded-full border px-3 py-1.5 text-sm", on && "border-primary bg-primary/10 font-medium")}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            categoryIds: on ? draft.categoryIds.filter((id) => id !== category.id) : [...draft.categoryIds, category.id],
                          })
                        }
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              ))}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rule-start">{t("startsAt")}</Label>
            <Input id="rule-start" type="datetime-local" dir="ltr" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} />
            <p className="text-xs text-muted-foreground">{t("startsHint")}</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rule-end">{t("endsAt")}</Label>
            <Input id="rule-end" type="datetime-local" dir="ltr" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} />
            <p className="text-xs text-muted-foreground">{t("endsHint")}</p>
          </div>

          <p className="text-pretty text-xs text-muted-foreground sm:col-span-2">{t("stackingNote")}</p>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="button" disabled={pending} onClick={save}>
              {t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
