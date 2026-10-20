/**
 * Where the editor's "go elsewhere" links point. The defaults are the seller
 * dashboard's own pages (unchanged from before the package split); another
 * host (admin) overrides them through `EditorAdapter.links`, and `null` hides
 * the link (or button) when the host has no such page. Pure.
 */
export type EditorLinks = {
  /** Top bar back arrow. */
  back: string | null;
  /** Brand panel: the store's Website › Design page. */
  design: string | null;
  /** Explore panel: the store settings (industry). */
  settings: string | null;
  /** Inspector form field: "Manage forms". */
  manageForms: string | null;
  /** Forms panel: the submissions inbox (`?form=<id>` is appended per form). */
  formSubmissions: string | null;
  /** Forms panel: one form's page is `${formEditBase}/${formId}`. */
  formEditBase: string | null;
  /** Canvas empty states: show the "add records" links (Pages buttons always show). */
  dataActions: boolean;
};

export type EditorLinkOverrides = { [K in keyof EditorLinks]?: EditorLinks[K] };

/** The dashboard's links for one store (exactly the strings the editor used before). */
export function defaultEditorLinks(storeId: string): EditorLinks {
  return {
    back: `/stores/${storeId}/website`,
    design: `/stores/${storeId}/website/design`,
    settings: `/stores/${storeId}/settings`,
    // Relative to /stores/[storeId]/editor → /stores/[storeId]/website/forms
    manageForms: "website/forms",
    formSubmissions: `/stores/${storeId}/website/forms/submissions`,
    formEditBase: `/stores/${storeId}/website/forms`,
    dataActions: true,
  };
}

/** Defaults with the host's overrides on top; an override of `undefined` keeps the default. */
export function resolveEditorLinks(storeId: string, overrides?: EditorLinkOverrides): EditorLinks {
  const links = defaultEditorLinks(storeId);
  if (!overrides) return links;
  for (const key of Object.keys(overrides) as (keyof EditorLinks)[]) {
    const value = overrides[key];
    if (value !== undefined) (links as Record<keyof EditorLinks, unknown>)[key] = value;
  }
  return links;
}
