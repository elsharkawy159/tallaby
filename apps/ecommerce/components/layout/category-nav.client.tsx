"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LayoutGrid, Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn, PRODUCT_IMAGE_FALLBACK } from "@/lib/utils";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import type { TopCategoryLink } from "@/lib/top-categories";

interface AllCategoriesMenuProps {
  categories: TopCategoryLink[];
  labels: { allCategories: string; browseAll: string };
}

export function AllCategoriesMenu({ categories, labels }: AllCategoriesMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "me-2 flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[10px] px-3.5 text-[13px] font-bold transition-colors",
          open
            ? "bg-primary text-primary-foreground"
            : "bg-[#eef3f4] text-primary hover:bg-primary hover:text-primary-foreground",
        )}
      >
        <LayoutGrid className="size-4" aria-hidden />
        {labels.allCategories}
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div ref={panelRef} id={panelId} className="absolute inset-x-0 top-full z-40">
            <div className="container">
              <div className="max-h-[min(480px,calc(100vh-170px))] overflow-y-auto overscroll-contain rounded-b-2xl border border-t-0 border-neutral-200 bg-white p-6 shadow-[0_12px_32px_rgba(20,81,99,0.14)]">
                <ul className="grid grid-cols-4 gap-3 lg:grid-cols-6">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={category.href}
                        onClick={close}
                        className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center text-xs text-neutral-800 transition-colors hover:bg-muted hover:text-primary"
                      >
                        <span className="relative flex size-18 items-center justify-center overflow-hidden rounded-full bg-[#f3f4f3]">
                          {category.image ? (
                            <ImageWithFallback
                              src={category.image}
                              fallbackSrc={PRODUCT_IMAGE_FALLBACK}
                              alt=""
                              fill
                              sizes="72px"
                              className="object-contain p-2 mix-blend-multiply"
                            />
                          ) : (
                            <Package className="size-7 text-primary/70" aria-hidden />
                          )}
                        </span>
                        <span className="line-clamp-2">{category.displayName}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 border-t border-neutral-100 pt-4">
                  <Link
                    href="/categories"
                    onClick={close}
                    className="text-[13px] font-bold text-primary hover:underline"
                  >
                    {labels.browseAll}
                  </Link>
                </div>
              </div>
            </div>
        </div>
      )}
    </>
  );
}
