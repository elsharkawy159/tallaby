-- Pending-carts admin list/stats filter and sort by status + last_activity.
CREATE INDEX IF NOT EXISTS carts_status_last_activity_idx
  ON carts (status, last_activity DESC NULLS LAST);
