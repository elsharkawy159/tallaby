"use client";

import * as React from "react";

/** Highlights the section currently at the top of the viewport. */
export function useScrollSpy(ids: string[], offset = 160) {
  const [active, setActive] = React.useState<string | null>(null);
  const key = ids.join("|");

  React.useEffect(() => {
    const list = key.split("|");
    const onScroll = () => {
      let current: string | null = null;
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < offset) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [key, offset]);

  return active;
}
