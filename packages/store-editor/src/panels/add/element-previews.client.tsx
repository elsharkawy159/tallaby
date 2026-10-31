"use client";

import type { ReactNode } from "react";
import type { ElementType } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Tiny HTML/CSS wireframes for the Add › Elements tiles: one simple shape per
 * element and layout preset, drawn with muted bars and boxes so the seller
 * sees what an element looks like before dragging it in. Editor only.
 */

const Line = ({ className }: { className?: string }) => <span className={cn("block h-1 rounded-full bg-muted-foreground/30", className)} />;
const Block = ({ className }: { className?: string }) => <span className={cn("block rounded-sm bg-muted-foreground/20", className)} />;
const Frame = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <span className={cn("block rounded-sm border border-dashed border-muted-foreground/40", className)}>{children}</span>
);
const Pill = ({ className }: { className?: string }) => <span className={cn("block h-2.5 rounded-sm bg-primary/70", className)} />;
const Photo = ({ className }: { className?: string }) => (
  <span className={cn("relative block overflow-hidden rounded-sm bg-muted-foreground/20", className)}>
    <span className="absolute bottom-0 start-1 size-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-muted-foreground/40" />
    <span className="absolute end-1 top-1 size-1.5 rounded-full bg-muted-foreground/40" />
  </span>
);
const Row = ({ className, children }: { className?: string; children: ReactNode }) => <span className={cn("flex items-center gap-1", className)}>{children}</span>;
const Col = ({ className, children }: { className?: string; children: ReactNode }) => <span className={cn("flex flex-col gap-1", className)}>{children}</span>;
const Play = () => <span className="size-0 border-y-[4px] border-s-[6px] border-y-transparent border-s-white" />;
const Video = ({ className }: { className?: string }) => (
  <span className={cn("grid place-items-center rounded-sm bg-foreground/60", className)}>
    <Play />
  </span>
);
const Product = () => (
  <Col className="flex-1">
    <Photo className="h-5" />
    <Line className="w-full" />
    <Line className="w-1/2 bg-primary/60" />
  </Col>
);

