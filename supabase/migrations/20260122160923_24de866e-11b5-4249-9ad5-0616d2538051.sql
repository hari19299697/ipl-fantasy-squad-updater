-- Drop existing restrictive policies on auction_rules
DROP POLICY IF EXISTS "Anyone authenticated can view auction rules" ON public.auction_rules;
DROP POLICY IF EXISTS "Admins can create auction rules" ON public.auction_rules;
DROP POLICY IF EXISTS "Creators and super admins can update auction rules" ON public.auction_rules;

-- Create permissive policies for auction_rules (like other tables during development)
CREATE POLICY "Allow all operations on auction rules" 
ON public.auction_rules 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Drop existing restrictive policies on scoring_rules
DROP POLICY IF EXISTS "Anyone authenticated can view scoring rules" ON public.scoring_rules;
DROP POLICY IF EXISTS "Admins can create scoring rules" ON public.scoring_rules;
DROP POLICY IF EXISTS "Creators and super admins can update scoring rules" ON public.scoring_rules;

-- Create permissive policies for scoring_rules (like other tables during development)
CREATE POLICY "Allow all operations on scoring rules" 
ON public.scoring_rules 
FOR ALL 
USING (true) 
WITH CHECK (true);