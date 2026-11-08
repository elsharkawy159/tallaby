import { z } from "zod";
import { invalidateStorefront } from "@workspace/cache/invalidate";
import { db, eq, sellers, sql } from "@workspace/db";
import { parseStoreSeo, readStoreSocialLinks } from "@workspace/lib/stores";
import { updateStoreSeo, updateStoreSettings, updateStoreSocialLinks } from "@workspace/lib/stores/server";
import { SOCIAL_PLATFORM_KEYS } from "@workspace/store-sections/social";
import { requireOwnedStore } from "../guards.server";
import { AgentError, type AgentTool, type Skill } from "../types";

/**
 * Settings & policies skill (spec §14.4): contact, one social link at a time,
 * SEO title and description, and the return policy. Every store write goes
 * through packages/lib (scoped by seller + store, strict schemas). The return
 * policy is account-wide (sellers.return_policy, shown on every store), and the
 * card says so.
 */

const POLICY_MAX = 5000;

const getInput = z.object({}).strict();
const contactInput = z
  .object({
    phone: z.string().trim().max(40).optional(),
    whatsapp: z.string().trim().max(40).optional(),
    email: z.string().trim().max(254).optional(),
  })
  .strict()
  .refine((v) => v.phone !== undefined || v.whatsapp !== undefined || v.email !== undefined, "nothing_to_change");
const socialInput = z
  .object({ platform: z.enum(SOCIAL_PLATFORM_KEYS), value: z.string().trim().min(1).max(300), enabled: z.boolean().default(true) })
  .strict();
const seoInput = z
  .object({ titleTemplate: z.string().trim().max(70).optional(), description: z.string().trim().max(160).optional() })
  .strict()
  .refine((v) => v.titleTemplate !== undefined || v.description !== undefined, "nothing_to_change");
const policyInput = z.object({ returnPolicy: z.string().trim().min(1).max(POLICY_MAX) }).strict();

const plain = (text: string) => text.replace(/<[^>]*>/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, POLICY_MAX);

const refused = (error: string): never => {
  if (error === "not_found") throw new AgentError("not_found");
  if (error === "store_read_only") throw new AgentError("store_read_only");
  throw new AgentError("invalid_input", `Refused: ${error}.`, { reason: error });
};

type Contact = { phone?: string; whatsapp?: string; email?: string };

