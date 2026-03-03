-- Recreate the trigger for auto-syncing player total points
-- The function already exists, just need the trigger

DROP TRIGGER IF EXISTS trg_update_player_total_points ON player_match_points;

CREATE TRIGGER trg_update_player_total_points
AFTER INSERT OR UPDATE OR DELETE ON player_match_points
FOR EACH ROW
EXECUTE FUNCTION update_player_total_points();

-- Also re-sync any currently mismatched totals
UPDATE players 
SET total_points = sub.calc 
FROM (
  SELECT p.id, COALESCE(SUM(pmp.points), 0)::int as calc 
  FROM players p 
  LEFT JOIN player_match_points pmp ON pmp.player_id = p.id 
  GROUP BY p.id
  HAVING COALESCE(SUM(pmp.points), 0)::int != COALESCE(p.total_points, 0)
) sub 
WHERE players.id = sub.id;