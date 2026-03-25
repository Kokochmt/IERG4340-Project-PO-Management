-- Create enum for purchase record statuses
CREATE TYPE public.record_status AS ENUM (
  'draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'
);

-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Purchase Requests
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  requester_name TEXT NOT NULL,
  department TEXT,
  priority TEXT DEFAULT 'medium',
  status record_status DEFAULT 'draft',
  total_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quotations
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  request_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  vendor_contact TEXT,
  total_amount NUMERIC(12,2) DEFAULT 0,
  valid_until DATE,
  status record_status DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) DEFAULT 0,
  status record_status DEFAULT 'draft',
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  status record_status DEFAULT 'draft',
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goods Received
CREATE TABLE public.goods_received (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_number TEXT NOT NULL UNIQUE,
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  received_date DATE DEFAULT CURRENT_DATE,
  received_by TEXT,
  status record_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received ENABLE ROW LEVEL SECURITY;

-- For v1, allow all access (open policies)
CREATE POLICY "Allow all access to purchase_requests" ON public.purchase_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to goods_received" ON public.goods_received FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goods_received_updated_at BEFORE UPDATE ON public.goods_received FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();