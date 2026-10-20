-- 0066_store_top_up_proofs.sql (owner request 2026-10-18)
--
-- Manual store-wallet top-ups: the seller transfers by Vodafone Cash or
-- InstaPay, uploads the receipt, and the request waits in
-- seller_wallet_top_ups (provider 'vodafone_cash' | 'instapay', status
-- 'pending') until an admin approves it. Only the approval credits the wallet
-- (@workspace/lib/admin reviewManualStoreTopUp → postStoreWalletEntry).
--
-- Receipts live in a PRIVATE bucket. Sellers may upload into their own
-- top-level folder and read their own files; they cannot overwrite or delete
-- a receipt once uploaded. Admins read receipts through service-role signed
-- URLs. Additive and idempotent.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-top-up-proofs', 'store-top-up-proofs', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "store-top-up-proofs: owners can upload" ON storage.objects;
CREATE POLICY "store-top-up-proofs: owners can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-top-up-proofs' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "store-top-up-proofs: owners can read own" ON storage.objects;
CREATE POLICY "store-top-up-proofs: owners can read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'store-top-up-proofs' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- The admin review queue: pending manual top-ups, oldest first.
CREATE INDEX IF NOT EXISTS seller_wallet_top_ups_review_idx
  ON seller_wallet_top_ups (created_at)
  WHERE status = 'pending' AND provider IN ('vodafone_cash', 'instapay');

-- Rollback: DROP INDEX seller_wallet_top_ups_review_idx; DROP the two storage
--   policies; DELETE FROM storage.buckets WHERE id = 'store-top-up-proofs' (only when empty).
