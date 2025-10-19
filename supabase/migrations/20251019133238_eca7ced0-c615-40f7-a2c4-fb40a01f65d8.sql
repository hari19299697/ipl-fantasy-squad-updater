-- Phase 1: Multi-Tournament Fantasy Platform Database Schema

-- 1. Create Enums
CREATE TYPE app_role AS ENUM ('super_admin', 'tournament_admin', 'team_owner', 'viewer');

-- 2. Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. Create tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create auction_rules table (master templates)
CREATE TABLE auction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  initial_budget BIGINT NOT NULL,
  min_bid BIGINT NOT NULL,
  bid_increment_type TEXT NOT NULL,
  increment_value BIGINT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 1,
  reserve_price_field TEXT NOT NULL DEFAULT 'base_price',
  max_players_per_team INTEGER NOT NULL,
  role_constraints JSONB NOT NULL DEFAULT '{}',
  auto_assignment_rule TEXT NOT NULL DEFAULT 'skip',
  is_master_template BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create tournament_auction_rules table
CREATE TABLE tournament_auction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  auction_rule_id UUID REFERENCES auction_rules(id),
  is_customized BOOLEAN DEFAULT FALSE,
  custom_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id)
);

-- 6. Create scoring_rules table (master templates)
CREATE TABLE scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  is_master_template BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create tournament_scoring_rules table
CREATE TABLE tournament_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  scoring_rule_id UUID REFERENCES scoring_rules(id),
  is_customized BOOLEAN DEFAULT FALSE,
  custom_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id)
);

-- 8. Create real_teams table (IPL teams, BBL teams, etc)
CREATE TABLE real_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, short_name)
);

-- 9. Create team_owners table (Virtual Teams)
CREATE TABLE team_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#000000',
  budget_remaining BIGINT NOT NULL,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  real_team_id UUID REFERENCES real_teams(id),
  base_price BIGINT,
  auction_price BIGINT,
  owner_id UUID REFERENCES team_owners(id),
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  match_number INTEGER NOT NULL,
  team1_id UUID REFERENCES real_teams(id),
  team2_id UUID REFERENCES real_teams(id),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, match_number)
);

-- 12. Create player_match_points table
CREATE TABLE player_match_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  details JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

-- 13. Create auction_logs table
CREATE TABLE auction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id),
  bidder_id UUID REFERENCES team_owners(id),
  bid_amount BIGINT NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);

-- 14. Create tournament_permissions table
CREATE TABLE tournament_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- 15. Create indexes for performance
CREATE INDEX idx_players_tournament ON players(tournament_id);
CREATE INDEX idx_players_owner ON players(owner_id);
CREATE INDEX idx_players_real_team ON players(real_team_id);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_player_match_points_player ON player_match_points(player_id);
CREATE INDEX idx_player_match_points_match ON player_match_points(match_id);
CREATE INDEX idx_auction_logs_tournament ON auction_logs(tournament_id);
CREATE INDEX idx_team_owners_tournament ON team_owners(tournament_id);
CREATE INDEX idx_team_owners_user ON team_owners(user_id);
CREATE INDEX idx_tournament_permissions_tournament ON tournament_permissions(tournament_id);
CREATE INDEX idx_tournament_permissions_user ON tournament_permissions(user_id);

-- 16. Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_tournament_permission(
  _user_id UUID, 
  _tournament_id UUID, 
  _required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tournament_permissions
    WHERE tournament_id = _tournament_id 
      AND user_id = _user_id 
      AND role = _required_role
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
      AND role = 'super_admin'
  )
$$;

-- 17. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 18. Add triggers for updated_at
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_match_points_updated_at
BEFORE UPDATE ON player_match_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 19. Enable Row Level Security on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_auction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_permissions ENABLE ROW LEVEL SECURITY;

-- 20. Create RLS Policies

-- user_roles: Only super_admins can manage roles
CREATE POLICY "Super admins can view all user roles"
ON user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert user roles"
ON user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update user roles"
ON user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete user roles"
ON user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- tournaments: Super admins and tournament creators can manage
CREATE POLICY "Anyone authenticated can view tournaments"
ON tournaments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create tournaments"
ON tournaments FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Creators and super admins can update tournaments"
ON tournaments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  created_by = auth.uid()
);

CREATE POLICY "Super admins can delete tournaments"
ON tournaments FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- auction_rules: Viewable by all, manageable by admins
CREATE POLICY "Anyone authenticated can view auction rules"
ON auction_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create auction rules"
ON auction_rules FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Creators and super admins can update auction rules"
ON auction_rules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  created_by = auth.uid()
);

-- scoring_rules: Viewable by all, manageable by admins
CREATE POLICY "Anyone authenticated can view scoring rules"
ON scoring_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create scoring rules"
ON scoring_rules FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'tournament_admin')
);

CREATE POLICY "Creators and super admins can update scoring rules"
ON scoring_rules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  created_by = auth.uid()
);

-- real_teams, players, matches: Viewable by all tournament participants
CREATE POLICY "Anyone authenticated can view real teams"
ON real_teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tournament admins can manage real teams"
ON real_teams FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);

CREATE POLICY "Anyone authenticated can view players"
ON players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tournament admins can manage players"
ON players FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);

CREATE POLICY "Anyone authenticated can view matches"
ON matches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tournament admins can manage matches"
ON matches FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);

-- team_owners: Users can view their own teams
CREATE POLICY "Anyone authenticated can view team owners"
ON team_owners FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tournament admins can manage team owners"
ON team_owners FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);

-- player_match_points: Viewable by all, editable by admins
CREATE POLICY "Anyone authenticated can view player match points"
ON player_match_points FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tournament admins can manage player match points"
ON player_match_points FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  EXISTS (
    SELECT 1 FROM players p
    WHERE p.id = player_id
    AND public.has_tournament_permission(auth.uid(), p.tournament_id, 'admin')
  )
);

-- auction_logs: Viewable by tournament participants
CREATE POLICY "Tournament participants can view auction logs"
ON auction_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'team_owner')
);

CREATE POLICY "Tournament admins can manage auction logs"
ON auction_logs FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);

-- tournament_permissions: Admins can manage
CREATE POLICY "Users can view their own permissions"
ON tournament_permissions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tournament admins can manage permissions"
ON tournament_permissions FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_tournament_permission(auth.uid(), tournament_id, 'admin')
);