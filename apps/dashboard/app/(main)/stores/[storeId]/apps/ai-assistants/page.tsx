import { DEFAULT_MCP_RESOURCE } from "@workspace/lib/agents";
import { PageContainer } from "@/components/seller-ui";
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
    <PageContainer className="max-w-[816px]">
      <AiAssistantsApp
        storeId={store.id}
        storeName={store.name}
        mcpUrl={process.env.MCP_SERVER_URL || DEFAULT_MCP_RESOURCE}
        live={process.env.MCP_CONNECT_ENABLED !== "false"}
      />
    </PageContainer>
  );
}
