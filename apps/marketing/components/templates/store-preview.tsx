import type { CSSProperties } from "react";
import { Heart, RotateCcw, Search, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { DemoProduct, StoreLook } from "@/lib/templates.data";
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

/** Full-page storefront mock for the template detail page. */
export function FullStore({ look, mobile }: { look: StoreLook; mobile?: boolean }) {
  return (
    <div aria-hidden className={cn(styles.store, mobile && styles.mobile)} style={lookVars(look)}>
      <div className={styles.announce}>FREE DELIVERY ON ORDERS OVER 1,000 EGP</div>
      <div className={styles.header}>
        <b>
          <i />
          {look.name}
        </b>
        <nav>
          <span>Shop all</span>
          <span>New in</span>
          <span>Best sellers</span>
          <span>About</span>
        </nav>
        <span className={styles.headerIcons}>
          <Search />
          <Heart />
          <ShoppingBag />
        </span>
      </div>
      <div className={cn(styles.hero, look.layout === "full" && styles.full, look.layout === "center" && styles.center)}>
        <div className={styles.heroText}>
          <h3>{look.headline}</h3>
          <p>{look.subline}</p>
          <span className={styles.button}>Shop now</span>
        </div>
        <div className={cn(styles.heroImage, look.contain && styles.contain)} style={{ backgroundImage: `url('${look.hero}')` }} />
      </div>
      <div className={styles.cats}>
        <span>All</span>
        <span>New arrivals</span>
        <span>Best sellers</span>
        <span>Gifts</span>
        <span>Sale</span>
      </div>
      <div className={styles.section}>
        <h4>
          Best sellers <small>View all →</small>
        </h4>
        <div className={styles.grid}>
          {look.products.map((p, i) => (
            <div key={i} className={styles.card}>
              <div className={cn(styles.cardImage, p.focus && styles.cover)} style={productImageStyle(p)}>
                {i === 1 ? <em>-15%</em> : null}
              </div>
              <b>{p.name}</b>
              <span>{p.price} EGP</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.strip}>
        <div>
          <Truck />
          Fast delivery across Egypt
        </div>
        <div>
          <ShieldCheck />
          Secure online payment
        </div>
        <div>
          <RotateCcw />
          14-day easy returns
        </div>
      </div>
      <div className={styles.footer}>
        <span>© 2026 {look.name}</span>
        <span>Powered by Tallaby</span>
      </div>
    </div>
  );
}
