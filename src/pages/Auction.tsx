import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeamOwners } from '@/hooks/useTeamOwners';
import { useTournament } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Gavel, Trophy, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auction = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(tournamentId);
  const { players, isLoading: playersLoading, updatePlayer } = usePlayers(tournamentId);
  const { teamOwners, isLoading: ownersLoading } = useTeamOwners(tournamentId);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');

  const unsoldPlayers = players.filter(p => !p.owner_id);
  const currentPlayer = unsoldPlayers[currentPlayerIndex];

  const handleBid = async () => {
    if (!selectedOwner || !bidAmount || !currentPlayer) return;

    const bid = parseInt(bidAmount);
    const owner = teamOwners.find(o => o.id === selectedOwner);
    
    if (!owner) return;

    if (bid <= currentBid) {
      toast({
        title: "Invalid Bid",
        description: "Bid must be higher than current bid",
        variant: "destructive",
      });
      return;
    }

    if (bid > owner.budget_remaining) {
      toast({
        title: "Insufficient Budget",
        description: `${owner.name} doesn't have enough budget`,
        variant: "destructive",
      });
      return;
    }

    setCurrentBid(bid);
    
    // Log auction action
    await supabase.from('auction_logs').insert({
      tournament_id: tournamentId,
      player_id: currentPlayer.id,
      bidder_id: selectedOwner,
      bid_amount: bid,
      action: 'bid',
    });

    toast({
      title: "Bid Placed",
      description: `${owner.name} bid ₹${bid.toLocaleString()}`,
    });
  };

  const handleSold = async () => {
    if (!currentPlayer || currentBid === 0 || !selectedOwner) {
      toast({
        title: "Error",
        description: "No valid bid to finalize",
        variant: "destructive",
      });
      return;
    }

    const owner = teamOwners.find(o => o.id === selectedOwner);
    if (!owner) return;

    // Update player with owner and auction price
    await updatePlayer({
      id: currentPlayer.id,
      updates: {
        owner_id: selectedOwner,
        auction_price: currentBid,
      },
    });

    // Update owner budget
    await supabase
      .from('team_owners')
      .update({ budget_remaining: owner.budget_remaining - currentBid })
      .eq('id', selectedOwner);

    // Log sold action
    await supabase.from('auction_logs').insert({
      tournament_id: tournamentId,
      player_id: currentPlayer.id,
      bidder_id: selectedOwner,
      bid_amount: currentBid,
      action: 'sold',
    });

    toast({
      title: "Player Sold!",
      description: `${currentPlayer.name} sold to ${owner.name} for ₹${currentBid.toLocaleString()}`,
    });

    // Move to next player
    setCurrentPlayerIndex(prev => prev + 1);
    setCurrentBid(0);
    setSelectedOwner(null);
    setBidAmount('');
  };

  const handleUnsold = async () => {
    if (!currentPlayer) return;

    await supabase.from('auction_logs').insert({
      tournament_id: tournamentId,
      player_id: currentPlayer.id,
      bidder_id: null,
      bid_amount: 0,
      action: 'unsold',
    });

    toast({
      title: "Player Unsold",
      description: `${currentPlayer.name} remains unsold`,
    });

    setCurrentPlayerIndex(prev => prev + 1);
    setCurrentBid(0);
    setSelectedOwner(null);
    setBidAmount('');
  };

  if (tournamentLoading || playersLoading || ownersLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-8">Tournament not found</div>;
  }

  if (unsoldPlayers.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-4">Auction Complete!</h1>
          <p className="text-muted-foreground mb-8">All players have been auctioned</p>
          <Button onClick={() => navigate(`/tournament/${tournamentId}`)}>
            View Tournament
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/tournament/${tournamentId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gavel className="h-8 w-8" />
              Live Auction
            </h1>
            <p className="text-muted-foreground">{tournament.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Player */}
          <div className="lg:col-span-2">
            {currentPlayer && (
              <Card className="p-6">
                <div className="text-center mb-6">
                  <Badge variant="secondary" className="mb-4">
                    Player {currentPlayerIndex + 1} of {unsoldPlayers.length}
                  </Badge>
                  <h2 className="text-4xl font-bold mb-2">{currentPlayer.name}</h2>
                  <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <span className="capitalize">{currentPlayer.role}</span>
                    <span>•</span>
                    <span>{currentPlayer.real_teams?.name}</span>
                    <span>•</span>
                    <span>Base: ₹{currentPlayer.base_price?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-primary/10 rounded-lg p-6 mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Current Bid</p>
                  <p className="text-5xl font-bold text-primary">
                    ₹{currentBid === 0 ? currentPlayer.base_price?.toLocaleString() : currentBid.toLocaleString()}
                  </p>
                  {selectedOwner && (
                    <p className="text-sm mt-2">
                      by {teamOwners.find(o => o.id === selectedOwner)?.name}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter bid amount"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleBid} disabled={!selectedOwner || !bidAmount}>
                      Place Bid
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSold}
                      disabled={currentBid === 0}
                      className="flex-1"
                    >
                      Sold
                    </Button>
                    <Button
                      onClick={handleUnsold}
                      variant="secondary"
                      className="flex-1"
                    >
                      Unsold
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Team Owners */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Team Owners</h3>
              <div className="space-y-2">
                {teamOwners.map((owner) => (
                  <button
                    key={owner.id}
                    onClick={() => setSelectedOwner(owner.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedOwner === owner.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{owner.name}</span>
                      <Badge style={{ backgroundColor: owner.color }}>
                        {owner.short_name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>₹{owner.budget_remaining.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auction;
