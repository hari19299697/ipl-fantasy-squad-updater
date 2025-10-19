-- Temporarily relax RLS policies for development (no auth yet)
-- We'll tighten these when authentication is implemented

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Anyone authenticated can view tournaments" ON tournaments;
DROP POLICY IF EXISTS "Creators and super admins can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Super admins can delete tournaments" ON tournaments;

DROP POLICY IF EXISTS "Anyone authenticated can view team owners" ON team_owners;
DROP POLICY IF EXISTS "Tournament admins can manage team owners" ON team_owners;

DROP POLICY IF EXISTS "Anyone authenticated can view players" ON players;
DROP POLICY IF EXISTS "Tournament admins can manage players" ON players;

DROP POLICY IF EXISTS "Anyone authenticated can view matches" ON matches;
DROP POLICY IF EXISTS "Tournament admins can manage matches" ON matches;

DROP POLICY IF EXISTS "Anyone authenticated can view player match points" ON player_match_points;
DROP POLICY IF EXISTS "Tournament admins can manage player match points" ON player_match_points;

DROP POLICY IF EXISTS "Anyone authenticated can view real teams" ON real_teams;
DROP POLICY IF EXISTS "Tournament admins can manage real teams" ON real_teams;

-- Create permissive policies for development (allow all operations)
-- Tournaments
CREATE POLICY "Allow all operations on tournaments"
ON tournaments FOR ALL
USING (true)
WITH CHECK (true);

-- Team Owners
CREATE POLICY "Allow all operations on team owners"
ON team_owners FOR ALL
USING (true)
WITH CHECK (true);

-- Players
CREATE POLICY "Allow all operations on players"
ON players FOR ALL
USING (true)
WITH CHECK (true);

-- Matches
CREATE POLICY "Allow all operations on matches"
ON matches FOR ALL
USING (true)
WITH CHECK (true);

-- Player Match Points
CREATE POLICY "Allow all operations on player match points"
ON player_match_points FOR ALL
USING (true)
WITH CHECK (true);

-- Real Teams
CREATE POLICY "Allow all operations on real teams"
ON real_teams FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment to remind us to tighten security later
COMMENT ON TABLE tournaments IS 'NOTE: RLS policies are currently permissive for development. Tighten when authentication is added.';
