
CREATE TYPE public.app_role AS ENUM ('observer', 'casual_buyer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'casual_buyer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.purchase_requests
  ADD COLUMN currency text NOT NULL DEFAULT 'HKD',
  ADD COLUMN remarks text,
  ADD COLUMN file_url text;

ALTER TABLE public.quotations
  ADD COLUMN currency text NOT NULL DEFAULT 'HKD',
  ADD COLUMN remarks text,
  ADD COLUMN file_url text;

ALTER TABLE public.purchase_orders
  ADD COLUMN currency text NOT NULL DEFAULT 'HKD',
  ADD COLUMN remarks text,
  ADD COLUMN file_url text,
  ADD COLUMN delivery_location text,
  ADD COLUMN goods_description text,
  ADD COLUMN quantity integer;

ALTER TABLE public.invoices
  ADD COLUMN currency text NOT NULL DEFAULT 'HKD',
  ADD COLUMN remarks text,
  ADD COLUMN file_url text;

ALTER TABLE public.goods_received
  ADD COLUMN remarks text,
  ADD COLUMN file_url text,
  ADD COLUMN quantity_received integer;

DROP POLICY "Allow all access to purchase_requests" ON public.purchase_requests;
CREATE POLICY "Auth can view requests" ON public.purchase_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buyers can insert requests" ON public.purchase_requests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can update requests" ON public.purchase_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can delete requests" ON public.purchase_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));

DROP POLICY "Allow all access to quotations" ON public.quotations;
CREATE POLICY "Auth can view quotations" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buyers can insert quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can update quotations" ON public.quotations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can delete quotations" ON public.quotations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));

DROP POLICY "Allow all access to purchase_orders" ON public.purchase_orders;
CREATE POLICY "Auth can view orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buyers can insert orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can update orders" ON public.purchase_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can delete orders" ON public.purchase_orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));

DROP POLICY "Allow all access to invoices" ON public.invoices;
CREATE POLICY "Auth can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buyers can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));

DROP POLICY "Allow all access to goods_received" ON public.goods_received;
CREATE POLICY "Auth can view grn" ON public.goods_received FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buyers can insert grn" ON public.goods_received FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can update grn" ON public.goods_received FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));
CREATE POLICY "Buyers can delete grn" ON public.goods_received FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'casual_buyer'));

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', true, 5242880);

CREATE POLICY "Auth users can upload docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Anyone can view docs" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
