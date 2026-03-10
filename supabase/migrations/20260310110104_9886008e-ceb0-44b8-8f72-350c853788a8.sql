
-- Ensure unique constraint exists for upsert on player_match_points
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'player_match_points_player_id_match_id_key'
  ) THEN
    ALTER TABLE public.player_match_points 
    ADD CONSTRAINT player_match_points_player_id_match_id_key 
    UNIQUE (player_id, match_id);
  END IF;
END $$;

-- Recreate the trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_player_total_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE players 
    SET total_points = COALESCE((
      SELECT SUM(points)::int FROM player_match_points WHERE player_id = OLD.player_id
    ), 0)
    WHERE id = OLD.player_id;
    RETURN OLD;
  ELSE
    UPDATE players 
    SET total_points = COALESCE((
      SELECT SUM(points)::int FROM player_match_points WHERE player_id = NEW.player_id
    ), 0)
    WHERE id = NEW.player_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_update_player_total_points ON player_match_points;

CREATE TRIGGER trg_update_player_total_points
AFTER INSERT OR UPDATE OR DELETE ON player_match_points
FOR EACH ROW
EXECUTE FUNCTION update_player_total_points();

-- Re-sync all player totals now
UPDATE players 
SET total_points = COALESCE(
  (SELECT SUM(pmp.points)::int FROM player_match_points pmp WHERE pmp.player_id = players.id),
  0
);

-- Re-sync all team owner totals
UPDATE team_owners 
SET total_points = COALESCE(
  (SELECT SUM(pmp.points)::int 
   FROM players p 
   JOIN player_match_points pmp ON pmp.player_id = p.id 
   WHERE p.owner_id = team_owners.id),
  0
);
