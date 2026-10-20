import type { DraftVersions } from "../adapter.types";

/**
 * Compares what this editor knows (`local`) with the saved drafts (`remote`).
 * A change is any remote version above the local one, or a page the editor
 * has never seen. A local version above the remote one is our own unsaved bump
 * and a page missing on the remote is ignored. `byAdmin` is set when the admin
 * edit timestamp moved forward.
 */
export function detectExternalChange(local: DraftVersions, remote: DraftVersions): { changed: boolean; byAdmin: boolean } {
  const pageChanged = Object.entries(remote.pages).some(([id, version]) => {
    const known = local.pages[id];
    return known === undefined || version > known;
  });
  const changed = pageChanged || remote.designVersion > local.designVersion || remote.chromeVersion > local.chromeVersion;
  const remoteAdmin = remote.editedByAdminAt ? Date.parse(remote.editedByAdminAt) : Number.NaN;
  const localAdmin = local.editedByAdminAt ? Date.parse(local.editedByAdminAt) : Number.NEGATIVE_INFINITY;
  const byAdmin = changed && !Number.isNaN(remoteAdmin) && remoteAdmin > localAdmin;
  return { changed, byAdmin };
}

/** Folds the versions the editor holds after its own saves into the baseline, so it never flags itself. */
export function mergeLocalVersions(
  baseline: DraftVersions,
  own: { pages: { id: string; version: number }[]; designVersion: number; chromeVersion: number },
): DraftVersions {
  const pages = { ...baseline.pages };
  for (const page of own.pages) pages[page.id] = Math.max(pages[page.id] ?? 0, page.version);
  return {
    pages,
    designVersion: Math.max(baseline.designVersion, own.designVersion),
    chromeVersion: Math.max(baseline.chromeVersion, own.chromeVersion),
    editedByAdminAt: baseline.editedByAdminAt,
  };
}
