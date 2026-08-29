ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "is_commission_exempt" boolean DEFAULT false NOT NULL;
