/**
 * The single entry point for turning untrusted builder JSON into a SiteConfig:
 * migrate → size/depth guards → schema → structural checks → sanitize.
 * Used by draft saves, publish and template seeding (PLAN.md §12).
 *
 * Checks that need the database (product ids in the store's catalog, media
 * owned by the seller, form/CMS ids in the store) run in the publish action.
 */
import { CURRENT_SITE_CONFIG_VERSION, migrateSiteConfig } from "./migrate";
import { sanitizeSiteConfig } from "./sanitize";
import {
  MAX_CUSTOM_CSS_BYTES,
  type ComponentNode,
  type PageContent,
  type SectionInstance,
  type SiteConfig,
  siteConfigSchema,
} from "./schema";
import { MAX_NODES_PER_SECTION } from "../elements/registry";
import { countNodes } from "../elements/tree";
import type { CodeIssue } from "../code/code-issues";
import { blockedCodeIssues, normalizeCodeNodeProps, utf8Length, type CodeNodeIssue, type CodeNodeProps } from "../code/code-node";

export type SiteConfigIssueCode =
  | "invalid_config"
  | "unsupported_version"
  | "too_large"
  | "too_deep"
  | "invalid_schema"
  | "tree_too_deep"
  | "tree_too_large"
  | "duplicate_section_id"
  | "unknown_section"
  | "unsupported_section_version"
  /** A code element's template, stylesheet or schema (F-101); `detail` says what. */
  | "invalid_code"
  /** An element's or section's custom CSS (F-101b). */
  | "invalid_css"
  /** A page's code and custom CSS together are over `MAX_PAGE_CODE_BYTES`. */
  | "code_too_large";

export type SiteConfigIssue = {
  code: SiteConfigIssueCode;
  path: (string | number)[];
  message: string;
  /** Code issues only: the element (or section) id, the specific problem (e.g. `blocked_script`) and its 1-based position in the field `path` ends with. */
  nodeId?: string;
  detail?: string;
  line?: number;
  column?: number;
};

/**
 * The checks that load the Liquid engine (`node:crypto`) and the CSS parser,
 * so they never ship to the browser. Server callers pass `CODE_SERVER_CHECKS`
 * from `@workspace/store-sections/code-server`. Without them only the
 * browser-safe checks run (schema, sizes, blocked constructs in templates).
 */
export type CodeServerChecks = {
  checkCodeNode: (props: CodeNodeProps) => CodeIssue[];
  checkCss: (css: string, maxBytes: number) => { line: number; column: number; message: string }[];
};

export type ValidateSiteConfigOptions = {
  /** Section registry: section id → newest supported version. Omit to skip the check. */
  allowedSections?: Readonly<Record<string, number>>;
  /** Max serialized size in bytes. Default 2 MB. */
  maxBytes?: number;
  /** Max nesting of free-form nodes. Default 20. */
  maxTreeDepth?: number;
  /** Full code-section checks (Liquid parse, CSS). Every server save and publish passes them. */
  serverChecks?: CodeServerChecks;
};

