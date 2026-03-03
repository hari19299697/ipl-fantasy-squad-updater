-- Re-fix any players whose total_points doesn't match their actual match points sum
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