import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Wallet, Users, Trophy, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

const TeamSquadModal = ({ isOpen, onClose, ownerId, ownerName, players, team, maxPlayers }: TeamSquadModalProps) => {
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const TOP_N = 18;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' || field === 'team' ? 'asc' : 'desc');
    }
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

  // Always sort by points desc to determine top N for total calculation
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
                  // Determine if this player is in the top N by points
                  const top18Ids = new Set(pointsSorted.slice(0, TOP_N).map(p => p.id));
                  const isInTop = top18Ids.has(player.id);
                  
                  // Find if this is the boundary row (last top-N player in current sort order)
                  const topIndices = sortedPlayers
                    .map((p, i) => top18Ids.has(p.id) ? i : -1)
                    .filter(i => i !== -1);
                  const lastTopIndex = topIndices.length > 0 ? Math.max(...topIndices) : -1;
                  const isBoundary = index === lastTopIndex && players.length > TOP_N;

                  return (
                    <>
                      <TableRow 
                        key={player.id} 
                        className={`group hover:bg-muted/50 ${isInTop ? 'bg-primary/5' : 'opacity-50'}`}
                      >
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
                      {isBoundary && (
                        <TableRow key={`divider-${player.id}`}>
                          <TableCell colSpan={6} className="p-0">
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
