-- Removing a variant must never delete order history. order_items.variant_id
-- was ON DELETE CASCADE, so every product edit (which used to delete and
-- re-insert all variants) silently deleted the order lines that referenced
-- them. Order lines keep their own price/title snapshot, so SET NULL is safe.
-- wishlist_items had no action, which made removing a wishlisted variant fail.
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;
ALTER TABLE order_items
  ADD CONSTRAINT order_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_variant_id_fkey;
ALTER TABLE wishlist_items
  ADD CONSTRAINT wishlist_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
