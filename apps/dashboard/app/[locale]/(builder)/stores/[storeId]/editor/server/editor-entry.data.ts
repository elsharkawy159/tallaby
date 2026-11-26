import { aiConfigured } from "@workspace/ai";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";

/**
 * Whether the website editor offers editing with AI: the `editor_agent`
 * platform switch (F-83c) is on and an AI provider is configured. Off, the
 * editor opens with no choice, as before. The switch is read once per request.
 */
export async function editorAiEnabled(): Promise<boolean> {
  if (!aiConfigured()) return false;
  return isSwitchOn("editor_agent").catch(() => false);
}
