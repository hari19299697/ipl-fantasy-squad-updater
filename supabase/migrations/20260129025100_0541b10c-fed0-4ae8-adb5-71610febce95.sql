-- =====================================================
-- Security Migration: Implement Proper RLS Policies
-- =====================================================

-- Drop all permissive development policies first
DROP POLICY IF EXISTS "Allow all operations on tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow all operations on team_owners" ON public.team_owners;
DROP POLICY IF EXISTS "Allow all operations on players" ON public.players;
DROP POLICY IF EXISTS "Allow all operations on matches" ON public.matches;
DROP POLICY IF EXISTS "Allow all operations on player_match_points" ON public.player_match_points;
DROP POLICY IF EXISTS "Allow all operations on real_teams" ON public.real_teams;
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all operations on auction_rules" ON public.auction_rules;
DROP POLICY IF EXISTS "Allow all operations on scoring_rules" ON public.scoring_rules;
DROP POLICY IF EXISTS "Allow all operations on tournament_auction_rules" ON public.tournament_auction_rules;
DROP POLICY IF EXISTS "Allow all operations on tournament_scoring_rules" ON public.tournament_scoring_rules;

-- =====================================================
-- TOURNAMENTS TABLE
-- =====================================================
-- Anyone can view tournaments (public read access)
CREATE POLICY "Anyone can view tournaments"
ON public.tournaments FOR SELECT
USING (true);

-- Only admins can create tournaments
CREATE POLICY "Admins can create tournaments"
ON public.tournaments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- Admins or tournament creator can update
CREATE POLICY "Admins can update tournaments"
ON public.tournaments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin') OR
  created_by = auth.uid()
);

-- Only super admins can delete
CREATE POLICY "Super admins can delete tournaments"
ON public.tournaments FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- TEAM OWNERS TABLE
-- =====================================================
-- Anyone can view team owners (for leaderboard)
CREATE POLICY "Anyone can view team owners"
ON public.team_owners FOR SELECT
USING (true);

-- Only admins can manage team owners
CREATE POLICY "Admins can create team owners"
ON public.team_owners FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update team owners"
ON public.team_owners FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete team owners"
ON public.team_owners FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- PLAYERS TABLE
-- =====================================================
-- Anyone can view players
CREATE POLICY "Anyone can view players"
ON public.players FOR SELECT
USING (true);

-- Only admins can manage players
CREATE POLICY "Admins can create players"
ON public.players FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update players"
ON public.players FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete players"
ON public.players FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- MATCHES TABLE
-- =====================================================
-- Anyone can view matches
CREATE POLICY "Anyone can view matches"
ON public.matches FOR SELECT
USING (true);

-- Only admins can manage matches
CREATE POLICY "Admins can create matches"
ON public.matches FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update matches"
ON public.matches FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete matches"
ON public.matches FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- PLAYER MATCH POINTS TABLE
-- =====================================================
-- Anyone can view player points
CREATE POLICY "Anyone can view player match points"
ON public.player_match_points FOR SELECT
USING (true);

-- Only admins can manage points
CREATE POLICY "Admins can create player match points"
ON public.player_match_points FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update player match points"
ON public.player_match_points FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete player match points"
ON public.player_match_points FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- REAL TEAMS TABLE
-- =====================================================
-- Anyone can view real teams
CREATE POLICY "Anyone can view real teams"
ON public.real_teams FOR SELECT
USING (true);

-- Only admins can manage real teams
CREATE POLICY "Admins can create real teams"
ON public.real_teams FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update real teams"
ON public.real_teams FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete real teams"
ON public.real_teams FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can create categories"
ON public.categories FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- AUCTION RULES TABLE
-- =====================================================
-- Anyone can view auction rules
CREATE POLICY "Anyone can view auction rules"
ON public.auction_rules FOR SELECT
USING (true);

-- Only admins can manage auction rules
CREATE POLICY "Admins can create auction rules"
ON public.auction_rules FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update auction rules"
ON public.auction_rules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete auction rules"
ON public.auction_rules FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- SCORING RULES TABLE
-- =====================================================
-- Anyone can view scoring rules
CREATE POLICY "Anyone can view scoring rules"
ON public.scoring_rules FOR SELECT
USING (true);

-- Only admins can manage scoring rules
CREATE POLICY "Admins can create scoring rules"
ON public.scoring_rules FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update scoring rules"
ON public.scoring_rules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete scoring rules"
ON public.scoring_rules FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- TOURNAMENT AUCTION RULES TABLE
-- =====================================================
-- Anyone can view tournament auction rules
CREATE POLICY "Anyone can view tournament auction rules"
ON public.tournament_auction_rules FOR SELECT
USING (true);

-- Only admins can manage tournament auction rules
CREATE POLICY "Admins can create tournament auction rules"
ON public.tournament_auction_rules FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update tournament auction rules"
ON public.tournament_auction_rules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete tournament auction rules"
ON public.tournament_auction_rules FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- TOURNAMENT SCORING RULES TABLE
-- =====================================================
-- Anyone can view tournament scoring rules
CREATE POLICY "Anyone can view tournament scoring rules"
ON public.tournament_scoring_rules FOR SELECT
USING (true);

-- Only admins can manage tournament scoring rules
CREATE POLICY "Admins can create tournament scoring rules"
ON public.tournament_scoring_rules FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can update tournament scoring rules"
ON public.tournament_scoring_rules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Admins can delete tournament scoring rules"
ON public.tournament_scoring_rules FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

-- =====================================================
-- AUCTION LOGS TABLE - Keep existing policies, ensure proper security
-- =====================================================
-- Already has proper policies from user_roles migration

-- =====================================================
-- BID VALIDATION CONSTRAINT
-- =====================================================
-- Add check constraint to ensure bid amounts are positive
ALTER TABLE public.auction_logs 
ADD CONSTRAINT check_positive_bid_amount CHECK (bid_amount >= 0);

-- Add validation trigger for auction bids
CREATE OR REPLACE FUNCTION public.validate_auction_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_budget numeric;
BEGIN
  -- Ensure bid amount is positive
  IF NEW.bid_amount < 0 THEN
    RAISE EXCEPTION 'Bid amount cannot be negative';
  END IF;
  
  -- For bid and sold actions, validate against owner budget
  IF NEW.action IN ('bid', 'sold') AND NEW.bidder_id IS NOT NULL THEN
    SELECT budget_remaining INTO owner_budget
    FROM public.team_owners
    WHERE id = NEW.bidder_id;
    
    IF owner_budget IS NULL THEN
      RAISE EXCEPTION 'Invalid bidder ID';
    END IF;
    
    -- For sold action, ensure bid doesn't exceed budget
    IF NEW.action = 'sold' AND NEW.bid_amount > owner_budget THEN
      RAISE EXCEPTION 'Bid amount exceeds owner budget';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for bid validation
DROP TRIGGER IF EXISTS validate_auction_bid_trigger ON public.auction_logs;
CREATE TRIGGER validate_auction_bid_trigger
BEFORE INSERT ON public.auction_logs
FOR EACH ROW
EXECUTE FUNCTION public.validate_auction_bid();