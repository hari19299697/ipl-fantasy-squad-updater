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
import { ArrowLeft, Save, Download, Loader2, RefreshCw, Star, Copy, CopyCheck } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

interface SourceTournament {
  id: string;
  name: string;
  matchId: string;
  matchNumber: number;
  hasPoints: boolean;
  pointsCount: number;
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
  const [playingXIPlayers, setPlayingXIPlayers] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [externalIdDialog, setExternalIdDialog] = useState(false);
  const [externalMatchId, setExternalMatchId] = useState('');
  const [syncDialog, setSyncDialog] = useState(false);
  const [competitionId, setCompetitionId] = useState('129675');
  const [syncing, setSyncing] = useState(false);
  
  // Copy from tournament state
  const [copyDialog, setCopyDialog] = useState(false);
  const [sourceTournaments, setSourceTournaments] = useState<SourceTournament[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [copyingPoints, setCopyingPoints] = useState(false);
  
  // Bulk sync state
  const [bulkSyncDialog, setBulkSyncDialog] = useState(false);
  const [allTournaments, setAllTournaments] = useState<{ id: string; name: string }[]>([]);
  const [selectedSourceTournament, setSelectedSourceTournament] = useState('');
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkSyncProgress, setBulkSyncProgress] = useState({ current: 0, total: 0, matched: 0 });

  const { fetchFantasyPoints, isLoading: fetchingPoints, data: fantasyData } = useFantasyPoints();

