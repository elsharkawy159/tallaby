"use client"

import { useMemo, useState } from "react"
import {
  ArrowUpRight,
  BookOpen,
  HelpCircle,
  KeyboardIcon,
  Search,
  Sparkles,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

const WEB_URL = (
  process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

/** Help topics link out to the marketing-site guides (Phase 24). */
const HELP_LINKS: { title: string; desc: string; href: string }[] = [
  {
    title: "Build a website from a text prompt",
    desc: "Type one sentence and let AI generate every page.",
    href: `${WEB_URL}/guides/ai-website-from-prompt`,
  },
  {
    title: "Create an ecommerce store",
    desc: "Generate product pages and sell with a custom domain.",
    href: `${WEB_URL}/guides/create-ecommerce-website`,
  },
  {
    title: "Create a portfolio website",
    desc: "Showcase your work with a gallery-ready layout.",
    href: `${WEB_URL}/guides/create-portfolio-website`,
  },
  {
    title: "Create a blog with the CMS",
    desc: "Write posts, add categories, and set per-post SEO.",
    href: `${WEB_URL}/guides/create-blog-website`,
  },
  {
    title: "Build an Arabic (RTL) website",
    desc: "Native Arabic copy with automatic right-to-left layout.",
    href: `${WEB_URL}/guides/create-arabic-website`,
  },
  {
    title: "Set up a custom domain",
    desc: "Connect your domain with DNS, verification, and SSL.",
    href: `${WEB_URL}/guides/custom-domain-setup`,
  },
]

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Ctrl / ⌘ + Z", action: "Undo" },
  { keys: "Ctrl / ⌘ + Shift + Z", action: "Redo" },
  { keys: "Delete", action: "Remove selected element" },
]

const iconButtonClass = "size-9 shrink-0"

export function BuilderHelpButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return HELP_LINKS
    return HELP_LINKS.filter(
      (l) =>
        l.title.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(iconButtonClass, className)}
              aria-label="Help & guides"
            >
              <HelpCircle className="size-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Help &amp; guides
        </TooltipContent>
      </Tooltip>

      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            Help &amp; guides
          </SheetTitle>
          <SheetDescription>
            Search guides or jump to a common task.
          </SheetDescription>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides…"
              className="ps-10"
              aria-label="Search guides"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Guides
          </p>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No guides match “{query}”.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-sm font-medium group-hover:text-primary">
                        {link.title}
                        <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {link.desc}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="mb-3 mt-7 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <KeyboardIcon className="size-3.5" />
            Keyboard shortcuts
          </p>
          <ul className="space-y-1.5">
            {SHORTCUTS.map((s) => (
              <li
                key={s.action}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{s.action}</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                  {s.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border p-5">
          <Button asChild variant="outline" className="w-full">
            <a href={`${WEB_URL}/guides`} target="_blank" rel="noopener noreferrer">
              Browse all guides
              <ArrowUpRight className="ms-2 size-4" />
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
