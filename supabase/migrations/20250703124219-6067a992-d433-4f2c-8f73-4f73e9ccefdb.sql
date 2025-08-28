
-- Firma yetkilileri için iletişim bilgileri tablosu
CREATE TABLE public.company_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  position TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Güncelleme trigger'ı ekle
CREATE TRIGGER update_company_contacts_updated_at
  BEFORE UPDATE ON public.company_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS politikaları - sadece adminler erişebilsin
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- Sadece adminler görebilir
CREATE POLICY "Only admins can view company contacts"
  ON public.company_contacts
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Sadece adminler ekleyebilir
CREATE POLICY "Only admins can insert company contacts"
  ON public.company_contacts
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Sadece adminler güncelleyebilir
CREATE POLICY "Only admins can update company contacts"
  ON public.company_contacts
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Sadece adminler silebilir
CREATE POLICY "Only admins can delete company contacts"
  ON public.company_contacts
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));
