-- Fix players with match points but total_points = 0
UPDATE players 
SET total_points = sub.calc 
FROM (
  SELECT p.id, COALESCE(SUM(pmp.points), 0)::int as calc 
  FROM players p 
  LEFT JOIN player_match_points pmp ON pmp.player_id = p.id 
  WHERE p.total_points = 0 
    AND EXISTS (SELECT 1 FROM player_match_points pmp2 WHERE pmp2.player_id = p.id AND pmp2.points > 0) 
  GROUP BY p.id
) sub 
WHERE players.id = sub.id;

-- Create a trigger to auto-update total_points when match points change
CREATE OR REPLACE FUNCTION public.update_player_total_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE players 
  SET total_points = COALESCE((
    SELECT SUM(points)::int FROM player_match_points WHERE player_id = COALESCE(NEW.player_id, OLD.player_id)
  ), 0)
  WHERE id = COALESCE(NEW.player_id, OLD.player_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_player_total_points
AFTER INSERT OR UPDATE OR DELETE ON player_match_points
FOR EACH ROW
EXECUTE FUNCTION public.update_player_total_points();