-- Add min_players_per_team column to auction_rules table
ALTER TABLE public.auction_rules 
ADD COLUMN min_players_per_team integer NOT NULL DEFAULT 11;