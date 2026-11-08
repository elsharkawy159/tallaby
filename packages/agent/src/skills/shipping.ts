import { z } from "zod";
import { placeLabel } from "@workspace/lib/places";
import { MAX_ZONES_PER_STORE, SHIPPING_TEMPLATES, templateZones, type ShippingTemplate } from "@workspace/lib/shipping/store-zones";
import { applyStoreShippingTemplate, getStoreShipping, saveStoreShippingZone } from "@workspace/lib/stores/server";
import { requireOwnedStore } from "../guards.server";
import { matchPlaceNames } from "../places.lib";
import { AgentError, type AgentContext, type AgentTool, type Skill } from "../types";

/**
 * Shipping skill (spec §14.4): list zones, start from a template, add or edit
 * one zone from place names. Place names are matched to keys in code
 * (`matchPlaceNames`), never by the model. Writes go through
 * `saveStoreShippingZone` / `applyStoreShippingTemplate`, which lock the
 * store row by (seller, store) and check overlaps.
 */

const money = (max: number) => z.number().min(0).max(max);

const listInput = z.object({}).strict();
const templateInput = z
  .object({
    template: z.enum(SHIPPING_TEMPLATES),
    /** egypt_flat only: one price for all Egypt, EGP. */
    price: money(10_000).optional(),
    /** Replace the store's existing zones. */
    replace: z.boolean().default(false),
  })
  .strict();
const zoneInput = z
  .object({
    /** An existing zone id from list_shipping_zones to edit it; omit to add a zone. */
    zoneId: z.string().uuid().optional(),
    nameAr: z.string().trim().min(1).max(60),
    nameEn: z.string().trim().max(60).optional(),
    /** Place names as the seller wrote them (governorates or cities), e.g. ["القاهرة", "Giza"]. */
    placeNames: z.array(z.string().trim().min(1).max(80)).min(1).max(40),
    price: money(10_000),
    freeOver: money(1_000_000).nullable().default(null),
    deliveryDaysMin: z.number().int().min(0).max(60).default(1),
    deliveryDaysMax: z.number().int().min(0).max(60).default(3),
    codEnabled: z.boolean().default(true),
  })
  .strict();

type TemplateInput = z.infer<typeof templateInput>;
type ZoneInput = z.infer<typeof zoneInput>;

const egp = (n: number) => n.toFixed(2);

const TEMPLATE_NAMES: Record<Exclude<ShippingTemplate, "tallaby_rates">, { nameAr: string; nameEn: string }> = {
  egypt_flat: { nameAr: "كل مصر", nameEn: "All Egypt" },
  cairo_giza: { nameAr: "القاهرة والجيزة", nameEn: "Cairo and Giza" },
};

function templateGroups(input: TemplateInput) {
  const groups = templateZones(input.template, { price: input.price });
  if (groups.length === 0) throw new AgentError("invalid_input", "This template needs a price.");
  const names = groups.map((_, i) =>
    input.template === "tallaby_rates" ? { nameAr: `منطقة ${i + 1}`, nameEn: `Zone ${i + 1}` } : TEMPLATE_NAMES[input.template],
  );
  return { groups, names };
}

function zonePlaces(input: ZoneInput) {
  const match = matchPlaceNames(input.placeNames);
  if (match.keys.length === 0) throw new AgentError("invalid_input", "No place name matched.", { unmatched: match.unmatched });
  return match;
}

const failure = (error: string): never => {
  if (error === "not_found") throw new AgentError("not_found", "Store or zone not found.");
  if (error === "store_read_only") throw new AgentError("store_read_only");
  throw new AgentError("tool_failed", `Shipping change refused: ${error}.`, { reason: error });
};

const label = (ctx: AgentContext, key: string) => placeLabel(key, ctx.locale);

