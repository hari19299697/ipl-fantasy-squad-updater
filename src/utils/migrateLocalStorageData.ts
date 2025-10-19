import { supabase } from "@/integrations/supabase/client";
import { teamOwners, samplePlayers, sampleMatches } from "@/data/sampleData";

export const migrateLocalStorageToSupabase = async () => {
  try {
    // Check if migration has already been done
    const migrationFlag = localStorage.getItem('migrationCompleted');
    if (migrationFlag === 'true') {
      console.log('Migration already completed');
      return null;
    }

    // Check if there's existing data in localStorage
    const hasLocalData = localStorage.getItem('players') || 
                         localStorage.getItem('teamOwners') || 
                         localStorage.getItem('matches');
    
    if (!hasLocalData) {
      console.log('No local data to migrate, using sample data');
    }

    // Step 1: Create IPL 2025 Tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: 'IPL 2025',
        type: 'cricket',
        start_date: '2025-03-01T00:00:00Z',
        end_date: '2025-05-31T23:59:59Z',
        status: 'active',
        timezone: 'Asia/Kolkata',
      })
      .select()
      .single();

    if (tournamentError) throw tournamentError;
    console.log('Tournament created:', tournament);

    // Step 2: Create Real Teams (IPL teams)
    const iplTeams = [
      { name: 'Chennai Super Kings', short_name: 'CSK' },
      { name: 'Delhi Capitals', short_name: 'DC' },
      { name: 'Gujarat Titans', short_name: 'GT' },
      { name: 'Kolkata Knight Riders', short_name: 'KKR' },
      { name: 'Lucknow Super Giants', short_name: 'LSG' },
      { name: 'Mumbai Indians', short_name: 'MI' },
      { name: 'Punjab Kings', short_name: 'PBKS' },
      { name: 'Rajasthan Royals', short_name: 'RR' },
      { name: 'Royal Challengers Bangalore', short_name: 'RCB' },
      { name: 'Sunrisers Hyderabad', short_name: 'SRH' },
    ];

    const { data: realTeams, error: teamsError } = await supabase
      .from('real_teams')
      .insert(
        iplTeams.map(team => ({
          ...team,
          tournament_id: tournament.id,
        }))
      )
      .select();

    if (teamsError) throw teamsError;
    console.log('Real teams created:', realTeams);

    // Create a map of short_name to real_team id
    const teamMap = new Map(realTeams.map(team => [team.short_name, team.id]));

    // Step 3: Create Team Owners
    const { data: owners, error: ownersError } = await supabase
      .from('team_owners')
      .insert(
        teamOwners.map(owner => ({
          name: owner.name,
          short_name: owner.shortName,
          color: owner.color,
          tournament_id: tournament.id,
          budget_remaining: 1000000, // Default budget
          total_points: owner.totalPoints,
        }))
      )
      .select();

    if (ownersError) throw ownersError;
    console.log('Team owners created:', owners);

    // Create a map of old owner IDs to new owner IDs
    const ownerMap = new Map(
      teamOwners.map((oldOwner, index) => [oldOwner.id, owners[index].id])
    );

    // Step 4: Create Players
    const playersToInsert = samplePlayers.map(player => ({
      name: player.name,
      role: player.role.toLowerCase().replace(' ', '_'),
      tournament_id: tournament.id,
      real_team_id: teamMap.get(player.iplTeam),
      owner_id: ownerMap.get(player.owner) || null,
      total_points: player.totalPoints,
      base_price: 100000, // Default base price
    }));

    const { data: players, error: playersError } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select();

    if (playersError) throw playersError;
    console.log('Players created:', players.length);

    // Step 5: Create Matches
    const matchesToInsert = sampleMatches.map(match => ({
      match_number: match.matchNumber,
      tournament_id: tournament.id,
      team1_id: teamMap.get(match.team1),
      team2_id: teamMap.get(match.team2),
      match_date: new Date(match.date).toISOString(),
      venue: match.venue,
      is_completed: match.isCompleted,
    }));

    const { data: createdMatches, error: matchesError } = await supabase
      .from('matches')
      .insert(matchesToInsert)
      .select();

    if (matchesError) throw matchesError;
    console.log('Matches created:', createdMatches.length);

    // Step 6: Migrate match points if any exist
    const localPlayers = JSON.parse(localStorage.getItem('players') || '[]');
    if (localPlayers.length > 0 && createdMatches.length > 0) {
      const pointsToInsert = [];
      
      for (const localPlayer of localPlayers) {
        const dbPlayer = players.find(p => p.name === localPlayer.name);
        if (!dbPlayer) continue;

        for (const [matchId, points] of Object.entries(localPlayer.matchPoints || {})) {
          const matchIndex = parseInt(matchId) - 1;
          if (matchIndex >= 0 && matchIndex < createdMatches.length) {
            pointsToInsert.push({
              player_id: dbPlayer.id,
              match_id: createdMatches[matchIndex].id,
              points: points as number,
            });
          }
        }
      }

      if (pointsToInsert.length > 0) {
        const { error: pointsError } = await supabase
          .from('player_match_points')
          .insert(pointsToInsert);

        if (pointsError) throw pointsError;
        console.log('Match points migrated:', pointsToInsert.length);
      }
    }

    // Mark migration as complete
    localStorage.setItem('migrationCompleted', 'true');
    localStorage.setItem('selectedTournamentId', tournament.id);

    console.log('Migration completed successfully!');
    return tournament.id;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
