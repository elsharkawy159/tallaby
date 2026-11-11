# Storefront motion perf scripts (motion v2, ROADMAP.md F-88)

Dev-only Playwright scripts; not part of any app bundle. Playwright is not a repo dependency: install it once in a scratch folder (`npm init -y && npm i playwright && npx playwright install chromium`) and pass it with `--pw=<folder>`.

- `scroll-perf.mjs <baseUrl> <outDir> [--pw=…] [--work=…] [--traces]`: slow + fast scroll of each template preview at 390 px (4× CPU) and 1280 px; writes `<outDir>/<page>-<profile>.webm` and a results JSON (frames, long tasks, forced layouts, CLS, INP≈, elements left hidden).
- `stuck-probe.mjs`: lists `[data-reveal]` elements still hidden after a full scroll (and after swiping rails).
- `video-frames.mjs`: frame sheets from a recorded video.

Run against a production build (`pnpm --filter ecommerce build`, then `next start`). The ecommerce `.env` points at production: only read pages. Baseline: `docs/motion-v2/perf-baseline.md`.
