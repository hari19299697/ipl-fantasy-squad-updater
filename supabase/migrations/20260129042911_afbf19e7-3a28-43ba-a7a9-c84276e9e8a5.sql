-- Add external_match_id column to store the RapidAPI match ID
ALTER TABLE public.matches 
ADD COLUMN external_match_id text;

-- Add comment for clarity
COMMENT ON COLUMN public.matches.external_match_id IS 'External match ID from RapidAPI for fantasy points fetching';