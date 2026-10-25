/**
 * Admin template studio (spec 2026-10-20-admin-website-builder §5.4, Task 14):
 * create, duplicate, draft, publish, restore and soft-delete templates
 * (`templates` / `template_versions`, drafts and meta from 0087).
 *
 * Every write re-checks the actor (`assertAdminActor`: admin / super_admin,
 * never a moderator) inside its transaction; audited writes add one
 * `admin_audit_log` row (target_type 'template', seller_id NULL) in the same
 * transaction. Draft saves are not audited. Reasons are 10-500 characters.
 *
 * CACHE: this package does not depend on @workspace/cache, so these functions
 * do NOT invalidate anything. Every caller (the admin actions) must call
 * `invalidateTemplateCatalog()` after a successful write other than a draft
 * save.
 *
 * Rules: a new or duplicated template starts inactive (`is_active = false`);
 * publishing never changes `is_active` (activation stays the Templates page
 * toggle, `updateTemplateByAdmin`). The default template cannot be deleted.
 * Deleting is soft (`deleted_at`, `is_active = false`); `template_installs`
 * rows stay, so "Undo template change" keeps working for stores that used it.
 * A deleted key stays taken (unique constraint).
 */
import { and, db, desc, eq, isNull, max, sql, templateVersions, templates } from "@workspace/db";
import { CURRENT_SITE_CONFIG_VERSION, type SiteConfig } from "@workspace/store-sections";
import { DEFAULT_TEMPLATE, resolveTemplateMeta, templateMeta, type TemplateMeta } from "@workspace/store-sections/templates";
import { compactTemplateForStorage, expandTemplateConfig } from "../store-sites/template-refs.server";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import type { AdminAuditAction } from "./admin.lib";
import { libraryReason } from "./library-sections-admin.lib";
import {
  blankTemplateConfig,
  prepareTemplateConfig,
  publishedTemplateMeta,
  studioPageNames,
  templateCreateSchema,
  templateKeySchema,
  templatePageNamesFor,
  withDraftPageNames,
  type TemplatePageNames,
} from "./templates-studio-admin.lib";

export {
  blankTemplateConfig,
  prepareTemplateConfig,
  publishedPageNames,
  templateCreateSchema,
  templateKeySchema,
  type TemplateCreateInput,
  type TemplatePageNames,
} from "./templates-studio-admin.lib";

export type TemplateStudioError =
  | "not_admin"
  | "invalid_input"
  | "invalid_reason"
  | "not_found"
  | "invalid_config"
  | "version_conflict"
  | "template_key_taken"
  | "default_template"
  | "no_change";

export type TemplateStudioResult<T> = { success: true; data: T } | { success: false; error: TemplateStudioError };

const TARGET_TYPE = "template";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class Outcome extends Error {
  constructor(readonly error: TemplateStudioError) {
    super(error);
  }
}

const isUniqueViolation = (error: unknown) => {
  const code = (error as { code?: string })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
};

async function adminWrite<T>(q: Queryable, actorId: string, run: (tx: Queryable) => Promise<T>): Promise<TemplateStudioResult<T>> {
  try {
    const data = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      return run(tx);
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof Outcome) return { success: false, error: error.error };
    if (isUniqueViolation(error)) return { success: false, error: "template_key_taken" };
    throw error;
  }
}

async function audit(
  tx: Queryable,
  entry: { actorId: string; key: string; action: AdminAuditAction; before: Record<string, unknown>; after: Record<string, unknown>; reason: string },
) {
  await writeAdminAudit(tx, {
    actorId: entry.actorId,
    sellerId: null,
    targetType: TARGET_TYPE,
    targetId: entry.key,
    action: entry.action,
    before: entry.before,
    after: entry.after,
    reason: entry.reason,
  });
}

/** The live (not deleted) template row, locked for the rest of the transaction. */
async function lockTemplate(tx: Queryable, id: string) {
  if (typeof id !== "string" || !UUID_RE.test(id)) throw new Outcome("not_found");
  const [row] = await tx
    .select()
    .from(templates)
    .where(and(eq(templates.id, id), isNull(templates.deletedAt)))
    .for("update");
  if (!row) throw new Outcome("not_found");
  return row;
}

