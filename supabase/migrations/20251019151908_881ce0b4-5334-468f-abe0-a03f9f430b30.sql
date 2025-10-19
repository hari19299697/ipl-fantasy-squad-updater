-- Clear all existing data from tables (keeping structure intact)
TRUNCATE TABLE player_match_points CASCADE;
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE team_owners CASCADE;
TRUNCATE TABLE real_teams CASCADE;
TRUNCATE TABLE auction_logs CASCADE;
TRUNCATE TABLE tournament_auction_rules CASCADE;
TRUNCATE TABLE tournament_scoring_rules CASCADE;
TRUNCATE TABLE tournament_permissions CASCADE;
TRUNCATE TABLE tournaments CASCADE;