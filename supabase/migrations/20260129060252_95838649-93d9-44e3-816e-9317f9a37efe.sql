-- ============================================================
-- SECURITY FIX: Update handle_new_user_role to use secure config
-- ============================================================

-- Create a secure configuration table for admin settings
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and restrict access to super_admin only
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view/modify admin_config
CREATE POLICY "Super admins can manage admin config"
  ON public.admin_config
  FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert a new secure admin code (random UUID-based code)
INSERT INTO public.admin_config (key, value)
VALUES ('admin_signup_code', 'SECURE_' || replace(gen_random_uuid()::text, '-', ''))
ON CONFLICT (key) DO UPDATE SET value = 'SECURE_' || replace(gen_random_uuid()::text, '-', ''), updated_at = now();

-- Update the trigger function to read from secure config table
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_code_value text;
BEGIN
  -- Get the admin code from secure config table
  SELECT value INTO admin_code_value 
  FROM public.admin_config 
  WHERE key = 'admin_signup_code';
  
  -- Check for the admin code in user metadata against secure config
  IF admin_code_value IS NOT NULL AND NEW.raw_user_meta_data->>'admin_code' = admin_code_value THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- SECURITY FIX: Restrict team_owners table visibility
-- ============================================================

-- Create a public view that excludes sensitive fields (user_id, budget_remaining)
CREATE OR REPLACE VIEW public.team_owners_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    tournament_id,
    name,
    short_name,
    color,
    total_points,
    created_at
  FROM public.team_owners;

-- Drop existing overly permissive policies on team_owners
DROP POLICY IF EXISTS "Allow all operations on team owners" ON public.team_owners;
DROP POLICY IF EXISTS "Anyone can view team owners" ON public.team_owners;

-- Create new restrictive SELECT policy - users can only see full data if:
-- 1. They are the team owner themselves (user_id = auth.uid())
-- 2. They are a super_admin or tournament_admin
-- 3. They have tournament permission for the tournament
CREATE POLICY "Authenticated users can view limited team owner data"
  ON public.team_owners
  FOR SELECT
  USING (
    -- Own team - can see everything
    user_id = auth.uid()
    -- Admins can see everything  
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'tournament_admin')
    -- Tournament participants can see (but budget is still visible - we'll handle in app)
    OR public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
    OR public.has_tournament_permission(auth.uid(), tournament_id, 'team_owner')
  );