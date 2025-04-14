
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Player, Match } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useState, useEffect } from "react";
import { sampleMatches } from "../data/sampleData";

interface TeamSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  ownerName: string;
  players: Player[];
}

const TeamSquadModal = ({ isOpen, onClose, ownerId, ownerName, players }: TeamSquadModalProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{ownerName}'s Squad</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => (
                <TableRow key={player.id} className="group hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{player.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{player.role}</TableCell>
                  <TableCell>{player.iplTeam}</TableCell>
                  <TableCell className="text-right font-semibold">{player.totalPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">Match Points Breakdown</h3>
          
          {sortedPlayers.length > 0 ? (
            <div className="space-y-4">
              {sortedPlayers.map((player) => {
                const matchesWithPoints = Object.entries(player.matchPoints)
                  .filter(([, points]) => points > 0)
                  .sort(([, pointsA], [, pointsB]) => pointsB - pointsA);
                
                return matchesWithPoints.length > 0 ? (
                  <div key={player.id} className="border rounded-md p-3">
                    <h4 className="font-medium text-lg">{player.name}</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {matchesWithPoints.map(([matchId, points]) => (
                        <div key={matchId} className="flex justify-between border-b pb-1">
                          <span className="text-sm text-gray-600">{getMatchDetails(matchId)}</span>
                          <span className="font-semibold">{points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-gray-500">No match points recorded yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSquadModal;
