/**
 * Tallaby's code templates ↔ Meta (docs/whatsapp.md §6 Templates). Backend
 * only, behind Admin's guard (through the internal API).
 *
 * - `submitWhatsAppTemplates`: creates each code template × language that Meta
 *   doesn't have yet (`POST /{WABA_ID}/message_templates`), and records the
 *   answer in whatsapp_templates. A template Meta already has is left alone:
 *   an approved template's text can't be changed in place (use a `_v2` name).
 * - `syncWhatsAppTemplates`: reads Meta's list and mirrors status, category,
 *   rejection reason and quality for the code templates.
 */
import { db, sql, whatsappTemplates } from "@workspace/db";
import { WHATSAPP_LOCALES, type WhatsAppLocale } from "./events.lib";
import { createMetaTemplate, getWhatsAppConfig, listMetaTemplates, type MetaTemplateInfo } from "./graph.server";
import { toMetaTemplateDefinition, WHATSAPP_TEMPLATE_LIST } from "./templates.lib";

const STATUSES = new Set(["pending", "approved", "rejected", "paused", "disabled"]);

/** Meta's template status in our vocabulary; anything else (`in_appeal`, …) reads as pending. */
export function normalizeTemplateStatus(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase();
  return STATUSES.has(s) ? s : "pending";
}

export type TemplateFailure = { ok: false; error: "not_configured" | "graph_error"; detail?: string | null };

export type TemplateSubmitResult =
  | { ok: true; submitted: number; skipped: number; failed: { name: string; language: WhatsAppLocale; error: string }[] }
  | TemplateFailure;

/** `updated`: code templates Meta has (mirrored); `skipped`: not at Meta yet. */
export type TemplateSyncResult = { ok: true; updated: number; skipped: number; total: number } | TemplateFailure;

async function upsertTemplateRow(row: {
  name: string;
  language: WhatsAppLocale;
  metaTemplateId: string | null;
  category: string | null;
  status: string;
  rejectedReason: string | null;
  quality: string | null;
}) {
  await db
    .insert(whatsappTemplates)
    .values({ ...row, syncedAt: sql`now()` })
    .onConflictDoUpdate({
      target: [whatsappTemplates.name, whatsappTemplates.language],
      set: {
        metaTemplateId: sql`coalesce(excluded.meta_template_id, ${whatsappTemplates.metaTemplateId})`,
        category: sql`coalesce(excluded.category, ${whatsappTemplates.category})`,
        status: row.status,
        rejectedReason: row.rejectedReason,
        quality: sql`coalesce(excluded.quality, ${whatsappTemplates.quality})`,
        syncedAt: sql`now()`,
      },
    });
}

function key(name: string, language: string) {
  return `${name}:${language}`;
}

async function metaTemplates(): Promise<{ ok: true; byKey: Map<string, MetaTemplateInfo> } | { ok: false; detail: string | null }> {
  const config = getWhatsAppConfig();
  if (!config) return { ok: false, detail: null };
  const listed = await listMetaTemplates(config);
  if (!listed.ok) return { ok: false, detail: listed.error.title };
  return { ok: true, byKey: new Map(listed.data.map((t) => [key(t.name, t.language), t])) };
}

/** Mirrors Meta's state of every code template × language. */
export async function syncWhatsAppTemplates(): Promise<TemplateSyncResult> {
  if (!getWhatsAppConfig()) return { ok: false, error: "not_configured" };
  const meta = await metaTemplates();
  if (!meta.ok) return { ok: false, error: "graph_error", detail: meta.detail };
  let updated = 0;
  let skipped = 0;
  for (const template of WHATSAPP_TEMPLATE_LIST) {
    for (const language of WHATSAPP_LOCALES) {
      const info = meta.byKey.get(key(template.name, language));
      if (!info) {
        skipped += 1;
        continue;
      }
      await upsertTemplateRow({
        name: template.name,
        language,
        metaTemplateId: info.id,
        category: info.category,
        status: normalizeTemplateStatus(info.status),
        rejectedReason: info.rejectedReason,
        quality: info.quality,
      });
      updated += 1;
    }
  }
  return { ok: true, updated, skipped, total: updated + skipped };
}

/** Creates the code templates Meta doesn't have yet. */
export async function submitWhatsAppTemplates(): Promise<TemplateSubmitResult> {
  const config = getWhatsAppConfig();
  if (!config) return { ok: false, error: "not_configured" };
  const meta = await metaTemplates();
  if (!meta.ok) return { ok: false, error: "graph_error", detail: meta.detail };
  let submitted = 0;
  let skipped = 0;
  const failed: { name: string; language: WhatsAppLocale; error: string }[] = [];
  for (const template of WHATSAPP_TEMPLATE_LIST) {
    for (const language of WHATSAPP_LOCALES) {
      if (meta.byKey.has(key(template.name, language))) {
        skipped += 1;
        continue;
      }
      const created = await createMetaTemplate(config, toMetaTemplateDefinition(template, language));
      if (!created.ok) {
        failed.push({ name: template.name, language, error: created.error.title ?? "graph_error" });
        continue;
      }
      await upsertTemplateRow({
        name: template.name,
        language,
        metaTemplateId: created.data.id,
        category: created.data.category,
        status: normalizeTemplateStatus(created.data.status),
        rejectedReason: null,
        quality: null,
      });
      submitted += 1;
    }
  }
  return { ok: true, submitted, skipped, failed };
}
