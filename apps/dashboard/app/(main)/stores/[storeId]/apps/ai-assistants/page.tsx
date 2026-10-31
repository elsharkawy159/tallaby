import { DEFAULT_MCP_RESOURCE } from "@workspace/lib/agents";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { AiAssistantsApp } from "./ai-assistants.client";

/**
 * Store › Apps › AI assistants (ROADMAP.md F-29): how to connect Claude,
 * ChatGPT, Claude Code and Cursor to Tallaby over MCP, one tab each.
 * Shown as live by default (owner, 2026-10-31: testing on production);
 * `MCP_CONNECT_ENABLED=false` brings back the "opening soon" notice.
 * `MCP_SERVER_URL` overrides the URL (staging).
 */
export default async function StoreAiAssistantsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);

  return (
    <section className="mx-auto w-full max-w-[760px] px-3.5 pt-[22px] pb-20 sm:px-6 sm:pt-8 sm:pb-24">
      <AiAssistantsApp
        storeId={store.id}
        storeName={store.name}
        mcpUrl={process.env.MCP_SERVER_URL || DEFAULT_MCP_RESOURCE}
        live={process.env.MCP_CONNECT_ENABLED !== "false"}
      />
    </section>
  );
}
