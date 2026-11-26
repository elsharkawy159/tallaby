-- 0182_edit_with_ai_files.sql (owner request 2026-11-26: "Edit with AI")
--
-- A seller can attach a products file (CSV, Excel or PDF) in the website
-- editor's "Edit with AI" chat. The chat never imports it: it answers with a
-- card that opens the existing "Add products from a file" flow with that file
-- already picked, and the flow reads it in the browser as it reads a picked
-- file.
--
-- Files live in a PRIVATE bucket with NO storage policies: only server code
-- (service role) signs one upload per path, under the session seller's own
-- folder `<sellerId>/<storeId>/<uuid>.<ext>`, and the from-file page gets a
-- short-lived signed download link after the same owner check. 5 MB, the
-- from-file import's own limit. Additive and idempotent; the code treats a
-- missing bucket as "files can't be attached" (photos still work).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'edit-with-ai-files', 'edit-with-ai-files', false, 5242880,
  ARRAY[
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Rollback: DELETE FROM storage.buckets WHERE id = 'edit-with-ai-files' (only when empty).
