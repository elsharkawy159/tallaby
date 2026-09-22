-- Admin "Send WhatsApp reminder" on pending carts. Set once, when an admin
-- first sends the reminder, so the button stays disabled for everyone.
ALTER TABLE carts ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS reminder_sent_by uuid
  REFERENCES users(id) ON DELETE SET NULL;
