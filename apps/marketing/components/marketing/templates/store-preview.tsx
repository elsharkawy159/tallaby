import type { CSSProperties } from "react";
import { cn } from "@workspace/ui/lib/utils";
import type { DemoProduct, StoreLook } from "@/lib/marketing/templates.data";
import styles from "./store-preview.module.css";

function lookVars(look: StoreLook): CSSProperties {
  return {
    "--b": look.background,
    "--f": look.foreground,
    "--a": look.accent,
    "--ac": look.onAccent ?? "#fff",
    "--r": look.radius,
    "--m": look.muted,
  } as CSSProperties;
}

function productImageStyle(p: DemoProduct): CSSProperties {
  return { backgroundImage: `url('${p.image}')`, ...(p.focus ? { backgroundPosition: p.focus } : null) };
}

/**
 * Small storefront mock: header, banner and three products. Decorative only
 * (aria-hidden); the demo copy is English by design.
 */
export function MiniStore({ look, phone, className }: { look: StoreLook; phone?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn(styles.mini, phone && styles.phone, className)} style={lookVars(look)}>
      <div className={styles.miniHead}>
        <i className={styles.miniLogo} />
        {look.name}
        <nav>
          <span>Shop</span>
          <span>New in</span>
          <span>About</span>
          <span>Cart</span>
        </nav>
      </div>
      <div className={cn(styles.miniBanner, look.layout === "full" && styles.full, look.layout === "center" && styles.center)}>
        <div className={styles.miniText}>
          <b>{look.headline}</b>
          <small>{look.subline}</small>
          <em>Shop now</em>
        </div>
        <div className={cn(styles.miniImage, look.contain && styles.contain)} style={{ backgroundImage: `url('${look.hero}')` }} />
      </div>
      <div className={styles.miniProducts}>
        {look.products.slice(0, 3).map((p, i) => (
          <div key={i}>
            <span className={cn(p.focus && styles.cover)} style={productImageStyle(p)} />
            {p.name}
            <u>{p.price} EGP</u>
          </div>
        ))}
      </div>
    </div>
  );
}
