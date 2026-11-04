import * as React from "react";
import Image from "next/image";
import { AppWindow, ChartColumn, ExternalLink, Globe, Menu, Package, ShoppingBag, Truck, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";

/** Small parts of the dashboard illustrations. They're pictures of the product: always aria-hidden by their parent. */

export function MockPill({ tone = "green", className, children }: { tone?: "green" | "amber" | "gray"; className?: string; children: React.ReactNode }) {
  const tones = { green: "bg-[#e5f6ea] text-[#15803d]", amber: "bg-[#fff4dc] text-[#8a5a00]", gray: "bg-[#f1f3f3] text-[#5f6b6e]" };
  return (
    <span className={cn("inline-flex h-[22px] items-center gap-[5px] rounded-full px-[9px] text-[11px] font-semibold whitespace-nowrap", tones[tone], className)}>
      <i className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function MockCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col gap-2.5 rounded-[14px] border border-[#e7e9e8] bg-white px-3.5 py-3 text-xs text-[#333]", className)}>{children}</div>;
}

export function MockCardHead({ title, hint, end }: { title: React.ReactNode; hint?: React.ReactNode; end?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <b className="text-[13px] text-[#171717]">{title}</b>
        {hint ? <small className="block text-[11px] text-[#808080]">{hint}</small> : null}
      </div>
      {end}
    </div>
  );
}

export function MockField({ on, className, children }: { on?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      dir="ltr"
      className={cn(
        "flex h-9 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-[9px] border border-[#d9dddc] bg-white px-2.5 font-latin text-[12.5px] font-semibold whitespace-nowrap text-[#171717] [&_svg]:size-3.5 [&_svg]:flex-none [&_svg]:text-[#808080]",
        on && "border-teal-700 shadow-[0_0_0_3px_rgba(20,81,99,0.1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MockButton({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-9 flex-none items-center gap-1.5 rounded-[9px] bg-teal-700 px-3.5 text-xs font-bold whitespace-nowrap text-white [&_svg]:size-3.5">{children}</span>
  );
}

export function MockToggle({ off }: { off?: boolean }) {
  return (
    <span className={cn("relative block h-5 w-[34px] flex-none rounded-full", off ? "bg-[#d9dddc]" : "bg-teal-700")}>
      <i className={cn("absolute top-[3px] size-3.5 rounded-full bg-white", off ? "start-[3px]" : "end-[3px]")} />
    </span>
  );
}

export function MockTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed border-collapse text-[11.5px]">
        <thead>
          <tr>
            {head.map((label) => (
              <th key={label} className="bg-[#f7f7f7] px-2.5 py-1.5 text-start font-medium text-[#808080]">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="truncate border-t border-[#eef0ef] px-2.5 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A monospaced-looking Latin value inside a table or card. */
export function MockCode({ children }: { children: React.ReactNode }) {
  return (
    <bdi dir="ltr" className="font-latin text-[11.5px] font-semibold">
      {children}
    </bdi>
  );
}

const NAV: { key: string; Icon: LucideIcon }[] = [
  { key: "home", Icon: ChartColumn },
  { key: "products", Icon: Package },
  { key: "orders", Icon: ShoppingBag },
  { key: "shipping", Icon: Truck },
  { key: "website", Icon: Globe },
  { key: "apps", Icon: AppWindow },
];

/**
 * The seller dashboard's frame around an illustration: sidebar, top bar and a
 * body. The sidebar folds away on small screens.
 */
export async function DashFrame({
  active,
  title,
  host = "glow.tallaby.com",
  bodyClassName,
  children,
}: {
  active: string;
  title: string;
  host?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("contentPages.dashMock");
  return (
    <div className="rounded-[14px] bg-[#0f1d21] p-[5px] shadow-[0_24px_56px_rgba(13,55,67,0.18)] sm:rounded-[20px] sm:p-2">
      <div aria-hidden className="grid overflow-hidden rounded-[10px] bg-[#f7f8f8] text-start min-[1081px]:grid-cols-[180px_minmax(0,1fr)] sm:rounded-[14px]">
        <aside className="hidden flex-col gap-3 border-e border-[#eceeed] bg-white p-3 min-[1081px]:flex">
          <Image src="/logo-primary.png" alt="" width={94} height={24} className="h-6 w-auto self-start" />
          <ul className="grid gap-0.5 text-xs text-[#55605f]">
            {NAV.map(({ key, Icon }) => (
              <li key={key} className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1.5", key === active && "bg-teal-50 font-bold text-teal-900")}>
                <Icon className="size-3.5 flex-none" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0">
          <div className="flex h-11 items-center gap-2.5 border-b border-[#eceeed] bg-white px-3 text-xs">
            <Menu className="size-4 flex-none text-[#808080] min-[1081px]:hidden" />
            <b className="truncate text-[13px] text-[#171717]">{title}</b>
            <span dir="ltr" className="ms-auto hidden items-center gap-1 font-latin text-[11px] text-[#808080] sm:flex">
              {host}
              <ExternalLink className="size-3" />
            </span>
          </div>
          <div className={cn("flex flex-col gap-3 p-3 sm:p-4", bodyClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}
