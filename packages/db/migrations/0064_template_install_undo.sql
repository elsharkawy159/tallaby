-- 0064_template_install_undo.sql (PLAN.md §8.1, P4-05)
--
-- "Undo template change": applyTemplate stores the store's drafts as they
-- were just before the template was applied (design system, header, footer,
-- page drafts), so undo restores exactly that instead of re-applying the
-- previous template over later edits. undone_at marks an install that was
-- undone (it cannot be undone twice). stores.previous_template_key (0050)
-- keeps the template key to return to.
--
-- Additive and idempotent. template_installs already has RLS enabled with no
-- policies (0052, server-only).

ALTER TABLE template_installs ADD COLUMN IF NOT EXISTS previous_draft jsonb;
ALTER TABLE template_installs ADD COLUMN IF NOT EXISTS undone_at timestamptz;
