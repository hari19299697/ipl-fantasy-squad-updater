-- Drop existing restrictive policies on tournament_auction_rules
DROP POLICY IF EXISTS "Anyone authenticated can view tournament auction rules" ON public.tournament_auction_rules;
DROP POLICY IF EXISTS "Tournament admins can manage tournament auction rules" ON public.tournament_auction_rules;

-- Create permissive policies for tournament_auction_rules (like other tables during development)
CREATE POLICY "Allow all operations on tournament auction rules" 
ON public.tournament_auction_rules 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Drop existing restrictive policies on tournament_scoring_rules
DROP POLICY IF EXISTS "Anyone authenticated can view tournament scoring rules" ON public.tournament_scoring_rules;
DROP POLICY IF EXISTS "Tournament admins can manage tournament scoring rules" ON public.tournament_scoring_rules;

-- Create permissive policies for tournament_scoring_rules (like other tables during development)
CREATE POLICY "Allow all operations on tournament scoring rules" 
ON public.tournament_scoring_rules 
FOR ALL 
USING (true) 
WITH CHECK (true);