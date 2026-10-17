/**
 * The single entry point for turning untrusted builder JSON into a SiteConfig:
 * migrate → size/depth guards → schema → structural checks → sanitize.
 * Used by draft saves, publish and template seeding (PLAN.md §12).
 *
 * Checks that need the database (product ids in the store's catalog, media
 * owned by the seller, form/CMS ids in the store) run in the publish action.
 */
import { migrateSiteConfig } from "./migrate";
import { sanitizeSiteConfig } from "./sanitize";
import { type ComponentNode, type SectionInstance, type SiteConfig, siteConfigSchema } from "./schema";

export type SiteConfigIssueCode =
  | "invalid_config"
  | "unsupported_version"
  | "too_large"
  | "too_deep"
  | "invalid_schema"
  | "tree_too_deep"
  | "duplicate_section_id"
  | "unknown_section"
  | "unsupported_section_version";

export type SiteConfigIssue = {
  code: SiteConfigIssueCode;
  path: (string | number)[];
  message: string;
};

export type ValidateSiteConfigOptions = {
  /** Section registry: section id → newest supported version. Omit to skip the check. */
  allowedSections?: Readonly<Record<string, number>>;
  /** Max serialized size in bytes. Default 2 MB. */
  maxBytes?: number;
  /** Max nesting of free-form nodes. Default 20. */
  maxTreeDepth?: number;
};

export type ValidateSiteConfigResult =
  | { success: true; data: SiteConfig; migrated: boolean; fromVersion: number }
  | { success: false; issues: SiteConfigIssue[] };

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_MAX_TREE_DEPTH = 20;
// Guard against pathological JSON nesting before handing it to the recursive schema.
const MAX_RAW_NESTING = 200;

function rawNesting(value: unknown): number {
  let max = 0;
  const stack: [unknown, number][] = [[value, 0]];
  while (stack.length) {
    const [current, depth] = stack.pop()!;
    if (current && typeof current === "object") {
      if (depth + 1 > max) max = depth + 1;
      if (max > MAX_RAW_NESTING) return max;
      for (const child of Object.values(current)) stack.push([child, depth + 1]);
    }
  }
  return max;
}

function treeDepth(nodes: ComponentNode[] | undefined): number {
  if (!nodes?.length) return 0;
  return 1 + Math.max(...nodes.map((n) => treeDepth(n.children)));
}

function fail(issues: SiteConfigIssue[]): ValidateSiteConfigResult {
  return { success: false, issues };
}

export function validateSiteConfig(
  raw: unknown,
  options: ValidateSiteConfigOptions = {},
): ValidateSiteConfigResult {
  const { allowedSections, maxBytes = DEFAULT_MAX_BYTES, maxTreeDepth = DEFAULT_MAX_TREE_DEPTH } = options;

  const migration = migrateSiteConfig(raw);
  if (!migration.ok) {
    return fail([{ code: migration.error, path: ["schemaVersion"], message: migration.error }]);
  }

  const bytes = new TextEncoder().encode(JSON.stringify(migration.config)).length;
  if (bytes > maxBytes) {
    return fail([{ code: "too_large", path: [], message: `${bytes} > ${maxBytes} bytes` }]);
  }
  if (rawNesting(migration.config) > MAX_RAW_NESTING) {
    return fail([{ code: "too_deep", path: [], message: `nesting > ${MAX_RAW_NESTING}` }]);
  }

  const parsed = siteConfigSchema.safeParse(migration.config);
  if (!parsed.success) {
    return fail(
      parsed.error.issues.map((issue) => ({
        code: "invalid_schema" as const,
        path: issue.path.map((p) => (typeof p === "number" ? p : String(p))),
        message: issue.message,
      })),
    );
  }

  const config = parsed.data;
  const issues: SiteConfigIssue[] = [];

  const checkSection = (section: SectionInstance, path: (string | number)[]) => {
    if (treeDepth(section.componentTree) > maxTreeDepth) {
      issues.push({ code: "tree_too_deep", path: [...path, "componentTree"], message: `> ${maxTreeDepth}` });
    }
    if (!allowedSections) return;
    const maxVersion = allowedSections[section.sectionId];
    if (maxVersion === undefined) {
      issues.push({ code: "unknown_section", path: [...path, "sectionId"], message: section.sectionId });
    } else if (section.version > maxVersion) {
      issues.push({
        code: "unsupported_section_version",
        path: [...path, "version"],
        message: `${section.sectionId}@${section.version} > ${maxVersion}`,
      });
    }
  };

  if (config.header) checkSection(config.header, ["header"]);
  if (config.footer) checkSection(config.footer, ["footer"]);

  config.pages.forEach((page, pageIndex) => {
    const sectionsPath = ["pages", pageIndex, "content", "sections"];
    const ids = new Set<string>();
    page.content.sections.forEach((section, sectionIndex) => {
      if (ids.has(section.id)) {
        issues.push({
          code: "duplicate_section_id",
          path: [...sectionsPath, sectionIndex, "id"],
          message: section.id,
        });
      }
      ids.add(section.id);
      checkSection(section, [...sectionsPath, sectionIndex]);
    });
    for (const [key, nodes] of Object.entries(page.content.injectedChildren ?? {})) {
      if (treeDepth(nodes) > maxTreeDepth) {
        issues.push({
          code: "tree_too_deep",
          path: ["pages", pageIndex, "content", "injectedChildren", key],
          message: `> ${maxTreeDepth}`,
        });
      }
    }
  });

  if (issues.length) return fail(issues);

  return {
    success: true,
    data: sanitizeSiteConfig(config),
    migrated: migration.migrated,
    fromVersion: migration.fromVersion,
  };
}
