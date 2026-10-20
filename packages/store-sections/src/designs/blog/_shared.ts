/**
 * Post cards of the Blog designs (library B). Cover, date, title and excerpt
 * are bound to the published post the list repeats them for
 * (`elements/data.ts`); the text here is only the editor placeholder.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { TreeBuilder } from "../builder";
import { L } from "../_kit";

export const BLOG_LINK = "/blog";

export const POST_TITLE = L("عنوان المقال", "Post title");
const POST_EXCERPT = L("سطر قصير من المقال يشرح موضوعه.", "A short line from the post about what it covers.");
const POST_DATE = L("٢ أكتوبر", "2 Oct");

/** The post cover as a link. */
export function postCover(t: TreeBuilder, ratio: StyleValues["aspectRatio"] = "wide", radius = 16): NodeTemplate {
  return t.link(BLOG_LINK, [t.image("", POST_TITLE, { bind: "image", style: { aspectRatio: ratio, objectFit: "cover", width: "100%" } })], {
    label: L("غلاف المقال", "Post cover"),
    bind: "href",
    style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius, overflow: "hidden", background: "secondary" },
  });
}

export function postDate(t: TreeBuilder): NodeTemplate {
  return t.text(POST_DATE, { bind: "date", style: { color: "primary", fontSize: "xs", fontWeight: "semibold" } });
}

/** The title as a link to the post. */
export function postTitle(t: TreeBuilder, style: StyleValues = {}): NodeTemplate {
  return t.link(BLOG_LINK, [t.heading(POST_TITLE, "h3", { bind: "title", style: { fontSize: "lg", lineHeight: "snug", ...style } })], {
    label: L("عنوان المقال", "Post title"),
    bind: "href",
    style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground" },
  });
}

export function postExcerpt(t: TreeBuilder): NodeTemplate {
  return t.paragraph(POST_EXCERPT, { bind: "excerpt", style: { fontSize: "sm" } });
}
