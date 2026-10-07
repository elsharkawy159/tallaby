"use client";

import { useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { ProductFilterOptions } from "../products.types";

type SellerOption = ProductFilterOptions["sellers"][number];

const ALL = "__all__";

interface SellerRailProps {
  sellers: SellerOption[];
  /** Selected seller id, or null for "All sellers". */
  selectedId: string | null;
  onSelect: (sellerId: string | null) => void;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function SellerAvatar({ seller }: { seller: SellerOption }) {
  return (
    <Avatar className="size-7 shrink-0 border border-border">
      <AvatarImage src={seller.logoUrl || undefined} alt="" />
      <AvatarFallback className="text-[10px] font-medium">
        {initials(seller.label)}
      </AvatarFallback>
    </Avatar>
  );
}

function AllSellersIcon() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
      <Store className="size-3.5 text-muted-foreground" />
    </span>
  );
}

const rowClass = (active: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
    active
      ? "bg-primary font-medium text-primary-foreground"
      : "hover:bg-accent hover:text-accent-foreground"
  );

/**
 * Seller filter for the products table: a vertical list on desktop, a
 * compact select on smaller screens so the table keeps the full width.
 */
export function SellerRail({ sellers, selectedId, onSelect }: SellerRailProps) {
  const [query, setQuery] = useState("");

  const visibleSellers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sellers;
    return sellers.filter((seller) =>
      seller.label.toLowerCase().includes(term)
    );
  }, [query, sellers]);

  return (
    <>
      {/* Mobile / tablet */}
      <div className="lg:hidden">
        <Select
          value={selectedId ?? ALL}
          onValueChange={(value) => onSelect(value === ALL ? null : value)}
        >
          <SelectTrigger className="w-full bg-card" aria-label="Filter by seller">
            <SelectValue placeholder="All sellers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              <span className="flex items-center gap-2">
                <AllSellersIcon />
                All sellers
              </span>
            </SelectItem>
            {sellers.map((seller) => (
              <SelectItem key={seller.value} value={seller.value}>
                <span className="flex min-w-0 items-center gap-2">
                  <SellerAvatar seller={seller} />
                  <span className="truncate">{seller.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop */}
      <Card className="hidden gap-0 overflow-hidden p-0 lg:sticky lg:top-0 lg:flex lg:max-h-[calc(100dvh-8.5rem)] lg:flex-col">
        <div className="border-b border-border p-3">
          <p className="mb-2 text-sm font-semibold">Sellers</p>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sellers…"
              className="h-8 pl-8 text-sm"
              aria-label="Search sellers"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <nav aria-label="Sellers" className="flex flex-col gap-0.5 p-2">
            <button
              type="button"
              aria-pressed={selectedId === null}
              onClick={() => onSelect(null)}
              className={rowClass(selectedId === null)}
            >
              <AllSellersIcon />
              <span className="truncate">All sellers</span>
            </button>
            {visibleSellers.map((seller) => {
              const active = seller.value === selectedId;
              return (
                <button
                  key={seller.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(seller.value)}
                  className={rowClass(active)}
                  title={seller.label}
                >
                  <SellerAvatar seller={seller} />
                  <span className="truncate">{seller.label}</span>
                </button>
              );
            })}
            {visibleSellers.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No sellers match “{query}”.
              </p>
            )}
          </nav>
        </div>
      </Card>
    </>
  );
}
