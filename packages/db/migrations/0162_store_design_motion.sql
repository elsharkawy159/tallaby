-- Theme › Motion settings per store (ROADMAP.md F-88, docs/motion-v2-plan.md).
--
-- Bug: `designSystem.motion` (reveal, hoverZoom, default, speed, and from
-- motion v2 intensity) was never saved. `store_design_systems` only had
-- colors/typography/spacing, and Drizzle silently dropped the `motion` key on
-- every write, so a template's or a seller's motion settings were lost on
-- save, template apply, revision restore and publish.
--
-- Adds a nullable `motion` jsonb with no default. NULL means "defaults" and
-- the code then leaves `motion` out of the design system, so every existing
-- store renders exactly as today (owner: running stores must not change).
--
-- Additive and idempotent. Apply on staging, then production, BEFORE
-- deploying the code that ships with it: the design-system queries in
-- packages/lib select the column, so older databases would fail every
-- editor load, save and publish.

alter table public.store_design_systems add column if not exists motion jsonb;

comment on column public.store_design_systems.motion is
  'Theme motion settings (designSystemSchema.motion); NULL = defaults (0162).';
