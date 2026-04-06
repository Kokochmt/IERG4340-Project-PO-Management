
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'buying_manager';

ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS review_comment text;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
