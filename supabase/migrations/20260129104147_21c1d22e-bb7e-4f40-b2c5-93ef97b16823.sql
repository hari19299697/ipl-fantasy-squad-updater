-- Drop the restrictive SELECT policy that's blocking access
DROP POLICY IF EXISTS "Anyone can view team_owners_public" ON public.team_owners;

-- Create a PERMISSIVE SELECT policy that allows anyone to view team owners (for public leaderboard/player data)
CREATE POLICY "Anyone can view team owners"
ON public.team_owners
FOR SELECT
USING (true);