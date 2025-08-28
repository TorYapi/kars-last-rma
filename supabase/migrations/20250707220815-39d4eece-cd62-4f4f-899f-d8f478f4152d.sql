-- Fix security warnings from Supabase Security Advisor

-- 1. Fix Function Search Path Mutable warnings
-- Update all SECURITY DEFINER functions to have stable search_path

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- Fix get_user_role function  
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix upsert_user_session function
CREATE OR REPLACE FUNCTION public.upsert_user_session(
  p_user_id UUID,
  p_session_id TEXT,
  p_page_views INTEGER DEFAULT 1,
  p_actions_count INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_session_uuid UUID;
BEGIN
  -- Try to update existing session
  UPDATE public.user_sessions 
  SET 
    ended_at = NULL,
    page_views = page_views + p_page_views,
    actions_count = actions_count + p_actions_count,
    duration_minutes = EXTRACT(EPOCH FROM (now() - started_at)) / 60
  WHERE user_id = p_user_id 
    AND session_id = p_session_id
    AND ended_at IS NULL
  RETURNING id INTO v_session_uuid;

  -- If no active session found, create new one
  IF v_session_uuid IS NULL THEN
    INSERT INTO public.user_sessions (user_id, session_id, page_views, actions_count)
    VALUES (p_user_id, p_session_id, p_page_views, p_actions_count)
    RETURNING id INTO v_session_uuid;
  END IF;

  RETURN v_session_uuid;
END;
$function$;

-- Fix handle_new_user function (also has search_path issues)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'ugurcan-231@hotmail.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$;

-- Fix create_order_notification function
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, message, order_id)
    VALUES (
      NEW.user_id,
      'order_approved',
      'Siparişiniz Onaylandı',
      'Siparişiniz admin tarafından onaylandı.',
      NEW.id
    );
  ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, message, order_id)
    VALUES (
      NEW.user_id,
      'order_rejected',
      'Siparişiniz Reddedildi',
      'Siparişiniz admin tarafından reddedildi.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix create_admin_notification function
CREATE OR REPLACE FUNCTION public.create_admin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  admin_id UUID;
BEGIN
  -- İlk admin kullanıcıyı bul
  SELECT id INTO admin_id 
  FROM public.profiles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, order_id)
    VALUES (
      admin_id,
      'order_pending',
      'Yeni Sipariş',
      'Onay bekleyen yeni bir sipariş var.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;