export function shippingSkill(): Skill {
  const listZones: AgentTool<z.infer<typeof listInput>> = {
    name: "list_shipping_zones",
    skill: "shipping",
    description: "The store's delivery zones with places, price and days.",
    input: listInput,
    kind: "read",
    credits: 0,
    run: async (ctx) => {
      const shipping = await getStoreShipping(ctx.sellerId, ctx.storeId);
      if (!shipping) throw new AgentError("not_found", "Store not found.");
      return {
        data: {
          freeShippingOver: shipping.settings.freeShippingOver,
          zones: shipping.zones.map((zone) => ({
            id: zone.id,
            name: ctx.locale === "ar" ? zone.nameAr : (zone.nameEn ?? zone.nameAr),
            places: zone.places.map((key) => label(ctx, key)),
            price: zone.price,
            freeOver: zone.freeOver,
            days: [zone.deliveryDaysMin, zone.deliveryDaysMax],
            enabled: zone.enabled,
          })),
        },
      };
    },
  };

  const applyTemplate: AgentTool<TemplateInput> = {
    name: "apply_shipping_template",
    skill: "shipping",
    description: "Start from a ready setup: tallaby_rates (Tallaby's prices by governorate), egypt_flat (one price), cairo_giza.",
    input: templateInput,
    kind: "write",
    credits: 1,
    preview: async (ctx, input) => {
      const { groups, names } = templateGroups(input);
      const existing = (await getStoreShipping(ctx.sellerId, ctx.storeId))?.zones.length ?? 0;
      return {
        title: "agent.card.shipping.template.title",
        params: { count: groups.length },
        lines: [
          ...groups.slice(0, 8).map((group, i) => ({
            key: "agent.card.shipping.zoneLine",
            params: {
              name: ctx.locale === "ar" ? names[i]!.nameAr : names[i]!.nameEn,
              places: group.places.slice(0, 6).map((key) => label(ctx, key)).join("، "),
              price: egp(group.price),
            },
          })),
          ...(existing > 0 && input.replace ? [{ key: "agent.card.shipping.replaces", params: { count: existing } }] : []),
        ],
        risk: existing > 0 && input.replace ? "high" : "low",
      };
    },
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: true });
      const { names } = templateGroups(input);
      const result = await applyStoreShippingTemplate(ctx.sellerId, ctx.userId ?? ctx.sellerId, ctx.storeId, {
        template: input.template,
        names,
        ...(input.price !== undefined && { price: input.price }),
        replace: input.replace,
      });
      if (!result.success) return failure(result.error);
      return { data: { zones: result.data.length }, resultRef: { template: input.template, zones: result.data.map((z) => z.id) } };
    },
  };

  const saveZone: AgentTool<ZoneInput> = {
    name: "save_shipping_zone",
    skill: "shipping",
    description: "Add a delivery zone (or edit one by zoneId) from place names, a price in EGP and delivery days.",
    input: zoneInput,
    kind: "write",
    credits: 1,
    preview: async (ctx, input) => {
      const match = zonePlaces(input);
      return {
        title: input.zoneId ? "agent.card.shipping.editZone.title" : "agent.card.shipping.addZone.title",
        params: { name: ctx.locale === "ar" ? input.nameAr : (input.nameEn ?? input.nameAr) },
        lines: [
          { key: "agent.card.shipping.places", params: { places: match.keys.map((key) => label(ctx, key)).join("، ") } },
          { key: "agent.card.shipping.price", params: { price: egp(input.price) } },
          { key: "agent.card.shipping.days", params: { min: input.deliveryDaysMin, max: input.deliveryDaysMax } },
          ...(input.freeOver !== null ? [{ key: "agent.card.shipping.freeOver", params: { amount: egp(input.freeOver) } }] : []),
          ...(match.unmatched.length ? [{ key: "agent.card.shipping.unmatched", params: { names: match.unmatched.join("، ") } }] : []),
        ],
        risk: input.zoneId ? "high" : "low",
      };
    },
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: true });
      const { keys } = zonePlaces(input);
      const result = await saveStoreShippingZone(ctx.sellerId, ctx.userId ?? ctx.sellerId, ctx.storeId, input.zoneId ?? null, {
        nameAr: input.nameAr,
        ...(input.nameEn && { nameEn: input.nameEn }),
        places: keys,
        price: input.price,
        freeOver: input.freeOver,
        deliveryDaysMin: input.deliveryDaysMin,
        deliveryDaysMax: Math.max(input.deliveryDaysMin, input.deliveryDaysMax),
        codEnabled: input.codEnabled,
        enabled: true,
      });
      if (!result.success) return failure(result.error);
      return { data: { zoneId: result.data.id }, resultRef: { zoneId: result.data.id, places: keys } };
    },
  };

  return {
    id: "shipping",
    pages: ["/stores/[storeId]/shipping"],
    rules: SHIPPING_RULES,
    tools: [listZones, applyTemplate, saveZone],
  };
}

const SHIPPING_RULES = `Skill: shipping. You set up delivery zones for one store in Egypt.
- One zone per group of places with the same price. At most ${MAX_ZONES_PER_STORE} zones.
- placeNames: names exactly as the seller wrote them; the code matches them. Never invent a place, price or delivery time.
- "Free" is price 0. freeOver only when the seller says free above an amount.
- Call list_shipping_zones before editing; use its zone ids.
- Writes are proposals: the seller sees a card and confirms.`;
