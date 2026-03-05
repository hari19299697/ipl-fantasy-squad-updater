
-- Recreate the trigger function
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trg_update_player_total_points ON player_match_points;

CREATE TRIGGER trg_update_player_total_points
AFTER INSERT OR UPDATE OR DELETE ON player_match_points
FOR EACH ROW
EXECUTE FUNCTION update_player_total_points();

-- Re-sync all player totals
UPDATE players 
SET total_points = COALESCE(
  (SELECT SUM(pmp.points)::int FROM player_match_points pmp WHERE pmp.player_id = players.id),
  0
);
