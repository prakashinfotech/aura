-- Allow reviews without a linked order item (guest reviews, direct product reviews)
ALTER TABLE reviews ALTER COLUMN order_item_id DROP NOT NULL;
