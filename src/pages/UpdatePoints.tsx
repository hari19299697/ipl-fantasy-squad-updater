import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useTournament } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Match {
  id: string;
  match_number: number;
  match_date: string;
  venue: string;
  team1_id: string;
  team2_id: string;
  team1: { name: string };
  team2: { name: string };
}

const UpdatePoints = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(tournamentId);
  const { players, isLoading: playersLoading } = usePlayers(tournamentId);

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [playerPoints, setPlayerPoints] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchMatches();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (selectedMatch) {
      fetchExistingPoints();
    }
  }, [selectedMatch]);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:real_teams!matches_team1_id_fkey(name),
        team2:real_teams!matches_team2_id_fkey(name)
      `)
      .eq('tournament_id', tournamentId)
      .order('match_number');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch matches",
        variant: "destructive",
      });
      return;
    }

    setMatches(data || []);
  };

  const fetchExistingPoints = async () => {
    const { data, error } = await supabase
      .from('player_match_points')
      .select('player_id, points')
      .eq('match_id', selectedMatch);

    if (error) return;

    const pointsMap: { [key: string]: string } = {};
    data?.forEach(p => {
      pointsMap[p.player_id] = p.points.toString();
    });
    setPlayerPoints(pointsMap);
  };

  const handleSave = async () => {
    if (!selectedMatch) {
      toast({
        title: "Error",
        description: "Please select a match",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Delete existing points for this match
      await supabase
        .from('player_match_points')
        .delete()
        .eq('match_id', selectedMatch);

      // Insert new points
      const pointsData = Object.entries(playerPoints)
        .filter(([_, points]) => points && parseInt(points) > 0)
        .map(([playerId, points]) => ({
          match_id: selectedMatch,
          player_id: playerId,
          points: parseInt(points),
        }));

      if (pointsData.length > 0) {
        const { error } = await supabase
          .from('player_match_points')
          .insert(pointsData);

        if (error) throw error;

        // Batch fetch all player match points
        const playerIds = players.map(p => p.id);
        const { data: allMatchPoints } = await supabase
          .from('player_match_points')
          .select('player_id, points')
          .in('player_id', playerIds);

        // Calculate total points for each player
        const playerTotals = new Map<string, number>();
        allMatchPoints?.forEach(mp => {
          playerTotals.set(mp.player_id, (playerTotals.get(mp.player_id) || 0) + mp.points);
        });

        // Batch update player total points
        const playerUpdates = Array.from(playerTotals.entries()).map(([playerId, totalPoints]) => ({
          id: playerId,
          total_points: totalPoints,
        }));

        if (playerUpdates.length > 0) {
          await Promise.all(
            playerUpdates.map(update =>
              supabase
                .from('players')
                .update({ total_points: update.total_points })
                .eq('id', update.id)
            )
          );
        }

        // Calculate team owner totals
        const ownerTotals = new Map<string, number>();
        players.forEach(player => {
          if (player.owner_id) {
            const playerTotal = playerTotals.get(player.id) || 0;
            ownerTotals.set(player.owner_id, (ownerTotals.get(player.owner_id) || 0) + playerTotal);
          }
        });

        // Batch update team owner total points
        if (ownerTotals.size > 0) {
          await Promise.all(
            Array.from(ownerTotals.entries()).map(([ownerId, totalPoints]) =>
              supabase
                .from('team_owners')
                .update({ total_points: totalPoints })
                .eq('id', ownerId)
            )
          );
        }
      }

      // Mark match as completed
      await supabase
        .from('matches')
        .update({ is_completed: true })
        .eq('id', selectedMatch);

      toast({
        title: "Success",
        description: "Points updated successfully",
      });

      navigate(`/tournaments/${tournamentId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update points",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (tournamentLoading || playersLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-8">Tournament not found</div>;
  }

  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Update Player Points</h1>
            <p className="text-sm text-muted-foreground">{tournament.name}</p>
          </div>
        </div>

        <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-4">
            <div>
              <Label>Select Match</Label>
              <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a match" />
                </SelectTrigger>
                <SelectContent>
                  {matches.map((match) => (
                    <SelectItem key={match.id} value={match.id}>
                      Match {match.match_number}: {match.team1.name} vs {match.team2.name}
                      {match.venue && ` - ${match.venue}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {selectedMatch && selectedMatchData && (
          <>
            <Card className="p-4 sm:p-6 mb-4 sm:mb-6 bg-primary/5">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">
                Match {selectedMatchData.match_number}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedMatchData.team1.name} vs {selectedMatchData.team2.name}
              </p>
              {selectedMatchData.venue && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Venue: {selectedMatchData.venue}
                </p>
              )}
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {players
                  .filter((player) => 
                    player.real_team_id === selectedMatchData.team1_id || 
                    player.real_team_id === selectedMatchData.team2_id
                  )
                  .map((player) => (
                  <div key={player.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{player.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {player.real_teams?.name} • {player.team_owners?.name || 'Unsold'}
                      </p>
                    </div>
                    <div className="w-full sm:w-32">
                      <Input
                        type="number"
                        placeholder="Points"
                        value={playerPoints[player.id] || ''}
                        onChange={(e) =>
                          setPlayerPoints({
                            ...playerPoints,
                            [player.id]: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 sm:mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Points'}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdatePoints;
