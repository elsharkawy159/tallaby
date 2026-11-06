"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { ChatGptMark, ClaudeMark } from "./ai-brand-marks";
import { useDemoSteps } from "./use-demo.client";

/**
 * The real tool names of the Tallaby connection. Each step adds a line to the
 * chat; the last step is the finished conversation, shown when still.
 */
const STEPS = [600, 900, 900, 900, 2300, 900, 800, 700, 1000, 4200] as const;
const LAST = STEPS.length - 1;

type Line = { key: string; kind: "user" | "ai" | "tool" | "typing"; text?: string; done?: boolean };

function linesAt(step: number, t: (key: string) => string): Line[] {
  const u1: Line = { key: "u1", kind: "user", text: t("user1") };
  const a1: Line = { key: "a1", kind: "ai", text: t("ai1") };
  const u2: Line = { key: "u2", kind: "user", text: t("user2") };
  const a2: Line = { key: "a2", kind: "ai", text: t("ai2") };
  const create = (done: boolean): Line => ({ key: "create", kind: "tool", text: "create_product", done });
  const search: Line = { key: "search", kind: "tool", text: "search_products · 12", done: true };
  const update = (done: boolean): Line => ({ key: "update", kind: "tool", text: "update_product × 12", done });
  const typing: Line = { key: "typing", kind: "typing" };

  switch (step) {
    case 0:
      return [u1];
    case 1:
      return [u1, typing];
    case 2:
      return [u1, create(false)];
    case 3:
      return [u1, create(true)];
    case 4:
      return [u1, create(true), a1];
    case 5:
      return [create(true), a1, u2];
    case 6:
      return [a1, u2, typing];
    case 7:
      return [a1, u2, search];
    case 8:
      return [u2, search, update(false)];
    default:
      return [u2, search, update(true), a2];
  }
}

/** A sample chat with an AI assistant connected to a store. Only product tools exist today, so it only uses those. */
export function McpChatDemo() {
  const t = useTranslations("home.demo.mcp");
  const { ref, step, cycle } = useDemoSteps<HTMLDivElement>(STEPS, LAST);
  const assistant = cycle % 2 === 0 ? "Claude" : "ChatGPT";

  return (
    <div ref={ref} aria-hidden className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-[18px] border border-line bg-white p-3 shadow-[0_4px_14px_rgba(13,55,67,0.05)] min-[641px]:p-4">
      <div className="flex items-center gap-2 border-b border-[#f0f4f5] pb-2.5 text-[12.5px] text-ink-400">
        <span dir="ltr" className="flex gap-1">
          {["Claude", "ChatGPT"].map((name) => (
            <span key={name} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-latin text-[11px] font-bold", name === assistant ? "bg-teal-900 text-white" : "bg-[#f1f5f6] text-[#3f5358]")}>
              {name === "Claude" ? <ClaudeMark className="size-3" /> : <ChatGptMark className="size-3" />}
              {name}
            </span>
          ))}
        </span>
        <span>{t("connected")}</span>
      </div>
      {linesAt(step, t).map((line) => {
        if (line.kind === "typing") {
          return (
            <div key={line.key} className="flex gap-1 self-end rounded-2xl bg-[#f4f7f8] px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <i key={i} className="size-1.5 animate-pulse rounded-full bg-[#9fb2b7]" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          );
        }
        if (line.kind === "tool") {
          const Icon = line.done ? CircleCheck : LoaderCircle;
          return (
            <div key={line.key} dir="ltr" className="flex items-center gap-2 self-end rounded-[10px] border border-dashed border-[#cfdde1] bg-white px-2.5 py-1.5 font-latin text-xs font-semibold whitespace-nowrap text-[#3f5358]">
              <Icon className={cn("size-3.5", line.done ? "text-[#16a34a]" : "animate-spin text-teal-700")} />
              {line.text}
            </div>
          );
        }
        return (
          <div
            key={line.key}
            className={cn(
              "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.65]",
              line.kind === "user" ? "self-start rounded-es-[4px] bg-teal-700 text-white" : "self-end rounded-ee-[4px] bg-[#f4f7f8] text-[#2d4146]",
            )}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
}
