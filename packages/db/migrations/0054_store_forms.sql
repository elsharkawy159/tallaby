-- 0054_store_forms.sql (PLAN.md §11.6, §8.4, P1-02)
--
-- Per-store forms (reference: forms) and their submissions (reference:
-- business_leads). Public submissions go through a rate-limited server action,
-- never the anon key. Submissions hold customer PII: retention is 12 months,
-- then auto-delete (D28, job added with P4-10).
--
-- Idempotent. RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS store_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  key text NOT NULL,                                    -- stable id used by sections, e.g. 'contact'
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]',                   -- validated field definitions (fixed types)
  settings jsonb NOT NULL DEFAULT '{}',                 -- notify email, success message, redirect slug
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_forms_store_key_key UNIQUE (store_id, key),
  CONSTRAINT store_forms_status_check CHECK (status IN ('active', 'disabled')),
  CONSTRAINT store_forms_key_format CHECK (key ~ '^[a-z0-9][a-z0-9_-]{0,62}$')
);

ALTER TABLE store_forms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS store_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES store_forms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, -- signed-in shopper, if any
  name text,
  email text,
  phone text,
  message text,
  data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',
  source_url text,
  ip_hash text,                                         -- salted hash, never the raw IP
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_form_submissions_status_check CHECK (status IN ('new', 'read', 'archived', 'spam'))
);

CREATE INDEX IF NOT EXISTS store_form_submissions_store_created_idx
  ON store_form_submissions (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS store_form_submissions_form_idx
  ON store_form_submissions (form_id, created_at DESC);

ALTER TABLE store_form_submissions ENABLE ROW LEVEL SECURITY;

-- A submission's store must be its form's store.
CREATE OR REPLACE FUNCTION store_form_submissions_same_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM store_forms WHERE id = NEW.form_id AND store_id = NEW.store_id) THEN
    RAISE EXCEPTION 'store_form_submissions: form % does not belong to store %', NEW.form_id, NEW.store_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_form_submissions_same_store ON store_form_submissions;
CREATE TRIGGER store_form_submissions_same_store
  BEFORE INSERT OR UPDATE OF store_id, form_id ON store_form_submissions
  FOR EACH ROW EXECUTE FUNCTION store_form_submissions_same_store();

-- Rollback: DROP TABLE store_form_submissions, store_forms; DROP FUNCTION store_form_submissions_same_store.