/** Per page: code templates + stylesheets + every custom CSS (header and footer included), in UTF-8 bytes (design note §3.4). */
export const MAX_PAGE_CODE_BYTES = 400 * 1024;

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
  const { allowedSections, maxBytes = DEFAULT_MAX_BYTES, maxTreeDepth = DEFAULT_MAX_TREE_DEPTH, serverChecks } = options;

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

  // Code sections (F-101): every code node at any depth and every custom CSS. Each call returns
  // the UTF-8 bytes of code and custom CSS it saw, for the per-page cap.
  const checkCustomCss = (css: string | undefined, path: (string | number)[], nodeId: string): number => {
    if (!css) return 0;
    for (const found of serverChecks?.checkCss(css, MAX_CUSTOM_CSS_BYTES) ?? []) {
      issues.push({ code: "invalid_css", path, message: found.message, nodeId, detail: "css_invalid", line: found.line, column: found.column });
    }
    return utf8Length(css);
  };

  const checkNodes = (nodes: ComponentNode[] | undefined, path: (string | number)[]): number => {
    let total = 0;
    nodes?.forEach((node, index) => {
      const nodePath = [...path, index];
      total += checkCustomCss(node.customCss, [...nodePath, "customCss"], node.id);
      if (node.type !== "code") {
        total += checkNodes(node.children, [...nodePath, "children"]);
        return;
      }
      // A code node is a leaf: sanitizing drops any children, so they are not checked.
      const { props, issues: found } = normalizeCodeNodeProps(node.props);
      const checked: CodeNodeIssue[] = serverChecks ? serverChecks.checkCodeNode(props) : blockedCodeIssues(props);
      for (const issue of [...found, ...checked]) {
        issues.push({
          code: "invalid_code",
          path: [...nodePath, "props", issue.field ?? "source"],
          message: issue.message,
          nodeId: node.id,
          detail: issue.code,
          ...(issue.line !== undefined && { line: issue.line }),
          ...(issue.column !== undefined && { column: issue.column }),
        });
      }
      total += utf8Length(props.source) + utf8Length(props.css ?? "");
    });
    return total;
  };

  const checkSection = (section: SectionInstance, path: (string | number)[]): number => {
    if (treeDepth(section.componentTree) > maxTreeDepth) {
      issues.push({ code: "tree_too_deep", path: [...path, "componentTree"], message: `> ${maxTreeDepth}` });
    }
    if (section.componentTree && countNodes(section.componentTree) > MAX_NODES_PER_SECTION) {
      issues.push({ code: "tree_too_large", path: [...path, "componentTree"], message: `> ${MAX_NODES_PER_SECTION} elements` });
    }
    const codeBytes =
      checkCustomCss(section.customCss, [...path, "customCss"], section.id) +
      checkNodes(section.componentTree, [...path, "componentTree"]);
    if (!allowedSections) return codeBytes;
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
    return codeBytes;
  };

  // The shared header and footer render on every page, so they count toward each page's cap.
  const chromeBytes =
    (config.header ? checkSection(config.header, ["header"]) : 0) +
    (config.footer ? checkSection(config.footer, ["footer"]) : 0);

  config.pages.forEach((page, pageIndex) => {
    const sectionsPath = ["pages", pageIndex, "content", "sections"];
    const ids = new Set<string>();
    let pageBytes = chromeBytes;
    page.content.sections.forEach((section, sectionIndex) => {
      if (ids.has(section.id)) {
        issues.push({
          code: "duplicate_section_id",
          path: [...sectionsPath, sectionIndex, "id"],
          message: section.id,
        });
      }
      ids.add(section.id);
      pageBytes += checkSection(section, [...sectionsPath, sectionIndex]);
    });
    for (const [key, nodes] of Object.entries(page.content.injectedChildren ?? {})) {
      const injectedPath = ["pages", pageIndex, "content", "injectedChildren", key];
      if (treeDepth(nodes) > maxTreeDepth) {
        issues.push({ code: "tree_too_deep", path: injectedPath, message: `> ${maxTreeDepth}` });
      }
      pageBytes += checkNodes(nodes, injectedPath);
    }
    if (pageBytes > MAX_PAGE_CODE_BYTES) {
      issues.push({
        code: "code_too_large",
        path: ["pages", pageIndex, "content"],
        message: `This page has too much custom code: ${Math.ceil(pageBytes / 1024)} KB, the limit is ${MAX_PAGE_CODE_BYTES / 1024} KB.`,
      });
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

export type ValidatePageContentResult =
  | { success: true; data: PageContent }
  | { success: false; issues: SiteConfigIssue[] };

const PAGE_CONTENT_PATH = ["pages", 0, "content"] as const;

/**
 * Validates one page's draft content (autosave). Runs it through the exact same
 * pipeline as a full publish by wrapping it in a one-page SiteConfig; issue
 * paths are reported relative to the content.
 */
export function validatePageContent(
  raw: unknown,
  options: ValidateSiteConfigOptions = {},
): ValidatePageContentResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { success: false, issues: [{ code: "invalid_config", path: [], message: "invalid_content" }] };
  }
  const wrapped = {
    schemaVersion: CURRENT_SITE_CONFIG_VERSION,
    pages: [{ slug: "home", isHome: true, name: "page", content: raw }],
  };
  const result = validateSiteConfig(wrapped, options);
  if (result.success) return { success: true, data: result.data.pages[0]!.content };

  const prefix = PAGE_CONTENT_PATH.length;
  return {
    success: false,
    issues: result.issues.map((issue) => ({
      ...issue,
      path: issue.path.slice(0, prefix).every((p, i) => p === PAGE_CONTENT_PATH[i])
        ? issue.path.slice(prefix)
        : issue.path,
    })),
  };
}
