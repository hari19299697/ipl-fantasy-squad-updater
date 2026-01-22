-- Convert all monetary columns from bigint to numeric to support decimal values

-- Players table: auction_price and base_price
ALTER TABLE public.players 
ALTER COLUMN auction_price TYPE numeric USING auction_price::numeric;

ALTER TABLE public.players 
ALTER COLUMN base_price TYPE numeric USING base_price::numeric;

-- Team owners table: budget_remaining
ALTER TABLE public.team_owners 
ALTER COLUMN budget_remaining TYPE numeric USING budget_remaining::numeric;

-- Auction logs table: bid_amount
ALTER TABLE public.auction_logs 
ALTER COLUMN bid_amount TYPE numeric USING bid_amount::numeric;