export function settingsSkill(): Skill {
  const getSettings: AgentTool<z.infer<typeof getInput>> = {
    name: "get_store_settings",
    skill: "settings",
    description: "The store's contact details, social links, SEO and the account's return policy.",
    input: getInput,
    kind: "read",
    credits: 0,
    run: async (ctx) => {
      const store = await requireOwnedStore(ctx, { forWrite: false });
      const [seller] = await db.select({ returnPolicy: sellers.returnPolicy }).from(sellers).where(eq(sellers.id, ctx.sellerId)).limit(1);
      const contact = (store.contact ?? {}) as Contact;
      const seo = parseStoreSeo(store.seo);
      return {
        data: {
          contact: { phone: contact.phone ?? null, whatsapp: contact.whatsapp ?? null, email: contact.email ?? null },
          social: readStoreSocialLinks(store.contact).map((l) => ({ platform: l.platform, url: l.value, enabled: l.enabled })),
          seo: { titleTemplate: seo.titleTemplate, description: seo.description },
          returnPolicy: seller?.returnPolicy ? seller.returnPolicy.slice(0, 600) : null,
        },
      };
    },
  };

  const updateContact: AgentTool<z.infer<typeof contactInput>> = {
    name: "update_store_contact",
    skill: "settings",
    description: "Change the store's phone, WhatsApp or email. Only the fields given change.",
    input: contactInput,
    kind: "write",
    credits: 1,
    preview: async (_ctx, input) => ({
      title: "agent.card.settings.contact.title",
      lines: (["phone", "whatsapp", "email"] as const)
        .filter((field) => input[field] !== undefined)
        .map((field) => ({ key: `agent.card.settings.contact.${field}`, params: { value: input[field]! } })),
      risk: "low",
    }),
    run: async (ctx, input) => {
      const store = await requireOwnedStore(ctx, { forWrite: true });
      // updateStoreSettings replaces phone/whatsapp/email as a set: keep the ones not given.
      const current = (store.contact ?? {}) as Contact;
      const merged: Contact = {};
      for (const field of ["phone", "whatsapp", "email"] as const) {
        const value = input[field] ?? current[field];
        if (value) merged[field] = value;
      }
      const result = await updateStoreSettings(ctx.sellerId, ctx.storeId, { contact: merged });
      if (!result.success) return refused(result.error);
      return { data: { saved: true }, invalidation: invalidateStorefront([store.subdomain]), resultRef: { fields: Object.keys(input) } };
    },
  };

  const setSocial: AgentTool<z.infer<typeof socialInput>> = {
    name: "set_social_link",
    skill: "settings",
    description: "Add or change one social media link (a handle or a link on that platform).",
    input: socialInput,
    kind: "write",
    credits: 1,
    preview: async (_ctx, input) => ({
      title: "agent.card.settings.social.title",
      params: { platform: input.platform },
      lines: [{ key: "agent.card.settings.social.value", params: { value: input.value } }],
      risk: "low",
    }),
    run: async (ctx, input) => {
      const store = await requireOwnedStore(ctx, { forWrite: true });
      const links = readStoreSocialLinks(store.contact);
      const existing = links.find((l) => l.platform === input.platform);
      const next = existing
        ? links.map((l) => (l.platform === input.platform ? { ...l, value: input.value, enabled: input.enabled } : l))
        : [...links, { platform: input.platform, value: input.value, enabled: input.enabled, order: links.length }];
      const result = await updateStoreSocialLinks(ctx.sellerId, ctx.storeId, next);
      if (!result.success) return refused(result.error);
      return { data: { saved: true }, invalidation: invalidateStorefront([store.subdomain]), resultRef: { platform: input.platform } };
    },
  };

  const updateSeo: AgentTool<z.infer<typeof seoInput>> = {
    name: "update_store_seo",
    skill: "settings",
    description: "Change the store's search title template or description (what Google shows).",
    input: seoInput,
    kind: "write",
    credits: 1,
    preview: async (_ctx, input) => ({
      title: "agent.card.settings.seo.title",
      lines: [
        ...(input.titleTemplate !== undefined ? [{ key: "agent.card.settings.seo.titleTemplate", params: { value: input.titleTemplate } }] : []),
        ...(input.description !== undefined ? [{ key: "agent.card.settings.seo.description", params: { value: input.description } }] : []),
      ],
      risk: "low",
    }),
    run: async (ctx, input) => {
      const store = await requireOwnedStore(ctx, { forWrite: true });
      const current = parseStoreSeo(store.seo);
      const result = await updateStoreSeo(ctx.sellerId, ctx.storeId, {
        titleTemplate: input.titleTemplate ?? current.titleTemplate,
        description: input.description ?? current.description,
        shareImageUrl: current.shareImageUrl,
        indexing: current.indexing,
        googleSiteVerification: current.googleSiteVerification,
      });
      if (!result.success) return refused(result.error);
      return { data: { saved: true }, invalidation: invalidateStorefront([store.subdomain]), resultRef: { fields: Object.keys(input) } };
    },
  };

  const setReturnPolicy: AgentTool<z.infer<typeof policyInput>> = {
    name: "set_return_policy",
    skill: "settings",
    description: "Write the return and exchange policy. It is account-wide: every store of the seller shows it.",
    input: policyInput,
    kind: "write",
    credits: 1,
    preview: async (_ctx, input) => ({
      title: "agent.card.settings.returnPolicy.title",
      lines: [
        { key: "agent.card.settings.returnPolicy.accountWide" },
        { key: "agent.card.settings.returnPolicy.excerpt", params: { text: plain(input.returnPolicy).slice(0, 200) } },
      ],
      risk: "high",
    }),
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: true });
      const text = plain(input.returnPolicy);
      if (!text) throw new AgentError("invalid_input", "Empty policy.");
      const [previous] = await db.select({ returnPolicy: sellers.returnPolicy }).from(sellers).where(eq(sellers.id, ctx.sellerId)).limit(1);
      const updated = await db
        .update(sellers)
        .set({ returnPolicy: text, updatedAt: sql`now()` })
        .where(eq(sellers.id, ctx.sellerId))
        .returning({ subdomain: sellers.subdomain });
      if (!updated[0]) throw new AgentError("not_found");
      return {
        data: { saved: true },
        invalidation: invalidateStorefront(updated[0].subdomain ? [updated[0].subdomain] : []),
        // The previous text, so the change can be undone (spec §14.6).
        resultRef: { hadPolicy: Boolean(previous?.returnPolicy?.trim()), previousLength: previous?.returnPolicy?.length ?? 0 },
      };
    },
  };

  return {
    id: "settings",
    pages: ["/settings", "/stores/[storeId]/settings", "/stores/[storeId]/website/social", "/stores/[storeId]/website/domain"],
    rules: SETTINGS_RULES,
    tools: [getSettings, updateContact, setSocial, updateSeo, setReturnPolicy],
  };
}

const SETTINGS_RULES = `Skill: settings and policies. You update one store's contact details, social links, SEO and the return policy.
- Use only details the seller gave; never invent a phone, email or link.
- The return policy is account-wide: every store shows it. Say so.
- Policy text in the store's language, plain text, short paragraphs.
- Writes are proposals: the seller sees a card and confirms.`;
