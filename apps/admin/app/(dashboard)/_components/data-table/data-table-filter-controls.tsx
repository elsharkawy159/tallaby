"use client";

import { CalendarRange, X } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";

import type { DataTableFilterOption } from "./data-table.types";

/** Radix Select cannot hold an empty string value, so "all" stands in for it. */
const ALL = "__all__";

export function DataTableSelectFilter({
  title,
  options,
  value,
  allLabel,
  onChange,
}: {
  title: string;
  options: DataTableFilterOption[];
  value: string | undefined;
  allLabel?: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? null : next)}
    >
      <SelectTrigger
        size="sm"
        className="!h-8 w-auto min-w-36 border-dashed"
        aria-label={title}
      >
        <SelectValue placeholder={title} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel ?? `All ${title.toLowerCase()}`}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function DataTableDateRangeFilter({
  title,
  from,
  to,
  onChange,
}: {
  title: string;
  from: string | undefined;
  to: string | undefined;
  onChange: (range: { from: string | null; to: string | null }) => void;
}) {
  const isActive = Boolean(from || to);
  const summary = from && to
    ? `${formatDay(from)} – ${formatDay(to)}`
    : from
      ? `From ${formatDay(from)}`
      : to
        ? `Until ${formatDay(to)}`
        : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <CalendarRange className="mr-2 h-4 w-4" />
          {title}
          {summary && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {summary}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="space-y-1.5">
          <Label htmlFor={`${title}-from`}>From</Label>
          <Input
            id={`${title}-from`}
            type="date"
            value={from ?? ""}
            max={to || undefined}
            onChange={(event) =>
              onChange({ from: event.target.value || null, to: to ?? null })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${title}-to`}>To</Label>
          <Input
            id={`${title}-to`}
            type="date"
            value={to ?? ""}
            min={from || undefined}
            onChange={(event) =>
              onChange({ from: from ?? null, to: event.target.value || null })
            }
          />
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onChange({ from: null, to: null })}
          >
            <X className="mr-2 h-4 w-4" />
            Clear dates
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
