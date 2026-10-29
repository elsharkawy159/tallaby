# @workspace/motion

Native scroll animations for Tallaby pages: CSS presets played by one
`IntersectionObserver`, the way Shopify's Dawn and Horizon themes do it. No
animation library (an ESLint `no-restricted-imports` rule in
`packages/eslint-config/base.js` keeps it that way). Used by the tallaby.com
marketing pages; store sites share its preset names and settings schema
(`presets.ts`) and draw their reveals with `packages/store-sections`
(`docs/section-rules.md` §6).

## Pieces

| File | What it is |
|---|---|
| `animations.css` | Tokens (`--anim-duration` 500 ms, `--anim-ease`, `--anim-distance` 16 px, `--anim-stagger` 80 ms) and the presets for `[data-animate]`: `fade`, `fade-up`, `slide-start`, `slide-end`, `zoom-in`, `stagger`. Import once in the app's CSS. |
| `animations.client.tsx` | `<AnimationObserver />` (mount once per layout), `initAnimations(root?)`, `replayAnimation(el)`, `destroyAnimations(root?)`. |
| `init-script.ts` | `ANIMATIONS_INIT_SCRIPT`: the inline `<head>` script that adds `js-animations` to `<html>` before paint (put `suppressHydrationWarning` on `<html>`). |
| `components.tsx`, `intro.tsx` | Small server-safe helpers that only write data attributes: `Reveal`, `StaggerChildren`, `CountUp`, `MotionScope`, `Intro`, `IntroWords`. |
| `presets.ts` | Pure and tested: `animationPresetSchema` (`inherit`, `none` + the presets), `animationDefaultSchema` (`auto` + the presets), `animationSpeedSchema`, `siteAnimationSchema`, `parseAnimationSetting` (old names `scale-in` → `zoom-in`, `fade-in` → `fade`), `resolveAnimation`. |

## Rules

- **Markup only.** Components stay Server Components and only render
  `data-animate`, `data-animate-item` and `--animation-order`; all JavaScript
  is the one observer.
- **Visible without JS and with reduced motion.** Elements are hidden only
  under `html.js-animations`, inside `prefers-reduced-motion: no-preference`,
  and only when they are still below the fold when found (first-screen content
  never flashes, so LCP and CLS are unaffected).
- **Once.** An element plays the first time it enters and is then left alone.
- **Opacity and transform only.** Directions are logical (`slide-start`,
  `slide-end`), so RTL pages mirror them.
- **New DOM is picked up** (App Router navigations, streamed content) by a
  debounced `MutationObserver` on `<body>`.
- Smooth scrolling is native CSS (`scroll-behavior`); no scroll library.

## Example

```tsx
import { Reveal, StaggerChildren } from "@workspace/motion";

export function Features({ items }: { items: { title: string }[] }) {
  return (
    <section>
      <Reveal as="h2">Why sellers pick Tallaby</Reveal>
      <StaggerChildren as="ul">
        {items.map((item) => (
          <li key={item.title} data-animate-item>{item.title}</li>
        ))}
      </StaggerChildren>
    </section>
  );
}
```

## Store sites

Store sections never import this package's runtime. Each section has an
Animation setting (Same as site, None, or a preset), Theme › Motion has the
master switch, a default and a speed, and `resolveAnimation` decides what a
section plays (`docs/section-rules.md` §6.6–6.9).
