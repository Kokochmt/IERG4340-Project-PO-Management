
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buyers can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Buyers can update companies" ON public.companies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Buyers can delete companies" ON public.companies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'casual_buyer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
