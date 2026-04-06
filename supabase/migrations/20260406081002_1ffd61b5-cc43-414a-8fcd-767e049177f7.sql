
-- purchase_orders
DROP POLICY IF EXISTS "Buyers can insert orders" ON public.purchase_orders;
CREATE POLICY "Buyers can insert orders" ON public.purchase_orders FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can update orders" ON public.purchase_orders;
CREATE POLICY "Buyers can update orders" ON public.purchase_orders FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can delete orders" ON public.purchase_orders;
CREATE POLICY "Buyers can delete orders" ON public.purchase_orders FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- purchase_requests
DROP POLICY IF EXISTS "Buyers can insert requests" ON public.purchase_requests;
CREATE POLICY "Buyers can insert requests" ON public.purchase_requests FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can update requests" ON public.purchase_requests;
CREATE POLICY "Buyers can update requests" ON public.purchase_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can delete requests" ON public.purchase_requests;
CREATE POLICY "Buyers can delete requests" ON public.purchase_requests FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- quotations
DROP POLICY IF EXISTS "Buyers can insert quotations" ON public.quotations;
CREATE POLICY "Buyers can insert quotations" ON public.quotations FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can update quotations" ON public.quotations;
CREATE POLICY "Buyers can update quotations" ON public.quotations FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can delete quotations" ON public.quotations;
CREATE POLICY "Buyers can delete quotations" ON public.quotations FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- invoices
DROP POLICY IF EXISTS "Buyers can insert invoices" ON public.invoices;
CREATE POLICY "Buyers can insert invoices" ON public.invoices FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can update invoices" ON public.invoices;
CREATE POLICY "Buyers can update invoices" ON public.invoices FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can delete invoices" ON public.invoices;
CREATE POLICY "Buyers can delete invoices" ON public.invoices FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- goods_received
DROP POLICY IF EXISTS "Buyers can insert grn" ON public.goods_received;
CREATE POLICY "Buyers can insert grn" ON public.goods_received FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can update grn" ON public.goods_received;
CREATE POLICY "Buyers can update grn" ON public.goods_received FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can delete grn" ON public.goods_received;
CREATE POLICY "Buyers can delete grn" ON public.goods_received FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- companies
DROP POLICY IF EXISTS "Buyers can insert companies" ON public.companies;
CREATE POLICY "Buyers can insert companies" ON public.companies FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can update companies" ON public.companies;
CREATE POLICY "Buyers can update companies" ON public.companies FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Buyers can delete companies" ON public.companies;
CREATE POLICY "Buyers can delete companies" ON public.companies FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'buying_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
