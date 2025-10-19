-- Fix Security Linter Issues (Corrected)

-- 1. Drop existing triggers first
DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
DROP TRIGGER IF EXISTS update_player_match_points_updated_at ON player_match_points;

-- 2. Drop and recreate function with proper search_path
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. Recreate triggers
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_match_points_updated_at
BEFORE UPDATE ON player_match_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Add RLS policies for tournament_auction_rules
CREATE POLICY "Anyone authenticated can view tournament auction rules"
ON tournament_auction_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tournament admins can manage tournament auction rules"
ON tournament_auction_rules FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);

-- 5. Add RLS policies for tournament_scoring_rules
CREATE POLICY "Anyone authenticated can view tournament scoring rules"
ON tournament_scoring_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tournament admins can manage tournament scoring rules"
ON tournament_scoring_rules FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);