import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePlayerPoints } from "@/hooks/usePlayerMatchPoints";
import { useMatches } from "@/hooks/useMatches";

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    name: string;
    role: string;
    category?: string;
    base_price?: number;
    auction_price?: number;
    total_points: number;
    real_teams?: { name: string };
    team_owners?: { name: string };
  };
  tournamentId: string;
}

const PlayerDetailModal = ({ isOpen, onClose, player, tournamentId }: PlayerDetailModalProps) => {
  const { data: playerPoints, isLoading } = usePlayerPoints(player.id);
  const { matches } = useMatches(tournamentId);

  // Match player points with match details
  const playerMatchDetails = playerPoints?.map(pp => {
    const match = matches.find(m => m.id === pp.match_id);
    return {
      ...pp,
      match,
    };
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{player.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold capitalize">{player.role}</p>
            </div>
            {player.category && (
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="secondary">{player.category}</Badge>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Real Team</p>
              <p className="font-semibold">{player.real_teams?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fantasy Team</p>
              <p className="font-semibold">{player.team_owners?.name || 'Unsold'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Base Price</p>
              <p className="font-semibold">₹{player.base_price?.toLocaleString() || '—'}</p>
            </div>
            {player.auction_price && (
              <div>
                <p className="text-sm text-muted-foreground">Auction Price</p>
                <p className="font-semibold">₹{player.auction_price.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="font-semibold text-lg text-primary">{player.total_points}</p>
            </div>
          </div>

          {/* Match Points */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Match Performance</h3>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : playerMatchDetails.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match</TableHead>
                      <TableHead>Teams</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerMatchDetails.map((pmd) => (
                      <TableRow key={pmd.id}>
                        <TableCell className="font-medium">
                          Match {pmd.match?.match_number || '—'}
                        </TableCell>
                        <TableCell>
                          {pmd.match ? (
                            <span className="text-sm">
                              {pmd.match.team1?.name || '—'} vs {pmd.match.team2?.name || '—'}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pmd.match?.venue || '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {pmd.points}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No match performance data available
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDetailModal;
