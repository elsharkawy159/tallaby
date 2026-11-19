import { cache } from "react";
import { isSwitchOn as readSwitch } from "@workspace/lib/stores/switches/server";
import type { PlatformSwitchKey } from "@workspace/lib/stores/switches";

/**
 * A platform switch (ROADMAP.md F-87a), read once per request with React
 * `cache` and never across requests (CLAUDE.md rule 8). Inside a database
 * transaction, call `isSwitchOn(key, tx)` from `@workspace/lib/stores/switches/server`
 * instead, so the read sees the transaction's snapshot.
 */
export const isSwitchOn = cache((key: PlatformSwitchKey): Promise<boolean> => readSwitch(key));
