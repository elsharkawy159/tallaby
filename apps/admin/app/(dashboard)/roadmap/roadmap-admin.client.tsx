"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EllipsisVertical, ExternalLink, EyeOff, Plus, Search, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import {
  ROADMAP_ADMIN_CATEGORIES,
  ROADMAP_ADMIN_STATUSES,
  ROADMAP_CATEGORY_LABELS,
  ROADMAP_STATUS_LABELS,
  type RoadmapAdminCategory,
  type RoadmapAdminStatus,
} from "@workspace/lib/admin";
import type { AdminRoadmapCard } from "@workspace/lib/admin/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { RoadmapCardDialog } from "./roadmap-card-dialog.client";
import { moveRoadmapCardAction, setRoadmapCardHiddenAction } from "./roadmap.server";

type Source = "all" | "seller" | "team";

const COLUMN_DOT: Record<RoadmapAdminStatus, string> = {
  waiting: "bg-amber-500",
  planned: "bg-sky-500",
  in_progress: "bg-primary",
  launched: "bg-emerald-500",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Africa/Cairo" });

export function RoadmapAdmin({ cards, publicUrl }: { cards: AdminRoadmapCard[]; publicUrl: string | null }) {
  const router = useRouter();
  const [items, setItems] = useState(cards);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RoadmapAdminCategory | "all">("all");
  const [source, setSource] = useState<Source>("all");
  const [showHidden, setShowHidden] = useState(false);
  const [editing, setEditing] = useState<AdminRoadmapCard | "new" | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<RoadmapAdminStatus | null>(null);
  const [, startTransition] = useTransition();

  // The server list is the truth: take it again after every refresh.
  useEffect(() => setItems(cards), [cards]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(
        (c) =>
          (showHidden || !c.hiddenAt) &&
          (category === "all" || c.category === category) &&
          (source === "all" || (source === "seller" ? c.sellerId != null : c.sellerId == null)) &&
          (!q ||
            [c.title, c.titleEn, c.description, c.descriptionEn, c.roadmapRef, c.storeName, c.sellerName]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(q)),
      )
      .sort((a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt));
  }, [items, query, category, source, showHidden]);

  const hiddenCount = items.filter((c) => c.hiddenAt).length;

  const move = (card: AdminRoadmapCard, status: RoadmapAdminStatus) => {
    if (card.status === status) return;
    const previous = card.status;
    setItems((list) => list.map((c) => (c.id === card.id ? { ...c, status } : c)));
    startTransition(async () => {
      const result = await moveRoadmapCardAction({ id: card.id, status });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        setItems((list) => list.map((c) => (c.id === card.id ? { ...c, status: previous } : c)));
        toast.error(result.error);
      }
    });
  };

  const toggleHidden = (card: AdminRoadmapCard) =>
    startTransition(async () => {
      const result = await setRoadmapCardHiddenAction({ id: card.id, hidden: !card.hiddenAt });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, store or F-id"
            className="h-9 pl-8"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as RoadmapAdminCategory | "all")}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ROADMAP_ADMIN_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {ROADMAP_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={(v) => setSource(v as Source)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="seller">Seller ideas</SelectItem>
            <SelectItem value="team">Team cards</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showHidden} onCheckedChange={setShowHidden} />
          Show hidden ({hiddenCount})
        </label>
        <div className="ml-auto flex gap-2">
          {publicUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Public page
              </a>
            </Button>
          )}
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> New card
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ROADMAP_ADMIN_STATUSES.map((status) => {
          const column = visible.filter((c) => c.status === status);
          return (
            <section
              key={status}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOverColumn(status);
              }}
              onDragLeave={() => setOverColumn((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const card = items.find((c) => c.id === dragId);
                setDragId(null);
                setOverColumn(null);
                if (card) move(card, status);
              }}
              className={cn(
                "flex min-h-40 flex-col rounded-xl border bg-muted/40 p-3 transition-colors",
                overColumn === status && "border-primary bg-primary/5",
              )}
            >
              <header className="mb-3 flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", COLUMN_DOT[status])} />
                <h2 className="text-sm font-semibold">{ROADMAP_STATUS_LABELS[status]}</h2>
                <Badge variant="secondary" className="ml-auto tabular-nums">
                  {column.length}
                </Badge>
              </header>
              <div className="flex flex-col gap-2">
                {column.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No cards</p>}
                {column.map((card) => (
                  <article
                    key={card.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(card.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverColumn(null);
                    }}
                    className={cn(
                      "cursor-grab rounded-lg border bg-card p-3 shadow-xs active:cursor-grabbing",
                      card.hiddenAt && "opacity-60",
                      dragId === card.id && "opacity-40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(card)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p dir="rtl" className="text-right text-sm font-semibold leading-snug">
                          {card.title}
                        </p>
                        {card.titleEn && <p className="mt-0.5 text-xs text-muted-foreground">{card.titleEn}</p>}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mr-1 -mt-1 size-7 shrink-0" aria-label="Card actions">
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing(card)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Move to</DropdownMenuLabel>
                          {ROADMAP_ADMIN_STATUSES.filter((s) => s !== card.status).map((s) => (
                            <DropdownMenuItem key={s} onSelect={() => move(card, s)}>
                              {ROADMAP_STATUS_LABELS[s]}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => toggleHidden(card)}>
                            {card.hiddenAt ? "Show on the roadmap" : "Hide from the roadmap"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-normal">
                        {ROADMAP_CATEGORY_LABELS[card.category]}
                      </Badge>
                      {card.roadmapRef && (
                        <Badge variant="outline" className="font-mono font-normal">
                          {card.roadmapRef}
                        </Badge>
                      )}
                      {card.hiddenAt && (
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <EyeOff className="size-3" /> Hidden
                        </Badge>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 tabular-nums">
                        <ThumbsUp className="size-3" /> {card.votes}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      {card.sellerId ? (
                        <Link href={`/sellers/${card.sellerId}`} className="hover:underline">
                          {card.storeName || card.sellerName || "Seller"}
                        </Link>
                      ) : (
                        "Tallaby team"
                      )}
                      {" · "}
                      {card.status === "launched" && card.launchedAt
                        ? `Launched ${dateFormat.format(new Date(`${card.launchedAt}T12:00:00Z`))}`
                        : dateFormat.format(new Date(card.createdAt))}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <RoadmapCardDialog
        card={editing === "new" ? null : editing}
        open={editing != null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
