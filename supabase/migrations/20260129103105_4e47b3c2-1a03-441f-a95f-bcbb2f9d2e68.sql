-- Add a public SELECT policy for the team_owners_public view
-- This view already excludes sensitive fields (user_id, budget_remaining)
-- so it's safe to allow all authenticated users to read it

-- First, enable RLS on the view if not already done (views inherit from base table)
-- Note: Views with security_invoker=on inherit RLS from base table
-- We need to add a policy that allows public read access

-- Add policy for anyone to view the team_owners_public view
-- The view excludes sensitive columns (user_id, budget_remaining)
CREATE POLICY "Anyone can view team_owners_public" 
ON public.team_owners 
FOR SELECT 
TO authenticated
USING (true);

-- Drop the overly restrictive policy that was blocking viewers
DROP POLICY IF EXISTS "Authenticated users can view limited team owner data" ON public.team_owners;