
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Player, Match } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useState, useEffect } from "react";
import { sampleMatches } from "../data/sampleData";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TeamSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  ownerName: string;
  players: Player[];
}

const TeamSquadModal = ({ isOpen, onClose, ownerId, ownerName, players }: TeamSquadModalProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  
  useEffect(() => {
    setMatches(sampleMatches);
  }, []);

  // Sort players by total points (descending)
  const sortedPlayers = [...players].sort((a, b) => b.totalPoints - a.totalPoints);

  // Get match details for display
  const getMatchDetails = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    return match ? `${match.team1} vs ${match.team2}` : '';
  };

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
                <>
                  <TableRow 
                    key={player.id} 
                    className={`group hover:bg-gray-50 ${expandedPlayer === player.id ? 'bg-gray-50' : ''}`}
                    onClick={() => togglePlayerExpand(player.id)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{player.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{player.role}</TableCell>
                    <TableCell>{player.iplTeam}</TableCell>
                    <TableCell className="text-right font-semibold">{player.totalPoints}</TableCell>
                    <TableCell className="text-center">
                      {expandedPlayer === player.id ? (
                        <ChevronUp className="h-5 w-5 inline-block text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 inline-block text-gray-500" />
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedPlayer === player.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0 border-t-0">
                        <div className="bg-gray-50 p-3 rounded-b-md">
                          <h4 className="font-medium text-sm mb-2 text-gray-700">Match Points Breakdown</h4>
                          {Object.entries(player.matchPoints).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(player.matchPoints)
                                .filter(([, points]) => points > 0)
                                .sort(([, pointsA], [, pointsB]) => pointsB - pointsA)
                                .map(([matchId, points]) => (
                                  <div key={matchId} className="flex justify-between border-b pb-1">
                                    <span className="text-sm text-gray-600">{getMatchDetails(matchId)}</span>
                                    <span className="font-semibold">{points} pts</span>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No match points recorded yet.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSquadModal;