/** The next sort order (after every existing template), so a new template lands last. */
async function nextSortOrder(tx: Queryable): Promise<number> {
  const [row] = await tx.select({ top: max(templates.sortOrder) }).from(templates);
  return (row?.top ?? 0) + 10;
}

/** Inserts the template, its version 1 and points `current_version_id` at it. Inactive. */
async function insertTemplateWithVersionOne(
  tx: Queryable,
  actorId: string,
  v: { key: string; name: unknown; description: unknown; category: string; config: SiteConfig; meta: TemplateMeta; thumbnailUrl?: string | null },
): Promise<{ id: string; key: string }> {
  const [row] = await tx
    .insert(templates)
    .values({
      key: v.key,
      name: v.name,
      description: v.description,
      category: v.category,
      thumbnailUrl: v.thumbnailUrl ?? null,
      isActive: false,
      isDefault: false,
      sortOrder: await nextSortOrder(tx),
      meta: v.meta,
    })
    .onConflictDoNothing({ target: templates.key })
    .returning({ id: templates.id, key: templates.key });
  if (!row) throw new Outcome("template_key_taken");
  const [version] = await tx
    .insert(templateVersions)
    .values({ templateId: row.id, version: 1, schemaVersion: CURRENT_SITE_CONFIG_VERSION, config: v.config, changelog: "Created", publishedBy: actorId })
    .returning({ id: templateVersions.id });
  await tx.update(templates).set({ currentVersionId: version!.id }).where(eq(templates.id, row.id));
  return row;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export type TemplateForStudio = {
  id: string;
  key: string;
  name: unknown;
  description: unknown;
  category: string;
  isDefault: boolean;
  isActive: boolean;
  /** What the studio opens: the draft when there is one, else the current published config. */
  config: SiteConfig | null;
  hasDraft: boolean;
  draftVersion: number;
  /** The published version number, or null if none. */
  version: number | null;
  meta: TemplateMeta;
  /** The page names (both languages) the studio opens with: the draft's while there is one, else `meta.pageNames`. */
  pageNames: TemplatePageNames;
};

/** One non-deleted template for the editor, or null. */
export async function getTemplateForStudio(id: string, q: Queryable = db): Promise<TemplateForStudio | null> {
  if (typeof id !== "string" || !UUID_RE.test(id)) return null;
  const [row] = await q
    .select({ template: templates, version: templateVersions.version, config: templateVersions.config })
    .from(templates)
    .leftJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
    .where(and(eq(templates.id, id), isNull(templates.deletedAt)))
    .limit(1);
  if (!row) return null;
  const t = row.template;
  const stored = t.draftConfig ?? row.config;
  // Library refs are built for the editor and kept on each section, so a save can store unchanged ones as refs again.
  const raw = stored ? await expandTemplateConfig(stored, t.category, q, { keepRefs: true }) : null;
  const prepared = raw ? prepareTemplateConfig(raw) : null;
  const meta = resolveTemplateMeta(t.meta, t.key);
  const config = prepared?.ok ? prepared.config : null;
  return {
    id: t.id,
    key: t.key,
    name: t.name,
    description: t.description,
    category: t.category,
    isDefault: t.isDefault,
    isActive: t.isActive,
    config,
    hasDraft: t.draftConfig !== null,
    draftVersion: t.draftVersion,
    version: row.version ?? null,
    meta,
    pageNames: studioPageNames(t.meta, meta.pageNames, config?.pages ?? [], t.draftConfig !== null),
  };
}

/** The published versions of a non-deleted template, newest first (for the restore list). */
export async function listTemplateVersionsForStudio(id: string, q: Queryable = db) {
  if (typeof id !== "string" || !UUID_RE.test(id)) return [];
  return q
    .select({ id: templateVersions.id, version: templateVersions.version, changelog: templateVersions.changelog, publishedAt: templateVersions.publishedAt })
    .from(templateVersions)
    .innerJoin(templates, eq(templates.id, templateVersions.templateId))
    .where(and(eq(templateVersions.templateId, id), isNull(templates.deletedAt)))
    .orderBy(desc(templateVersions.version));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** A new inactive template: version 1 = one empty home page, Classic's design system and meta. Audited: create_template. */
export async function createTemplate(
  actorId: string,
  input: unknown,
  reason: unknown,
  q: Queryable = db,
): Promise<TemplateStudioResult<{ id: string; key: string }>> {
  const parsed = templateCreateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  const { key, name, description, category } = parsed.data;
  return adminWrite(q, actorId, async (tx) => {
    const [classic] = await tx.select({ meta: templates.meta }).from(templates).where(eq(templates.key, DEFAULT_TEMPLATE.key)).limit(1);
    const meta = classic ? resolveTemplateMeta(classic.meta, DEFAULT_TEMPLATE.key) : templateMeta(DEFAULT_TEMPLATE);
    const row = await insertTemplateWithVersionOne(tx, actorId, { key, name, description, category, config: blankTemplateConfig(), meta });
    await audit(tx, { actorId, key, action: "create_template", before: {}, after: { id: row.id, key, category, name }, reason: why });
    return row;
  });
}

/** A copy of a template's current published config and meta under `newKey`; inactive. Audited: create_template with after.duplicatedFrom. */
export async function duplicateTemplate(
  actorId: string,
  sourceId: string,
  newKey: unknown,
  reason: unknown,
  q: Queryable = db,
): Promise<TemplateStudioResult<{ id: string; key: string }>> {
  const key = templateKeySchema.safeParse(newKey);
  if (!key.success) return { success: false, error: "invalid_input" };
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  return adminWrite(q, actorId, async (tx) => {
    const source = await lockTemplate(tx, sourceId);
    const [current] = source.currentVersionId
      ? await tx.select({ config: templateVersions.config }).from(templateVersions).where(eq(templateVersions.id, source.currentVersionId))
      : [];
    const prepared = prepareTemplateConfig(current?.config);
    if (!prepared.ok) throw new Outcome("invalid_config");
    const row = await insertTemplateWithVersionOne(tx, actorId, {
      key: key.data,
      name: source.name,
      description: source.description,
      category: source.category,
      thumbnailUrl: source.thumbnailUrl,
      config: prepared.config,
      meta: resolveTemplateMeta(source.meta, source.key),
    });
    await audit(tx, { actorId, key: row.key, action: "create_template", before: {}, after: { id: row.id, key: row.key, duplicatedFrom: source.key }, reason: why });
    return row;
  });
}

/**
 * Autosave of the studio: validated config, optimistic on `draft_version`.
 * Library sections the admin left exactly as their `libraryRef` builds them
 * are stored as refs again (they keep following the library); edited ones
 * keep their tree and stop following it (`compactTemplateForStorage`).
 * Not audited; sellers see nothing. `pageNames` (both languages, keyed by
 * slug) are the working draft's page names, kept in `meta.draftPageNames`
 * until Publish; omitted, the stored draft names stay.
 */
export async function saveTemplateDraft(
  actorId: string,
  id: string,
  config: unknown,
  clientVersion: number,
  q: Queryable = db,
  pageNames?: unknown,
): Promise<TemplateStudioResult<{ draftVersion: number }>> {
  const prepared = prepareTemplateConfig(config);
  if (!prepared.ok) return { success: false, error: "invalid_config" };
  if (!Number.isInteger(clientVersion)) return { success: false, error: "invalid_input" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockTemplate(tx, id);
    if (row.draftVersion !== clientVersion) throw new Outcome("version_conflict");
    const draftConfig = await compactTemplateForStorage(prepared.config, row.category, tx);
    const [updated] = await tx
      .update(templates)
      .set({
        draftConfig,
        draftVersion: sql`${templates.draftVersion} + 1`,
        draftUpdatedAt: sql`now()`,
        ...(pageNames !== undefined && { meta: withDraftPageNames(row.meta, templatePageNamesFor(pageNames, prepared.config.pages)) }),
      })
      .where(and(eq(templates.id, row.id), eq(templates.draftVersion, clientVersion)))
      .returning({ draftVersion: templates.draftVersion });
    if (!updated) throw new Outcome("version_conflict");
    return { draftVersion: updated.draftVersion };
  });
}

/**
 * Publish: a new `template_versions` row (`max(version) + 1`, config = the
 * validated draft), `current_version_id` moves to it and the draft is cleared
 * (`draft_version` + 1, so an editor holding the old draft conflicts). No
 * draft: `no_change`. Does not touch `is_active`. Audited: publish_template_version.
 * `meta.pageNames` is rewritten from the published pages in the same
 * transaction (the draft's names, else the previous ones; removed slugs
 * dropped), so "Use template" and new stores get the renamed pages.
 */
export async function publishTemplateVersion(
  actorId: string,
  id: string,
  changelog: string | null,
  reason: unknown,
  q: Queryable = db,
): Promise<TemplateStudioResult<{ version: number; versionId: string }>> {
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  if (changelog !== null && (typeof changelog !== "string" || changelog.length > 500)) return { success: false, error: "invalid_input" };
  const note = changelog?.trim() || null;
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockTemplate(tx, id);
    if (row.draftConfig === null) throw new Outcome("no_change");
    const prepared = prepareTemplateConfig(row.draftConfig);
    if (!prepared.ok) throw new Outcome("invalid_config");
    const [top] = await tx.select({ top: max(templateVersions.version) }).from(templateVersions).where(eq(templateVersions.templateId, row.id));
    const previous = top?.top ?? 0;
    const version = previous + 1;
    const [inserted] = await tx
      .insert(templateVersions)
      .values({ templateId: row.id, version, schemaVersion: CURRENT_SITE_CONFIG_VERSION, config: prepared.config, changelog: note, publishedBy: actorId })
      .returning({ id: templateVersions.id });
    await tx
      .update(templates)
      .set({
        currentVersionId: inserted!.id,
        meta: publishedTemplateMeta(row.meta, resolveTemplateMeta(row.meta, row.key).pageNames, prepared.config.pages),
        draftConfig: null,
        draftVersion: sql`${templates.draftVersion} + 1`,
        draftUpdatedAt: null,
        updatedAt: sql`now()`,
      })
      .where(eq(templates.id, row.id));
    await audit(tx, { actorId, key: row.key, action: "publish_template_version", before: { version: previous }, after: { version, changelog: note }, reason: why });
    return { version, versionId: inserted!.id };
  });
}

