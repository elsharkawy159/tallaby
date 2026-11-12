"use client";

import { useEffect, useState } from "react";

/** Below this width the table folds every group but the first on load (the groups stay server-rendered and open for crawlers and no-JS). */
const SMALL_SCREEN = "(max-width: 860px)";

const groupsIn = (containerId: string) => Array.from(document.querySelectorAll<HTMLDetailsElement>(`#${containerId} details[data-compare-group]`));

/**
 * "Open all / Close all" for the compare table's `<details>` groups. On
 * phones it also closes every group after the first once, on mount, so the
 * page isn't one long scroll; the label follows the groups as they toggle.
 */
export function CompareGroupsToggle({ containerId, openLabel, closeLabel }: { containerId: string; openLabel: string; closeLabel: string }) {
  const [allOpen, setAllOpen] = useState(true);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const sync = () => setAllOpen(groupsIn(containerId).every((group) => group.open));
    if (window.matchMedia(SMALL_SCREEN).matches) {
      groupsIn(containerId).forEach((group, i) => {
        if (i > 0) group.open = false;
      });
    }
    sync();
    // `toggle` doesn't bubble: listen in the capture phase.
    container.addEventListener("toggle", sync, true);
    return () => container.removeEventListener("toggle", sync, true);
  }, [containerId]);

  return (
    <button
      type="button"
      aria-controls={containerId}
      onClick={() => {
        const next = !allOpen;
        groupsIn(containerId).forEach((group) => {
          group.open = next;
        });
        setAllOpen(next);
      }}
      className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-700"
    >
      {allOpen ? closeLabel : openLabel}
    </button>
  );
}
