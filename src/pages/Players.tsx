import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useTournament } from '@/hooks/useTournaments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Players = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(tournamentId);
  const { players, isLoading: playersLoading } = usePlayers(tournamentId);

  if (tournamentLoading || playersLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-8">Tournament not found</div>;
  }

  // Sort players by total points
  const sortedPlayers = [...players].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Players</h1>
            <p className="text-muted-foreground">{tournament.name}</p>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Player Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Real Team</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Auction Price</TableHead>
                <TableHead className="text-right">
                  <Trophy className="h-4 w-4 inline mr-1" />
                  Points
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player, index) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-semibold">{player.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {player.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{player.real_teams?.name}</TableCell>
                  <TableCell>
                    {player.team_owners ? (
                      <Badge style={{ backgroundColor: player.team_owners.color }}>
                        {player.team_owners.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Unsold</span>
                    )}
                  </TableCell>
                  <TableCell>₹{player.base_price?.toLocaleString()}</TableCell>
                  <TableCell>
                    {player.auction_price ? (
                      `₹${player.auction_price.toLocaleString()}`
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {player.total_points || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Players;
