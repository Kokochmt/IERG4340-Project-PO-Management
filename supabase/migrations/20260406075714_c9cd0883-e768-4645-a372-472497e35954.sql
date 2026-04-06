
ALTER TABLE public.purchase_requests ADD COLUMN created_by text;
ALTER TABLE public.quotations ADD COLUMN created_by text;
ALTER TABLE public.quotations ADD COLUMN title text;
ALTER TABLE public.purchase_orders ADD COLUMN created_by text;
ALTER TABLE public.invoices ADD COLUMN created_by text;
ALTER TABLE public.goods_received ADD COLUMN created_by text;
