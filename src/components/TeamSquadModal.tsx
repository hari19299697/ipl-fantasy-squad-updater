
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Player = Database['public']['Tables']['players']['Row'] & {
  real_teams: Database['public']['Tables']['real_teams']['Row'] | null;
  team_owners: Database['public']['Tables']['team_owners']['Row'] | null;
};

interface TeamSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  ownerName: string;
  players: Player[];
}

const TeamSquadModal = ({ isOpen, onClose, ownerId, ownerName, players }: TeamSquadModalProps) => {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Sort players by total points (descending)
  const sortedPlayers = [...players].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

  const togglePlayerExpand = (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
    } else {
      setExpandedPlayer(playerId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{ownerName}'s Squad</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-3">Squad Members (sorted by total points)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => (
                <TableRow 
                  key={player.id} 
                  className="group hover:bg-muted/50"
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{player.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{player.role.replace('_', ' ')}</TableCell>
                  <TableCell>{player.real_teams?.short_name || 'N/A'}</TableCell>
                  <TableCell className="text-right font-semibold">{player.total_points || 0}</TableCell>
                  <TableCell className="text-center">
                    <ChevronDown className="h-5 w-5 inline-block text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSquadModal;
