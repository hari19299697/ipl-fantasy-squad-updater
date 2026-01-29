import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useTournament } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import { useFantasyPoints } from '@/hooks/useFantasyPoints';
import AdminGuard from '@/components/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Download, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Match {
  id: string;
  match_number: number;
  match_date: string;
  venue: string;
  team1_id: string;
  team2_id: string;
  external_match_id: string | null;
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
  const [externalIdDialog, setExternalIdDialog] = useState(false);
  const [externalMatchId, setExternalMatchId] = useState('');
  const [syncDialog, setSyncDialog] = useState(false);
  const [competitionId, setCompetitionId] = useState('129675'); // Default BBL competition ID
  const [syncing, setSyncing] = useState(false);
  
  const { fetchFantasyPoints, isLoading: fetchingPoints, data: fantasyData } = useFantasyPoints();

  useEffect(() => {
    if (tournamentId) {
      fetchMatches();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (selectedMatch) {
      fetchExistingPoints();
      // Pre-fill external match ID if available
      const match = matches.find(m => m.id === selectedMatch);
      if (match?.external_match_id) {
        setExternalMatchId(match.external_match_id);
      } else {
        setExternalMatchId('');
      }
    }
  }, [selectedMatch, matches]);

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

  const handleSyncMatchIds = async () => {
    if (!competitionId.trim()) {
      toast({
        title: "Error",
        description: "Please enter the competition ID",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-fantasy-points', {
        body: {
          action: 'sync-competition-matches',
          competitionId: competitionId.trim(),
          tournamentId: tournamentId,
        },
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Updated ${data.updated} matches. ${data.unmatched} could not be matched.`,
      });

      setSyncDialog(false);
      fetchMatches(); // Refresh matches to show updated external IDs
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync match IDs",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchFromAPI = () => {
    if (!externalMatchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter the external match ID",
        variant: "destructive",
      });
      return;
    }

    fetchFantasyPoints(
      {
        externalMatchId: externalMatchId.trim(),
        matchId: selectedMatch,
        tournamentId: tournamentId,
        saveToDb: true,
      },
      {
        onSuccess: async () => {
          // Save the external match ID for future use
          await supabase
            .from('matches')
            .update({ external_match_id: externalMatchId.trim() })
            .eq('id', selectedMatch);
          
          setExternalIdDialog(false);
          fetchMatches(); // Refresh matches to get updated external_match_id
          fetchExistingPoints(); // Refresh points
        }
      }
    );
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
  const matchesWithoutExternalId = matches.filter(m => !m.external_match_id).length;

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
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Update Player Points</h1>
            <p className="text-sm text-muted-foreground">{tournament.name}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSyncDialog(true)}
            className="hidden sm:flex"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Match IDs
          </Button>
        </div>

        {/* Mobile sync button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSyncDialog(true)}
          className="w-full mb-4 sm:hidden"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Match IDs from API
        </Button>

        {matchesWithoutExternalId > 0 && (
          <Card className="p-4 mb-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>{matchesWithoutExternalId} matches</strong> don't have API IDs mapped. 
              Click "Sync Match IDs" to automatically map them.
            </p>
          </Card>
        )}

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
                      {match.external_match_id && ' ✓'}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">
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
                  {selectedMatchData.external_match_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      API ID: {selectedMatchData.external_match_id}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExternalIdDialog(true)}
                  disabled={fetchingPoints}
                  className="w-full sm:w-auto"
                >
                  {fetchingPoints ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {fetchingPoints ? 'Fetching...' : 'Fetch from API'}
                </Button>
              </div>
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

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setExternalIdDialog(true)}
                  disabled={fetchingPoints}
                  className="w-full sm:w-auto"
                >
                  {fetchingPoints ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {fetchingPoints ? 'Fetching...' : 'Fetch from API'}
                </Button>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Points'}
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* External Match ID Dialog */}
        <Dialog open={externalIdDialog} onOpenChange={setExternalIdDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Fetch Fantasy Points</DialogTitle>
              <DialogDescription>
                Enter the external match ID from the cricket API to fetch fantasy points automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="externalId">External Match ID</Label>
                <Input
                  id="externalId"
                  placeholder="e.g., 91454"
                  value={externalMatchId}
                  onChange={(e) => setExternalMatchId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You can find this ID from the cricket-live-line API for the specific match.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExternalIdDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFetchFromAPI} disabled={fetchingPoints || !externalMatchId.trim()}>
                {fetchingPoints ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Fetch & Save Points
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sync Match IDs Dialog */}
        <Dialog open={syncDialog} onOpenChange={setSyncDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sync Match IDs from API</DialogTitle>
              <DialogDescription>
                This will fetch all matches from the competition and automatically map them to your database matches by team names.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="competitionId">Competition ID</Label>
                <Input
                  id="competitionId"
                  placeholder="e.g., 129675"
                  value={competitionId}
                  onChange={(e) => setCompetitionId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  BBL 2024-25 = 129675. Find other competition IDs from the API.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSyncDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSyncMatchIds} disabled={syncing || !competitionId.trim()}>
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Match IDs
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UpdatePoints;