const ELEMENT_PREVIEWS: Record<ElementType, () => ReactNode> = {
  section: () => (
    <Frame className="w-full p-1">
      <Col className="items-center">
        <Line className="h-1.5 w-1/2" />
        <Line className="w-3/4" />
      </Col>
    </Frame>
  ),
  container: () => (
    <Frame className="w-full px-3 py-1.5">
      <Block className="h-4 w-full" />
    </Frame>
  ),
  card: () => (
    <span className="block w-3/4 rounded-sm border bg-background p-1 shadow-sm">
      <Col>
        <Photo className="h-4" />
        <Line className="w-3/4" />
      </Col>
    </span>
  ),
  pattern: () => (
    <span className="grid w-full grid-cols-6 gap-0.5">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={cn("block size-1.5 rounded-full", i % 2 ? "bg-muted-foreground/20" : "bg-muted-foreground/40")} />
      ))}
    </span>
  ),
  div: () => <Frame className="h-6 w-3/4" />,
  vFlex: () => (
    <Col className="w-2/3">
      <Block className="h-1.5" />
      <Block className="h-1.5" />
      <Block className="h-1.5" />
    </Col>
  ),
  hFlex: () => (
    <Row className="w-full">
      <Block className="h-6 flex-1" />
      <Block className="h-6 flex-1" />
      <Block className="h-6 flex-1" />
    </Row>
  ),
  grid: () => (
    <span className="grid w-3/4 grid-cols-2 gap-1">
      <Block className="h-2.5" />
      <Block className="h-2.5" />
      <Block className="h-2.5" />
      <Block className="h-2.5" />
    </span>
  ),
  accordion: () => (
    <Col className="w-full">
      {[0, 1, 2].map((i) => (
        <Row key={i} className="justify-between rounded-sm border px-1 py-0.5">
          <Line className="w-1/2" />
          <span className="text-[8px] leading-none text-muted-foreground">+</span>
        </Row>
      ))}
    </Col>
  ),
  accordionItem: () => (
    <Col className="w-full rounded-sm border p-1">
      <Row className="justify-between">
        <Line className="h-1.5 w-1/2" />
        <span className="text-[8px] leading-none text-muted-foreground">−</span>
      </Row>
      <Line className="w-3/4" />
    </Col>
  ),
  heading: () => <span className="text-base font-bold leading-none text-foreground/70">Aa</span>,
  paragraph: () => (
    <Col className="w-full">
      <Line className="w-full" />
      <Line className="w-full" />
      <Line className="w-2/3" />
    </Col>
  ),
  text: () => <Line className="w-2/3" />,
  blockQuote: () => (
    <Row className="w-full gap-1.5">
      <span className="block h-6 w-0.5 rounded-full bg-primary/70" />
      <Col className="flex-1">
        <Line className="w-full" />
        <Line className="w-2/3" />
      </Col>
    </Row>
  ),
  button: () => <Pill className="h-3.5 w-1/2 rounded-md" />,
  image: () => <Photo className="h-8 w-3/4" />,
  video: () => <Video className="h-8 w-3/4" />,
  videoPlaylist: () => (
    <Row className="w-full">
      <Video className="h-7 flex-[2]" />
      <Col className="flex-1">
        <Block className="h-2" />
        <Block className="h-2" />
        <Block className="h-2" />
      </Col>
    </Row>
  ),
  videoItem: () => (
    <Row className="w-full">
      <Video className="h-4 w-7" />
      <Line className="flex-1" />
    </Row>
  ),
  carousel: () => (
    <Col className="w-full items-center">
      <Row className="w-full">
        <span className="text-[8px] leading-none text-muted-foreground">‹</span>
        <Photo className="h-6 flex-1" />
        <span className="text-[8px] leading-none text-muted-foreground">›</span>
      </Row>
      <Row className="gap-0.5">
        <span className="size-1 rounded-full bg-primary/70" />
        <span className="size-1 rounded-full bg-muted-foreground/30" />
        <span className="size-1 rounded-full bg-muted-foreground/30" />
      </Row>
    </Col>
  ),
  slide: () => (
    <span className="relative block h-8 w-3/4">
      <Photo className="h-full" />
      <Line className="absolute bottom-1.5 start-1.5 w-1/2 bg-background/90" />
    </span>
  ),
  divider: () => <span className="block h-px w-full bg-muted-foreground/50" />,
  spacer: () => (
    <Col className="w-2/3 items-center gap-0.5">
      <Block className="h-1.5 w-full" />
      <span className="text-[8px] leading-none text-muted-foreground">↕</span>
      <Block className="h-1.5 w-full" />
    </Col>
  ),
  icon: () => <span className="text-lg leading-none text-primary/80">★</span>,
  badge: () => <span className="rounded-full bg-primary/70 px-2 py-0.5 text-[8px] font-semibold leading-none text-primary-foreground">NEW</span>,
  list: () => (
    <Col className="w-full">
      {[0, 1, 2].map((i) => (
        <Row key={i}>
          <span className="size-1 shrink-0 rounded-full bg-muted-foreground/50" />
          <Line className="w-2/3" />
        </Row>
      ))}
    </Col>
  ),
  listItem: () => (
    <Row className="w-full">
      <span className="size-1 shrink-0 rounded-full bg-muted-foreground/50" />
      <Line className="w-2/3" />
    </Row>
  ),
  linkBlock: () => (
    <Frame className="w-3/4 border-solid border-primary/50 p-1">
      <Col>
        <Line className="w-1/2" />
        <Line className="w-3/4" />
      </Col>
    </Frame>
  ),
  textLink: () => <span className="text-[10px] leading-none text-primary underline">link</span>,
  productList: () => (
    <Row className="w-full items-start">
      <Product />
      <Product />
      <Product />
    </Row>
  ),
  categoryList: () => (
    <Row className="w-full justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <Col key={i} className="items-center">
          <span className="block size-5 rounded-full bg-muted-foreground/20" />
          <Line className="w-4" />
        </Col>
      ))}
    </Row>
  ),
  postList: () => (
    <Col className="w-full">
      {[0, 1].map((i) => (
        <Row key={i}>
          <Photo className="h-3.5 w-5 shrink-0" />
          <Col className="flex-1">
            <Line className="w-full" />
            <Line className="w-1/2" />
          </Col>
        </Row>
      ))}
    </Col>
  ),
  storeForm: () => (
    <Col className="w-3/4">
      <Frame className="h-2.5 border-solid" />
      <Frame className="h-2.5 border-solid" />
      <Pill className="w-1/2" />
    </Col>
  ),
  addToCart: () => (
    <span className="flex h-4 w-3/4 items-center justify-center gap-1 rounded-md bg-primary/70">
      <span className="text-[8px] leading-none text-primary-foreground">🛒</span>
      <Line className="w-1/3 bg-primary-foreground/80" />
    </span>
  ),
  wishlistButton: () => (
    <span className="grid size-6 place-items-center rounded-full border text-xs leading-none text-rose-500">♥</span>
  ),
  marquee: () => (
    <Row className="w-full overflow-hidden rounded-sm bg-foreground/70 px-1 py-1">
      <Line className="w-4 shrink-0 bg-background/80" />
      <span className="text-[6px] leading-none text-background/80">✦</span>
      <Line className="w-4 shrink-0 bg-background/80" />
      <span className="text-[6px] leading-none text-background/80">✦</span>
      <Line className="w-4 shrink-0 bg-background/80" />
    </Row>
  ),
  countdown: () => (
    <Row className="gap-0.5">
      {["02", "14", "37"].map((n, i) => (
        <span key={n} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-[8px] leading-none text-muted-foreground">:</span>}
          <span className="rounded-sm bg-foreground/70 px-1 py-0.5 font-mono text-[8px] leading-none text-background">{n}</span>
        </span>
      ))}
    </Row>
  ),
  languageSwitcher: () => (
    <Row className="rounded-md border p-0.5 text-[8px] font-semibold leading-none">
      <span className="rounded-sm bg-primary/70 px-1 py-0.5 text-primary-foreground">ع</span>
      <span className="px-1 py-0.5 text-muted-foreground">EN</span>
    </Row>
  ),
  storeLogo: () => (
    <Row>
      <span className="block size-4 rounded-md bg-primary/70" />
      <Line className="h-1.5 w-8" />
    </Row>
  ),
  themeToggle: () => (
    <span className="flex h-3.5 w-7 items-center rounded-full bg-muted-foreground/30 p-0.5">
      <span className="block size-2.5 rounded-full bg-background shadow-sm" />
    </span>
  ),
  accountLink: () => (
    <span className="grid size-6 place-items-center rounded-full border">
      <Col className="items-center gap-0.5">
        <span className="block size-1.5 rounded-full bg-muted-foreground/50" />
        <span className="block h-1 w-3 rounded-t-full bg-muted-foreground/50" />
      </Col>
    </span>
  ),
  appInstall: () => (
    <Row className="gap-1.5">
      <span className="block h-7 w-4 rounded-[3px] border-2 border-foreground/50" />
      <Pill className="w-8" />
    </Row>
  ),
  mobileMenu: () => (
    <Col className="w-4 gap-0.5">
      <span className="block h-0.5 rounded-full bg-foreground/60" />
      <span className="block h-0.5 rounded-full bg-foreground/60" />
      <span className="block h-0.5 rounded-full bg-foreground/60" />
    </Col>
  ),
  productBreadcrumbs: () => (
    <Row className="text-[7px] leading-none text-muted-foreground">
      <Line className="w-3" />›<Line className="w-3" />›<Line className="w-4 bg-foreground/50" />
    </Row>
  ),
  productGallery: () => (
    <Row className="w-full items-stretch">
      <Col className="w-3">
        <Block className="h-2" />
        <Block className="h-2" />
        <Block className="h-2" />
      </Col>
      <Photo className="h-8 flex-1" />
    </Row>
  ),
  productPrice: () => (
    <Row className="gap-1.5 text-[10px] font-bold leading-none">
      <span className="text-foreground/70">250</span>
      <span className="text-[8px] font-normal text-muted-foreground line-through">320</span>
    </Row>
  ),
  productStock: () => (
    <Row>
      <span className="size-1.5 rounded-full bg-emerald-500" />
      <Line className="w-8" />
    </Row>
  ),
  productStockBadge: () => <span className="rounded-full bg-orange-500/80 px-1.5 py-0.5 text-[8px] leading-none text-white">🔥 3</span>,
  productRating: () => <span className="text-[10px] leading-none tracking-tight text-amber-500">★★★★☆</span>,
  productVariants: () => (
    <Col>
      <Row>
        {["bg-rose-400", "bg-sky-400", "bg-emerald-400"].map((c) => (
          <span key={c} className={cn("block size-2.5 rounded-full", c)} />
        ))}
      </Row>
      <Row>
        {["S", "M", "L"].map((s) => (
          <span key={s} className="rounded-sm border px-1 text-[7px] leading-tight text-muted-foreground">
            {s}
          </span>
        ))}
      </Row>
    </Col>
  ),
  productBuyBox: () => (
    <Row className="w-full">
      <span className="flex h-3.5 items-center rounded-sm border px-0.5 text-[7px] leading-none text-muted-foreground">− 1 +</span>
      <Pill className="h-3.5 flex-1 rounded-md" />
    </Row>
  ),
  productDetails: () => (
    <Col className="w-full">
      {[0, 1].map((i) => (
        <Row key={i} className="justify-between border-b border-muted-foreground/20 pb-0.5">
          <Line className="w-1/2" />
          <span className="text-[7px] leading-none text-muted-foreground">⌄</span>
        </Row>
      ))}
    </Col>
  ),
  productContent: () => (
    <Col className="w-full">
      <Line className="h-1.5 w-1/3" />
      <Line className="w-full" />
      <Line className="w-3/4" />
    </Col>
  ),
  productSeller: () => (
    <Row className="w-full rounded-sm border p-1">
      <span className="block size-4 shrink-0 rounded-full bg-muted-foreground/30" />
      <Col className="flex-1">
        <Line className="w-2/3" />
        <Line className="w-1/3" />
      </Col>
    </Row>
  ),
  productReviews: () => (
    <Col className="w-full">
      <span className="text-[8px] leading-none text-amber-500">★★★★★</span>
      <Line className="w-full" />
      <Line className="w-2/3" />
    </Col>
  ),
};

