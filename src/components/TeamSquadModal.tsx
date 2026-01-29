import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Wallet, Users, Trophy } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

// Use a flexible type that works with both team_owners and team_owners_public views
type TeamOwnerBase = {
  id: string | null;
  name: string | null;
  short_name: string | null;
  color: string | null;
  total_points: number | null;
  tournament_id: string | null;
  created_at: string | null;
  budget_remaining?: number | null;
  user_id?: string | null;
};

type Player = Database['public']['Tables']['players']['Row'] & {
  real_teams: Database['public']['Tables']['real_teams']['Row'] | null;
  team_owners: TeamOwnerBase | null;
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

const TeamSquadModal = ({ isOpen, onClose, ownerId, ownerName, players, team, maxPlayers }: TeamSquadModalProps) => {
  // Sort players by auction price (descending), then by total points
  const sortedPlayers = [...players].sort((a, b) => {
    const priceA = a.auction_price || 0;
    const priceB = b.auction_price || 0;
    if (priceB !== priceA) return priceB - priceA;
    return (b.total_points || 0) - (a.total_points || 0);
  });

  const totalSpent = players.reduce((sum, p) => sum + (p.auction_price || 0), 0);

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
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="text-lg font-bold">{team?.total_points || 0}</p>
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
                  <TableHead>Player</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Base Price</TableHead>
                  <TableHead className="text-right">Purchased At</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player) => (
                  <TableRow 
                    key={player.id} 
                    className="group hover:bg-muted/50"
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
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSquadModal;
