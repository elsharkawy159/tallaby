"use client";

import { useEffect, useState, type RefObject } from "react";

export interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Measures a container and returns pixel size once both axes are > 0.
 * Prefer numeric chart dimensions over ResponsiveContainer width/height="100%",
 * which briefly reports -1 and logs a console warning on first paint.
 */
export function useContainerSize (
  ref: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): ContainerSize | null {
  const [size, setSize] = useState<ContainerSize | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width > 0 && height > 0) {
        setSize((prev) =>
          prev?.width === width && prev?.height === height
            ? prev
            : { width, height },
        );
      }
    };

    update();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (ro) ro.observe(el);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls remeasure deps
  }, [ref, ...deps]);

  return size;
}
