/**
 * Runs `scan` now, then again (at most once a frame) whenever nodes are added
 * under `document.body`, so sections that mount later (client navigation, a
 * preview's new page) are picked up. Shared by the motion, scroll and
 * carousel runtimes; returns the clean-up.
 */
export function watchMounts(document: Document, scan: () => void): () => void {
  const window = document.defaultView!;
  let frame = 0;
  const mutations = new window.MutationObserver(() => {
    frame ||= window.requestAnimationFrame(() => {
      frame = 0;
      scan();
    });
  });
  if (document.body) mutations.observe(document.body, { childList: true, subtree: true });
  scan();
  return () => {
    mutations.disconnect();
    if (frame) window.cancelAnimationFrame(frame);
  };
}