  useEffect(() => {
    if (tournamentId) {
      fetchMatches();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (selectedMatch) {
      fetchExistingPoints();
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
      .select('player_id, points, details')
      .eq('match_id', selectedMatch);

    if (error) return;

    const pointsMap: { [key: string]: string } = {};
    const playingXISet = new Set<string>();
    
    data?.forEach(p => {
      pointsMap[p.player_id] = p.points.toString();
      const details = p.details as { isPlayingXI?: boolean } | null;
      if (details?.isPlayingXI) {
        playingXISet.add(p.player_id);
      }
    });
    
    setPlayerPoints(pointsMap);
    setPlayingXIPlayers(playingXISet);
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
      fetchMatches();
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

  const handleFetchFromAPI = (useExistingId: boolean = false) => {
    const matchIdToUse = useExistingId ? selectedMatchData?.external_match_id : externalMatchId.trim();
    
    if (!matchIdToUse) {
      toast({
        title: "Error",
        description: "No external match ID available. Please enter one manually.",
        variant: "destructive",
      });
      setExternalIdDialog(true);
      return;
    }

    fetchFantasyPoints(
      {
        externalMatchId: matchIdToUse,
        matchId: selectedMatch,
        tournamentId: tournamentId,
        saveToDb: true,
      },
      {
        onSuccess: async (data) => {
          if (!useExistingId && matchIdToUse !== selectedMatchData?.external_match_id) {
            await supabase
              .from('matches')
              .update({ external_match_id: matchIdToUse })
              .eq('id', selectedMatch);
          }
          
          if (data?.matchResults) {
            const playingXISet = new Set<string>();
            data.matchResults.forEach((r: any) => {
              if (r.matched && r.isPlayingXI) {
                playingXISet.add(r.playerId);
              }
            });
            setPlayingXIPlayers(playingXISet);
          }
          
          setExternalIdDialog(false);
          fetchMatches();
          fetchExistingPoints();
          
          if (data?.matchResults) {
            const playingXIResults = data.matchResults.filter((r: any) => r.isPlayingXI);
            const matchedPlayingXI = playingXIResults.filter((r: any) => r.matched).length;
            const playersWithPoints = data.matchResults.filter((r: any) => r.points > 0).length;
            toast({
              title: "Points Fetched Successfully",
              description: `Matched ${matchedPlayingXI}/${playingXIResults.length} playing XI players. ${playersWithPoints} have points > 0.`,
            });
          }
        }
      }
    );
  };

  const handleFetchButtonClick = () => {
    if (selectedMatchData?.external_match_id) {
      handleFetchFromAPI(true);
    } else {
      setExternalIdDialog(true);
    }
  };

  // ---- Copy from Tournament Logic ----

  const handleCopyFromTournamentClick = async () => {
    if (!selectedMatchData) return;
    
    setLoadingSources(true);
    setCopyDialog(true);
    
    try {
      // Find all other tournaments that have a match with the same match_number
      const { data: otherMatches, error: matchError } = await supabase
        .from('matches')
        .select('id, match_number, tournament_id')
        .eq('match_number', selectedMatchData.match_number)
        .neq('tournament_id', tournamentId!);
      
      if (matchError) throw matchError;
      
      if (!otherMatches || otherMatches.length === 0) {
        setSourceTournaments([]);
        setLoadingSources(false);
        return;
      }

      // Get tournament names
      const tournamentIds = [...new Set(otherMatches.map(m => m.tournament_id))];
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, name')
        .in('id', tournamentIds);

      // Check which matches have points
      const matchIds = otherMatches.map(m => m.id);
      const { data: pointsCounts } = await supabase
        .from('player_match_points')
        .select('match_id')
        .in('match_id', matchIds);

      const pointsCountMap = new Map<string, number>();
      pointsCounts?.forEach(p => {
        pointsCountMap.set(p.match_id, (pointsCountMap.get(p.match_id) || 0) + 1);
      });

      const sources: SourceTournament[] = otherMatches.map(m => {
        const t = tournaments?.find(t => t.id === m.tournament_id);
        const count = pointsCountMap.get(m.id) || 0;
        return {
          id: m.tournament_id,
          name: t?.name || 'Unknown',
          matchId: m.id,
          matchNumber: m.match_number,
          hasPoints: count > 0,
          pointsCount: count,
        };
      }).filter(s => s.hasPoints);

      setSourceTournaments(sources);
    } catch (err) {
      toast({ title: "Error", description: "Failed to find source tournaments", variant: "destructive" });
    } finally {
      setLoadingSources(false);
    }
  };

  const handleCopyPoints = async (source: SourceTournament) => {
    setCopyingPoints(true);
    
    try {
      // Fetch points from source match with player names
      const { data: sourcePoints, error } = await supabase
        .from('player_match_points')
        .select('points, details, players(name)')
        .eq('match_id', source.matchId);
      
      if (error) throw error;
      if (!sourcePoints || sourcePoints.length === 0) {
        toast({ title: "No Points", description: "No points found in source match", variant: "destructive" });
        setCopyingPoints(false);
        return;
      }

      // Build name -> points map from source
      const namePointsMap = new Map<string, { points: number; details: any }>();
      sourcePoints.forEach((sp: any) => {
        const playerName = sp.players?.name;
        if (playerName) {
          namePointsMap.set(playerName.toLowerCase().trim(), { points: sp.points, details: sp.details });
        }
      });

      // Match to current tournament players
      const matchedPoints: { [key: string]: string } = {};
      const playingXISet = new Set<string>();
      let matchedCount = 0;

      // Filter players for the selected match's teams
      const matchPlayers = players.filter(
        p => p.real_team_id === selectedMatchData?.team1_id || p.real_team_id === selectedMatchData?.team2_id
      );

      matchPlayers.forEach(player => {
        const sourceData = namePointsMap.get(player.name.toLowerCase().trim());
        if (sourceData) {
          matchedPoints[player.id] = sourceData.points.toString();
          const details = sourceData.details as { isPlayingXI?: boolean } | null;
          if (details?.isPlayingXI) {
            playingXISet.add(player.id);
          }
          matchedCount++;
        }
      });

      setPlayerPoints(prev => ({ ...prev, ...matchedPoints }));
      setPlayingXIPlayers(playingXISet);
      setCopyDialog(false);
      
      toast({
        title: "Points Copied",
        description: `Matched ${matchedCount}/${sourcePoints.length} players from "${source.name}". Review and click Save to apply.`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to copy points", variant: "destructive" });
    } finally {
      setCopyingPoints(false);
    }
  };

  // ---- Bulk Sync Logic ----

  const handleBulkSyncClick = async () => {
    setBulkSyncDialog(true);
    // Fetch all tournaments except current
    const { data } = await supabase
      .from('tournaments')
      .select('id, name')
      .neq('id', tournamentId!)
      .order('created_at', { ascending: false });
    setAllTournaments(data || []);
  };

  const handleBulkSync = async () => {
    if (!selectedSourceTournament) return;
    
    setBulkSyncing(true);
    setBulkSyncProgress({ current: 0, total: 0, matched: 0 });

    try {
      // Get source tournament matches with points
      const { data: sourceMatches } = await supabase
        .from('matches')
        .select('id, match_number')
        .eq('tournament_id', selectedSourceTournament);

      if (!sourceMatches || sourceMatches.length === 0) {
        toast({ title: "No Matches", description: "Source tournament has no matches", variant: "destructive" });
        setBulkSyncing(false);
        return;
      }

      // Get source tournament players (for name matching)
      const { data: sourcePlayers } = await supabase
        .from('players')
        .select('id, name')
        .eq('tournament_id', selectedSourceTournament);

      const sourcePlayerNameMap = new Map<string, string>(); // id -> name
      sourcePlayers?.forEach(p => sourcePlayerNameMap.set(p.id, p.name.toLowerCase().trim()));

      // Build current tournament player name -> id map
      const currentPlayerMap = new Map<string, string>(); // name -> id
      players.forEach(p => currentPlayerMap.set(p.name.toLowerCase().trim(), p.id));

      // Build match_number -> current match id map
      const currentMatchMap = new Map<number, string>();
      matches.forEach(m => currentMatchMap.set(m.match_number, m.id));

      // Filter source matches that have a corresponding match in current tournament
      const matchPairs = sourceMatches
        .filter(sm => currentMatchMap.has(sm.match_number))
        .map(sm => ({
          sourceMatchId: sm.id,
          currentMatchId: currentMatchMap.get(sm.match_number)!,
          matchNumber: sm.match_number,
        }));

      setBulkSyncProgress({ current: 0, total: matchPairs.length, matched: 0 });

      let totalMatched = 0;
      let matchesWithPoints = 0;

      for (let i = 0; i < matchPairs.length; i++) {
        const pair = matchPairs[i];

        // Fetch source match points
        const { data: sourcePoints } = await supabase
          .from('player_match_points')
          .select('player_id, points, details')
          .eq('match_id', pair.sourceMatchId);

        if (!sourcePoints || sourcePoints.length === 0) {
          setBulkSyncProgress(prev => ({ ...prev, current: i + 1 }));
          continue;
        }

        matchesWithPoints++;

        // Map source player points to current tournament players by name
        const pointsToInsert: { match_id: string; player_id: string; points: number; details?: any }[] = [];

        sourcePoints.forEach(sp => {
          const sourceName = sourcePlayerNameMap.get(sp.player_id);
          if (sourceName) {
            const currentPlayerId = currentPlayerMap.get(sourceName);
            if (currentPlayerId) {
              pointsToInsert.push({
                match_id: pair.currentMatchId,
                player_id: currentPlayerId,
                points: sp.points,
                details: sp.details,
              });
              totalMatched++;
            }
          }
        });

        if (pointsToInsert.length > 0) {
          // Delete existing points for this match first
          await supabase
            .from('player_match_points')
            .delete()
            .eq('match_id', pair.currentMatchId);

          // Insert new points
          await supabase
            .from('player_match_points')
            .insert(pointsToInsert);

          // Mark match as completed
          await supabase
            .from('matches')
            .update({ is_completed: true })
            .eq('id', pair.currentMatchId);
        }

        setBulkSyncProgress({ current: i + 1, total: matchPairs.length, matched: totalMatched });
      }

      // Recalculate totals for all players
      await recalculateAllTotals();

      toast({
        title: "Bulk Sync Complete",
        description: `Synced ${matchesWithPoints} matches with points. ${totalMatched} player-match records copied.`,
      });

      setBulkSyncDialog(false);
      fetchMatches();
      if (selectedMatch) fetchExistingPoints();
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message || "Failed to bulk sync", variant: "destructive" });
    } finally {
      setBulkSyncing(false);
    }
  };

  const recalculateAllTotals = async () => {
    const playerIds = players.map(p => p.id);
    const { data: allMatchPoints } = await supabase
      .from('player_match_points')
      .select('player_id, points')
      .in('player_id', playerIds);

    const playerTotals = new Map<string, number>();
    allMatchPoints?.forEach(mp => {
      playerTotals.set(mp.player_id, (playerTotals.get(mp.player_id) || 0) + mp.points);
    });

    // Update each player's total
    await Promise.all(
      players.map(p =>
        supabase
          .from('players')
          .update({ total_points: playerTotals.get(p.id) || 0 })
          .eq('id', p.id)
      )
    );

    // Update team owner totals
    const ownerTotals = new Map<string, number>();
    players.forEach(player => {
      if (player.owner_id) {
        const playerTotal = playerTotals.get(player.id) || 0;
        ownerTotals.set(player.owner_id, (ownerTotals.get(player.owner_id) || 0) + playerTotal);
      }
    });

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
      await supabase
        .from('player_match_points')
        .delete()
        .eq('match_id', selectedMatch);

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

        await recalculateAllTotals();
      }

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
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSyncClick}
            >
              <CopyCheck className="h-4 w-4 mr-2" />
              Bulk Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSyncDialog(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Match IDs
            </Button>
          </div>
        </div>

        {/* Mobile buttons */}
        <div className="flex flex-col gap-2 mb-4 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkSyncClick}
            className="w-full"
          >
            <CopyCheck className="h-4 w-4 mr-2" />
            Bulk Sync from Tournament
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSyncDialog(true)}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Match IDs from API
          </Button>
        </div>

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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyFromTournamentClick}
                    disabled={copyingPoints}
                    className="w-full sm:w-auto"
                  >
                    {copyingPoints ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy from Tournament
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFetchButtonClick}
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
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {players
                  .filter((player) => 
                    player.real_team_id === selectedMatchData.team1_id || 
                    player.real_team_id === selectedMatchData.team2_id
                  )
                  .map((player) => {
                    const isInPlayingXI = playingXIPlayers.has(player.id);
                    return (
                      <div key={player.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm sm:text-base truncate">{player.name}</p>
                            {isInPlayingXI && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Star className="h-3 w-3 fill-current" />
                                XI
                              </span>
                            )}
                          </div>
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
                    );
                  })}
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleFetchButtonClick}
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

        {/* Copy from Tournament Dialog */}
        <Dialog open={copyDialog} onOpenChange={setCopyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Copy Points from Tournament</DialogTitle>
              <DialogDescription>
                Select a tournament to copy Match {selectedMatchData?.match_number} points from. Players are matched by name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {loadingSources ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sourceTournaments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other tournaments found with points for this match number.
                </p>
              ) : (
                sourceTournaments.map(source => (
                  <Card
                    key={`${source.id}-${source.matchId}`}
                    className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleCopyPoints(source)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{source.name}</p>
                        <p className="text-xs text-muted-foreground">Match {source.matchNumber}</p>
                      </div>
                      <Badge variant="secondary">{source.pointsCount} players</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
            {copyingPoints && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Copying points...
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Sync Dialog */}
        <Dialog open={bulkSyncDialog} onOpenChange={setBulkSyncDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bulk Sync Points</DialogTitle>
              <DialogDescription>
                Copy all match points from another tournament. Matches are paired by match number, players by name. Existing points will be overwritten.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source Tournament</Label>
                <Select value={selectedSourceTournament} onValueChange={setSelectedSourceTournament}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTournaments.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {bulkSyncing && bulkSyncProgress.total > 0 && (
                <div className="space-y-2">
                  <Progress value={(bulkSyncProgress.current / bulkSyncProgress.total) * 100} />
                  <p className="text-xs text-muted-foreground">
                    Processing match {bulkSyncProgress.current}/{bulkSyncProgress.total} • {bulkSyncProgress.matched} players matched
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkSyncDialog(false)} disabled={bulkSyncing}>
                Cancel
              </Button>
              <Button onClick={handleBulkSync} disabled={bulkSyncing || !selectedSourceTournament}>
                {bulkSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CopyCheck className="h-4 w-4 mr-2" />
                    Sync All Matches
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              <Button onClick={() => handleFetchFromAPI(false)} disabled={fetchingPoints || !externalMatchId.trim()}>
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
