import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FantasyPlayer {
  name: string;
  pid: string;
  player_short_name: string;
  total_point: string;
  team_title: string;
  run: string;
  wkts: string;
  catch: string;
  four: string;
  six: string;
  fifty: string;
  sr: string;
  er: string;
  maidenover: string;
  stumping: string;
  directrunout: string;
  bonusbowedlbw: string;
  bonuscatch: string;
  starting11: string;
}

interface MatchResult {
  playerId: string;
  playerName: string;
  points: number;
  matched: boolean;
  apiPlayerName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    const RAPIDAPI_HOST = Deno.env.get('RAPIDAPI_HOST');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    if (!RAPIDAPI_HOST) {
      throw new Error('RAPIDAPI_HOST is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const { externalMatchId, matchId, tournamentId, saveToDb = false } = await req.json();

    if (!externalMatchId) {
      return new Response(
        JSON.stringify({ error: 'externalMatchId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://${RAPIDAPI_HOST}/matches/${externalMatchId}/newpoint2`;
    
    console.log(`Fetching fantasy points for external match: ${externalMatchId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI error [${response.status}]: ${errorText}`);
      throw new Error(`RapidAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Fantasy points fetched successfully');

    // Extract player fantasy data
    const fantasyPlayers: FantasyPlayer[] = data?.response?.comp_Fantasy_record || [];
    
    if (fantasyPlayers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: [], message: 'No fantasy data available for this match' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we need to save to DB, match players and update
    if (saveToDb && matchId && tournamentId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch players from the tournament
      const { data: dbPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, name, real_team_id, real_teams(name)')
        .eq('tournament_id', tournamentId);

      if (playersError) {
        throw new Error(`Failed to fetch players: ${playersError.message}`);
      }

      // Match players using name similarity
      const matchResults: MatchResult[] = [];
      const pointsToInsert: { match_id: string; player_id: string; points: number; details: object }[] = [];

      for (const apiPlayer of fantasyPlayers) {
        const apiName = apiPlayer.name.toLowerCase().trim();
        const apiShortName = apiPlayer.player_short_name.toLowerCase().trim();
        
        // Find matching player in DB
        let matchedPlayer = null;
        
        for (const dbPlayer of dbPlayers || []) {
          const dbName = dbPlayer.name.toLowerCase().trim();
          
          // Check exact match
          if (dbName === apiName) {
            matchedPlayer = dbPlayer;
            break;
          }
          
          // Check if API name contains DB name or vice versa
          if (dbName.includes(apiName) || apiName.includes(dbName)) {
            matchedPlayer = dbPlayer;
            break;
          }
          
          // Check short name match
          if (dbName.includes(apiShortName.replace(/^[a-z]\s+/i, '')) || 
              apiShortName.includes(dbName.split(' ').pop() || '')) {
            matchedPlayer = dbPlayer;
            break;
          }
          
          // Check last name match (common in cricket)
          const apiLastName = apiName.split(' ').pop() || '';
          const dbLastName = dbName.split(' ').pop() || '';
          if (apiLastName.length > 2 && dbLastName.length > 2 && apiLastName === dbLastName) {
            matchedPlayer = dbPlayer;
            break;
          }
        }

        const points = parseInt(apiPlayer.total_point) || 0;
        
        if (matchedPlayer) {
          matchResults.push({
            playerId: matchedPlayer.id,
            playerName: matchedPlayer.name,
            points: points,
            matched: true,
            apiPlayerName: apiPlayer.name
          });

          pointsToInsert.push({
            match_id: matchId,
            player_id: matchedPlayer.id,
            points: points,
            details: {
              runs: parseInt(apiPlayer.run) || 0,
              wickets: parseInt(apiPlayer.wkts) || 0,
              catches: parseInt(apiPlayer.catch) || 0,
              fours: parseInt(apiPlayer.four) || 0,
              sixes: parseInt(apiPlayer.six) || 0,
              fifties: parseInt(apiPlayer.fifty) || 0,
              strikeRate: parseInt(apiPlayer.sr) || 0,
              economyRate: parseInt(apiPlayer.er) || 0,
              maidenOvers: parseInt(apiPlayer.maidenover) || 0,
              stumpings: parseInt(apiPlayer.stumping) || 0,
              directRunouts: parseInt(apiPlayer.directrunout) || 0,
              lbwBowled: parseInt(apiPlayer.bonusbowedlbw) || 0,
              starting11Points: parseInt(apiPlayer.starting11) || 0,
              apiPlayerName: apiPlayer.name,
              apiTeam: apiPlayer.team_title
            }
          });
        } else {
          matchResults.push({
            playerId: '',
            playerName: '',
            points: points,
            matched: false,
            apiPlayerName: apiPlayer.name
          });
        }
      }

      // Delete existing points for this match and insert new ones
      if (pointsToInsert.length > 0) {
        // First delete existing
        await supabase
          .from('player_match_points')
          .delete()
          .eq('match_id', matchId);

        // Insert new points
        const { error: insertError } = await supabase
          .from('player_match_points')
          .insert(pointsToInsert);

        if (insertError) {
          throw new Error(`Failed to insert points: ${insertError.message}`);
        }

        // Update player total points
        const playerIds = pointsToInsert.map(p => p.player_id);
        
        // Fetch all match points for these players
        const { data: allMatchPoints } = await supabase
          .from('player_match_points')
          .select('player_id, points')
          .in('player_id', playerIds);

        // Calculate totals
        const playerTotals = new Map<string, number>();
        allMatchPoints?.forEach(mp => {
          playerTotals.set(mp.player_id, (playerTotals.get(mp.player_id) || 0) + mp.points);
        });

        // Update each player's total
        await Promise.all(
          Array.from(playerTotals.entries()).map(([playerId, totalPoints]) =>
            supabase
              .from('players')
              .update({ total_points: totalPoints })
              .eq('id', playerId)
          )
        );

        // Update team owner totals
        const { data: playersWithOwners } = await supabase
          .from('players')
          .select('id, owner_id, total_points')
          .eq('tournament_id', tournamentId)
          .not('owner_id', 'is', null);

        const ownerTotals = new Map<string, number>();
        playersWithOwners?.forEach(player => {
          if (player.owner_id) {
            ownerTotals.set(
              player.owner_id, 
              (ownerTotals.get(player.owner_id) || 0) + (player.total_points || 0)
            );
          }
        });

        await Promise.all(
          Array.from(ownerTotals.entries()).map(([ownerId, totalPoints]) =>
            supabase
              .from('team_owners')
              .update({ total_points: totalPoints })
              .eq('id', ownerId)
          )
        );

        // Mark match as completed
        await supabase
          .from('matches')
          .update({ is_completed: true })
          .eq('id', matchId);

        console.log(`Saved ${pointsToInsert.length} player points to database`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          matchResults,
          savedCount: pointsToInsert.length,
          unmatchedCount: matchResults.filter(r => !r.matched).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return raw data if not saving to DB
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: fantasyPlayers.map(p => ({
          name: p.name,
          shortName: p.player_short_name,
          team: p.team_title,
          points: parseInt(p.total_point) || 0
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching fantasy points:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
