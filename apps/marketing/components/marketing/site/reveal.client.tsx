"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

type RevealProps<T extends React.ElementType> = {
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, "as">;

/** Fades content up the first time it scrolls into view. */
export function Reveal<T extends React.ElementType = "div">({ as, className, ...props }: RevealProps<T>) {
  const Comp = (as ?? "div") as React.ElementType;
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <Comp ref={ref} data-shown={shown} className={cn("reveal", className)} {...props} />;
}
