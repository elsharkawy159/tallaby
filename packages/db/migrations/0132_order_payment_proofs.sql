-- 0132_order_payment_proofs.sql (owner request 2026-10-31, ROADMAP.md F-21p)
--
-- A customer who pays a storefront order by InstaPay or a mobile wallet can
-- attach a screenshot of the transfer on the payment page. The seller sees it
-- on the order in the dashboard.
--
-- Screenshots live in a PRIVATE bucket with NO storage policies: only server
-- code (service role) uploads them, after checking the shopper owns the order,
-- and the dashboard reads them through short-lived signed URLs after checking
-- the seller owns the order. Paths are `<order id>/<random>.<ext>`; the path
-- is kept in orders.metadata.paymentProof. Additive and idempotent.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-payment-proofs', 'order-payment-proofs', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Rollback: DELETE FROM storage.buckets WHERE id = 'order-payment-proofs' (only when empty).