const PRESET_PREVIEWS: Record<string, () => ReactNode> = {
  "centered-stack": () => (
    <Col className="w-full items-center">
      <Line className="h-1.5 w-1/2" />
      <Line className="w-3/4" />
      <Pill className="h-2 w-1/3" />
    </Col>
  ),
  "two-column": () => (
    <Row className="w-full">
      <Block className="h-7 flex-1" />
      <Block className="h-7 flex-1" />
    </Row>
  ),
  "media-text": () => (
    <Row className="w-full">
      <Photo className="h-7 flex-1" />
      <Col className="flex-1">
        <Line className="h-1.5 w-3/4" />
        <Line className="w-full" />
        <Pill className="h-2 w-1/2" />
      </Col>
    </Row>
  ),
  "card-grid-3": () => (
    <Row className="w-full">
      {[0, 1, 2].map((i) => (
        <Col key={i} className="flex-1 rounded-sm border p-0.5">
          <Photo className="h-3" />
          <Line className="w-3/4" />
        </Col>
      ))}
    </Row>
  ),
  "feature-row": () => (
    <Row className="w-full">
      {[0, 1, 2].map((i) => (
        <Col key={i} className="flex-1 items-center">
          <span className="block size-2.5 rounded-full bg-primary/60" />
          <Line className="w-full" />
        </Col>
      ))}
    </Row>
  ),
  "stat-row": () => (
    <Row className="w-full justify-around text-[10px] font-bold leading-none text-foreground/60">
      {["24", "8K", "99%"].map((n) => (
        <Col key={n} className="items-center">
          <span>{n}</span>
          <Line className="w-4" />
        </Col>
      ))}
    </Row>
  ),
};

/** The preview box shown above a palette tile's label. */
export function PalettePreview({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-muted/50 px-2.5">
      {children}
    </span>
  );
}

export function elementPreview(type: ElementType): ReactNode | null {
  return ELEMENT_PREVIEWS[type]?.() ?? null;
}

export function presetPreview(id: string): ReactNode | null {
  return PRESET_PREVIEWS[id]?.() ?? null;
}
