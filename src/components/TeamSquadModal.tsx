import { useState, useMemo, Fragment } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Wallet, Users, Trophy, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Loader2, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Player = Database['public']['Tables']['players']['Row'] & {
  real_teams: Database['public']['Tables']['real_teams']['Row'] | null;
  team_owners: Database['public']['Tables']['team_owners']['Row'] | null;
};

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];

interface TeamSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  ownerName: string;
  players: Player[];
  team?: TeamOwner | null;
  maxPlayers?: number;
}

type SortField = 'name' | 'points' | 'auction_price' | 'team';
type SortDir = 'asc' | 'desc';

const PlayerMatchBreakdown = ({ playerId }: { playerId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['playerMatchBreakdown', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_match_points')
        .select(`
          points,
          matches (
            match_number,
            match_date,
            team1:real_teams!matches_team1_id_fkey(short_name),
            team2:real_teams!matches_team2_id_fkey(short_name)
          )
        `)
        .eq('player_id', playerId)
        .order('matches(match_number)');
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading match data...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-3 text-center">No match points recorded yet</p>
    );
  }

  const totalPoints = data.reduce((sum, d) => sum + d.points, 0);
  const matchCount = data.length;
  const avgPoints = matchCount > 0 ? (totalPoints / matchCount).toFixed(1) : '0';
  const maxPoints = Math.max(...data.map(d => d.points));
  const minPoints = Math.min(...data.map(d => d.points));

  return (
    <div className="space-y-3">
      {/* Mini stats row */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary font-medium">
          <BarChart3 className="h-3 w-3" />
          {matchCount} Matches
        </div>
        <div className="px-2 py-1 rounded bg-muted">
          Avg: <span className="font-semibold">{avgPoints}</span>
        </div>
        <div className="px-2 py-1 rounded bg-muted">
          Best: <span className="font-semibold text-green-600">{maxPoints}</span>
        </div>
        <div className="px-2 py-1 rounded bg-muted">
          Worst: <span className="font-semibold text-red-500">{minPoints}</span>
        </div>
      </div>

      {/* Match-by-match table */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1 text-sm">
        <div className="font-medium text-muted-foreground text-xs pb-1">Match</div>
        <div className="font-medium text-muted-foreground text-xs pb-1">Teams</div>
        <div className="font-medium text-muted-foreground text-xs pb-1 text-right">Points</div>
        {data.map((entry: any, i: number) => {
          const match = entry.matches;
          const team1 = match?.team1?.short_name || '?';
          const team2 = match?.team2?.short_name || '?';
          const isHighest = entry.points === maxPoints && maxPoints > 0;
          const isLowest = entry.points === minPoints && data.length > 1;

          return (
            <div key={i} className="contents">
              <div className="text-muted-foreground font-mono">#{match?.match_number}</div>
              <div>{team1} vs {team2}</div>
              <div className={`text-right font-semibold ${isHighest ? 'text-green-600' : isLowest ? 'text-red-500' : ''}`}>
                {entry.points}
              </div>
            </div>
          );
        })}
        {/* Total row */}
        <div className="contents border-t">
          <div className="pt-2 mt-1 border-t font-semibold text-muted-foreground">Total</div>
          <div className="pt-2 mt-1 border-t"></div>
          <div className="pt-2 mt-1 border-t text-right font-bold">{totalPoints}</div>
        </div>
      </div>
    </div>
  );
};

const TeamSquadModal = ({ isOpen, onClose, ownerId, ownerName, players, team, maxPlayers }: TeamSquadModalProps) => {
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const TOP_N = 18;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' || field === 'team' ? 'asc' : 'desc');
    }
  };

  const togglePlayer = (playerId: string) => {
    setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'points':
          return dir * ((a.total_points || 0) - (b.total_points || 0));
        case 'auction_price':
          return dir * ((a.auction_price || 0) - (b.auction_price || 0));
        case 'team':
          return dir * (a.real_teams?.short_name || '').localeCompare(b.real_teams?.short_name || '');
        default:
          return 0;
      }
    });
  }, [players, sortField, sortDir]);

  const totalSpent = players.reduce((sum, p) => sum + (p.auction_price || 0), 0);

  const pointsSorted = useMemo(() => {
    return [...players].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  }, [players]);

  const top18Total = useMemo(() => {
    return pointsSorted.slice(0, TOP_N).reduce((sum, p) => sum + (p.total_points || 0), 0);
  }, [pointsSorted]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{ownerName}'s Squad</DialogTitle>
        </DialogHeader>
        
        {/* Top Section - Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Wallet Balance</p>
              <p className="text-lg font-bold">₹{team?.budget_remaining?.toLocaleString() || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Players Purchased</p>
              <p className="text-lg font-bold">
                {players.length}{maxPlayers ? ` / ${maxPlayers}` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Points (Top {TOP_N})</p>
              <p className="text-lg font-bold">{top18Total}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Amount Spent</p>
              <p className="text-lg font-bold">₹{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Players List */}
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-3">Squad Members ({players.length} players)</h3>
          {sortedPlayers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No players purchased yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <span className="flex items-center">Player <SortIcon field="name" /></span>
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('team')}>
                    <span className="flex items-center">Team <SortIcon field="team" /></span>
                  </TableHead>
                  <TableHead className="text-right">Base Price</TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('auction_price')}>
                    <span className="flex items-center justify-end">Purchased At <SortIcon field="auction_price" /></span>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('points')}>
                    <span className="flex items-center justify-end">Points <SortIcon field="points" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player, index) => {
                  const top18Ids = new Set(pointsSorted.slice(0, TOP_N).map(p => p.id));
                  const isInTop = top18Ids.has(player.id);
                  const isExpanded = expandedPlayerId === player.id;
                  
                  const topIndices = sortedPlayers
                    .map((p, i) => top18Ids.has(p.id) ? i : -1)
                    .filter(i => i !== -1);
                  const lastTopIndex = topIndices.length > 0 ? Math.max(...topIndices) : -1;
                  const isBoundary = index === lastTopIndex && players.length > TOP_N;

                  return (
                    <Fragment key={player.id}>
                      <TableRow
                        className={`cursor-pointer transition-colors ${isInTop ? 'bg-primary/5' : 'opacity-50'} ${isExpanded ? 'bg-accent/50' : 'hover:bg-muted/50'}`}
                        onClick={() => togglePlayer(player.id)}
                      >
                        <TableCell className="w-8 pr-0">
                          {isExpanded 
                            ? <ChevronDown className="h-4 w-4 text-primary" /> 
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{player.name}</div>
                          {player.category && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {player.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{player.role.replace('_', ' ')}</TableCell>
                        <TableCell>{player.real_teams?.short_name || 'N/A'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{(player.base_price || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          ₹{(player.auction_price || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{player.total_points || 0}</TableCell>
                      </TableRow>
                      
                      {/* Expanded match breakdown */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-accent/30 border-l-4 border-primary/40 p-4">
                            <PlayerMatchBreakdown playerId={player.id} />
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {isBoundary && (
                        <TableRow key={`divider-${player.id}`}>
                          <TableCell colSpan={7} className="p-0">
                            <div className="border-t-2 border-dashed border-primary/40 my-0 relative">
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground font-medium">
                                Top {TOP_N} — Total: {top18Total} pts
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSquadModal;
