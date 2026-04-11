
ALTER TABLE public.goods_received ADD COLUMN total_amount numeric DEFAULT 0;
ALTER TABLE public.goods_received ADD COLUMN currency text NOT NULL DEFAULT 'HKD';
