import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { cn } from "@workspace/ui/lib/utils";

/**
 * People are round, stores are rounded squares: the shape alone says what an
 * entity is, wherever it appears. With no image, initials sit on a tint picked
 * from the name, so the same person or store always gets the same colour.
 */
export type EntityKind = "person" | "store";

const SIZE = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
} as const;

const TINTS = [
  "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  "bg-lime-100 text-lime-900 dark:bg-lime-950 dark:text-lime-200",
] as const;

export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0]!.charAt(0);
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
}

function tintOf(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length]!;
}

export function EntityAvatar({
  kind = "person",
  name,
  src,
  seed,
  size = "sm",
  className,
}: {
  kind?: EntityKind;
  name: string | null | undefined;
  src?: string | null;
  /** Stable id for the tint; defaults to the name. */
  seed?: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const shape = kind === "store" ? "rounded-[28%]" : "rounded-full";
  return (
    <Avatar className={cn(SIZE[size], shape, "ring-1 ring-black/5 dark:ring-white/10", className)}>
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback className={cn(shape, "font-semibold", tintOf(seed ?? name ?? ""))}>
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
