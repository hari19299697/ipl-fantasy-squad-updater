-- Add auction rules configuration fields
ALTER TABLE public.auction_rules 
ADD COLUMN IF NOT EXISTS category_limits jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_safety_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS unsold_player_rule text DEFAULT 'skip';

-- Add comment for clarity
COMMENT ON COLUMN public.auction_rules.category_limits IS 'JSON object with category name as key and max count as value';
COMMENT ON COLUMN public.auction_rules.budget_safety_enabled IS 'If true, enforces: Remaining Purse >= (Remaining Players × Base Price)';
COMMENT ON COLUMN public.auction_rules.unsold_player_rule IS 'Options: skip, retry_next_round, retry_immediately';