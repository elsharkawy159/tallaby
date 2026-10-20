"use client";

import type { ReactNode } from "react";

/**
 * Small schematic drawings for `layout` pickers (P4B-05): blocks for images,
 * lines for text, a pill for the button. Drawn in `currentColor`, so they
 * follow the picker's selected/idle colours. Unknown keys get a plain card.
 */
const img = (x: number, y: number, w: number, h: number) => <rect x={x} y={y} width={w} height={h} rx="1.5" fill="currentColor" opacity="0.28" />;
const line = (x: number, y: number, w: number, o = 0.55) => <rect x={x} y={y} width={w} height="2.5" rx="1.25" fill="currentColor" opacity={o} />;
const pill = (x: number, y: number, w = 12) => <rect x={x} y={y} width={w} height="4.5" rx="2.25" fill="currentColor" opacity="0.9" />;
const circle = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} fill="currentColor" opacity="0.28" />;

const repeat = (count: number, draw: (i: number) => ReactNode) => Array.from({ length: count }, (_, i) => <g key={i}>{draw(i)}</g>);

const DIAGRAMS: Record<string, ReactNode> = {
  "grid-2": repeat(2, (i) => <>{img(4 + i * 28, 6, 24, 18)}{line(4 + i * 28, 27, 16)}</>),
  "grid-3": repeat(3, (i) => <>{img(4 + i * 19, 6, 16, 16)}{line(4 + i * 19, 25, 11)}</>),
  "grid-4": repeat(4, (i) => <>{img(4 + i * 14, 8, 12, 12)}{line(4 + i * 14, 23, 8)}</>),
  carousel: (
    <>
      {repeat(4, (i) => <>{img(4 + i * 17, 6, 15, 17)}{line(4 + i * 17, 26, 9)}</>)}
      {circle(30, 33, 1)}{circle(34, 33, 1)}
    </>
  ),
  circles: repeat(4, (i) => <>{circle(11 + i * 14, 15, 6)}{line(6 + i * 14, 25, 10)}</>),
  list: repeat(3, (i) => <>{img(6, 5 + i * 10, 8, 7)}{line(18, 7 + i * 10, 30)}{line(18, 10 + i * 10, 18, 0.35)}</>),
  horizontal: repeat(2, (i) => <>{img(4 + i * 28, 8, 10, 18)}{line(16 + i * 28, 11, 12)}{line(16 + i * 28, 16, 8, 0.35)}</>),
  "split-start": <>{img(4, 5, 28, 26)}{line(36, 10, 22)}{line(36, 15, 16, 0.35)}{pill(36, 22)}</>,
  "split-end": <>{line(4, 10, 22)}{line(4, 15, 16, 0.35)}{pill(4, 22)}{img(32, 5, 28, 26)}</>,
  stacked: <>{img(12, 4, 40, 16)}{line(18, 23, 28)}{line(22, 28, 20, 0.35)}</>,
  centered: <>{line(16, 9, 32)}{line(22, 15, 20, 0.35)}{pill(26, 22)}</>,
  overlay: <>{img(2, 2, 60, 32)}{line(8, 12, 28, 0.9)}{line(8, 17, 20, 0.6)}{pill(8, 23)}</>,
  "overlay-center": <>{img(2, 2, 60, 32)}{line(16, 12, 32, 0.9)}{line(22, 17, 20, 0.6)}{pill(26, 23)}</>,
  editorial: <>{img(4, 4, 34, 28)}{line(42, 6, 18, 0.9)}{line(42, 11, 14)}{img(42, 18, 18, 14)}</>,
  product: <>{line(4, 10, 22)}{line(4, 15, 14, 0.35)}{pill(4, 22)}{img(34, 4, 26, 28)}{pill(38, 26, 10)}</>,
  banner: <>{img(2, 8, 60, 20)}{line(12, 15, 24, 0.9)}{pill(42, 15)}</>,
  tiles: repeat(3, (i) => <>{img(4 + i * 19, 6, 16, 24)}{line(6 + i * 19, 24, 10, 0.9)}</>),
  countdown: <>{line(16, 7, 32)}{repeat(4, (i) => img(12 + i * 11, 13, 8, 9))}{pill(26, 26)}</>,
  quote: <>{line(10, 8, 44, 0.9)}{line(14, 14, 36, 0.9)}{line(24, 22, 16, 0.35)}{circle(32, 30, 3)}</>,
  row: repeat(4, (i) => <>{line(4 + i * 15, 12, 10, 0.9)}{line(4 + i * 15, 18, 12, 0.35)}</>),
  steps: repeat(3, (i) => <>{circle(12 + i * 20, 12, 5)}{line(5 + i * 20, 22, 14)}{line(7 + i * 20, 27, 10, 0.35)}</>),
  columns: repeat(4, (i) => <>{line(4 + i * 15, 8, 10, 0.9)}{line(4 + i * 15, 14, 12, 0.35)}{line(4 + i * 15, 19, 9, 0.35)}{line(4 + i * 15, 24, 11, 0.35)}</>),
  minimal: <>{line(4, 16, 12, 0.9)}{line(26, 16, 8, 0.35)}{line(38, 16, 8, 0.35)}{circle(56, 17, 3)}</>,
  "centered-logo": <>{line(4, 17, 8, 0.35)}{line(14, 17, 8, 0.35)}{img(26, 12, 12, 10)}{circle(52, 17, 3)}{circle(58, 17, 2.5)}</>,
  "two-columns": <>{repeat(2, (c) => repeat(3, (i) => <>{line(4 + c * 30, 6 + i * 10, 24, 0.9)}{line(4 + c * 30, 10 + i * 10, 18, 0.35)}</>))}</>,
  narrow: <>{line(16, 8, 32, 0.9)}{line(16, 14, 32)}{line(16, 19, 28)}{line(16, 24, 30)}</>,
  wide: <>{line(4, 8, 40, 0.9)}{line(4, 14, 56)}{line(4, 19, 52)}{line(4, 24, 54)}</>,
};

export function LayoutDiagram({ name, className }: { name?: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 36" className={className} aria-hidden focusable="false">
      {(name && DIAGRAMS[name]) ?? <>{img(4, 4, 56, 18)}{line(4, 26, 30)}</>}
    </svg>
  );
}
