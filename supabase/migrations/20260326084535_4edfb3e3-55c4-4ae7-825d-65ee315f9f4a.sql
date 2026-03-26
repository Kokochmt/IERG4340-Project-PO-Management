
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.purchase_requests(id),
  ADD COLUMN IF NOT EXISTS quotation_id uuid REFERENCES public.quotations(id);
