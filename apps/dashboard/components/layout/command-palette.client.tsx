"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CommandPaletteProps } from "./command-palette-body.client";

// cmdk and the search action load on first open, not with every dashboard page
// (docs/plans/dashboard-performance.md A6). The header keeps the ⌘K/Ctrl+K
// listener and the open state, so the first press opens the palette as soon as
// its chunk arrives.
const CommandPaletteBody = dynamic(
  () => import("./command-palette-body.client").then((m) => m.CommandPaletteBody),
  { ssr: false },
);

export function CommandPalette(props: CommandPaletteProps) {
  // Stays mounted after the first open so closing keeps its animation and the
  // chunk is never fetched twice.
  const [opened, setOpened] = useState(props.open);
  if (props.open && !opened) setOpened(true);
  return opened ? <CommandPaletteBody {...props} /> : null;
}