/** Loads an old version's config into the draft (replacing any draft); publishing is a separate step. Audited: restore_template_version. */
export async function restoreTemplateVersionToDraft(
  actorId: string,
  id: string,
  versionId: string,
  reason: unknown,
  q: Queryable = db,
): Promise<TemplateStudioResult<{ draftVersion: number; version: number }>> {
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  if (typeof versionId !== "string" || !UUID_RE.test(versionId)) return { success: false, error: "not_found" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockTemplate(tx, id);
    const [version] = await tx
      .select({ version: templateVersions.version, config: templateVersions.config })
      .from(templateVersions)
      .where(and(eq(templateVersions.id, versionId), eq(templateVersions.templateId, row.id)));
    if (!version) throw new Outcome("not_found");
    const prepared = prepareTemplateConfig(version.config);
    if (!prepared.ok) throw new Outcome("invalid_config");
    const [updated] = await tx
      .update(templates)
      // The restored draft opens with the published page names (no draft names).
      .set({ draftConfig: prepared.config, draftVersion: sql`${templates.draftVersion} + 1`, draftUpdatedAt: sql`now()`, meta: withDraftPageNames(row.meta, null) })
      .where(eq(templates.id, row.id))
      .returning({ draftVersion: templates.draftVersion });
    await audit(tx, {
      actorId,
      key: row.key,
      action: "restore_template_version",
      before: { hadDraft: row.draftConfig !== null },
      after: { restoredVersion: version.version },
      reason: why,
    });
    return { draftVersion: updated!.draftVersion, version: version.version };
  });
}

/** Soft delete (`deleted_at`, `is_active = false`). Refuses the default. `template_installs` stay. Audited: delete_template. */
export async function deleteTemplate(actorId: string, id: string, reason: unknown, q: Queryable = db): Promise<TemplateStudioResult<null>> {
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockTemplate(tx, id);
    if (row.isDefault) throw new Outcome("default_template");
    await tx.update(templates).set({ deletedAt: sql`now()`, isActive: false, updatedAt: sql`now()` }).where(eq(templates.id, row.id));
    await audit(tx, { actorId, key: row.key, action: "delete_template", before: { isActive: row.isActive, deletedAt: null }, after: { deleted: true }, reason: why });
    return null;
  });
}
