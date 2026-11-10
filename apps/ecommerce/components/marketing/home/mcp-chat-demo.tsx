import { CircleCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { ChatGptMark, ClaudeMark } from "./ai-brand-marks";

/**
 * A still chat with an AI assistant connected to a store, using the real tool
 * names of the Tallaby connection (only product tools exist today). It sits at
 * the bottom of its box like a chat, so a short card hides the oldest line.
 */
export async function McpChatDemo() {
  const t = await getTranslations("home.demo.mcp");
  const lines = [
    { kind: "user", text: t("user1") },
    { kind: "tool", text: "create_product" },
    { kind: "ai", text: t("ai1") },
    { kind: "user", text: t("user2") },
    { kind: "tool", text: "update_product × 12" },
    { kind: "ai", text: t("ai2") },
  ] as const;

  return (
    <div aria-hidden className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-line bg-white p-3 min-[641px]:p-4">
      <div className="flex items-center gap-2 border-b border-[#f0f4f5] pb-2.5 text-[12.5px] text-ink-400">
        <span dir="ltr" className="flex gap-1 font-latin text-[11px] font-bold text-ink-600">
          <ClaudeMark className="size-3.5" />
          <ChatGptMark className="size-3.5" />
        </span>
        {t("connected")}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-hidden pt-2.5 [mask-image:linear-gradient(180deg,transparent,#000_40px)]">
        {lines.map((line, i) =>
          line.kind === "tool" ? (
            <span key={i} dir="ltr" className="flex flex-none items-center gap-2 self-end rounded-[10px] border border-dashed border-[#cfdde1] px-2.5 py-1.5 font-latin text-xs font-semibold text-ink-600">
              <CircleCheck className="size-3.5 text-[#16a34a]" />
              {line.text}
            </span>
          ) : (
            <p
              key={i}
              className={cn(
                "max-w-[88%] flex-none rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.65]",
                line.kind === "user" ? "self-start rounded-es-[4px] bg-teal-700 text-white" : "self-end rounded-ee-[4px] bg-[#f4f7f8] text-ink-700",
              )}
            >
              {line.text}
            </p>
          ),
        )}
      </div>
    </div>
  );
}
