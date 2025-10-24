import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeamOwners } from '@/hooks/useTeamOwners';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Gavel, Trophy, DollarSign, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import PlayerDetailModal from '@/components/PlayerDetailModal';

const Auction = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(tournamentId);
  const { players, isLoading: playersLoading, updatePlayer } = usePlayers(tournamentId);
  const { teamOwners, isLoading: ownersLoading } = useTeamOwners(tournamentId);
  const { categories, isLoading: categoriesLoading } = useCategories(tournamentId);

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<typeof players[0] | null>(null);
  const [shuffledPlayers, setShuffledPlayers] = useState<any[]>([]);

  // Shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize shuffled players when players or categories change
  useEffect(() => {
    if (players.length > 0 && categories.length > 0) {
      const unsoldPlayers = players.filter(p => !p.owner_id);
      const shuffled = shuffleArray(unsoldPlayers);
      setShuffledPlayers(shuffled);
    }
  }, [players.length, categories.length]);

  // Group shuffled players by category
  const playersByCategory = categories.map(category => ({
    category,
    players: shuffledPlayers.filter(p => p.category === category.name)
  }));

  const soldPlayers = players.filter(p => p.owner_id);
  const unsoldPlayers = players.filter(p => !p.owner_id);

  const currentCategory = playersByCategory[currentCategoryIndex];
  const currentCategoryPlayers = currentCategory?.players || [];
  const currentPlayer = currentCategoryPlayers[currentPlayerIndex];

  // Set initial bid when player changes
  useEffect(() => {
    if (currentPlayer) {
      setCurrentBid(currentPlayer.base_price || 0);
      setBidAmount('');
      setSelectedOwner(null);
    }
  }, [currentPlayer]);

  const handleIncrementBid = () => {
    if (!currentPlayer || !currentCategory) return;

    const adder = currentCategory.category.adder || 1000;
    const newBid = currentBid + adder;

    setCurrentBid(newBid);
    setBidAmount(newBid.toString());

    toast({
      title: "Bid Incremented",
      description: `New bid: ₹${newBid.toLocaleString()}`,
    });
  };

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

    // Invalidate team owners query to refresh budget immediately
    queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });

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

    // Check remaining unsold players in current category
    const remainingUnsoldInCategory = currentCategoryPlayers.filter(
      p => p.id !== currentPlayer.id && !p.owner_id
    );

    // Move to next player in current category
    if (currentPlayerIndex + 1 < currentCategoryPlayers.length) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else if (remainingUnsoldInCategory.length > 0) {
      // Loop back to start of unsold players in same category
      setCurrentPlayerIndex(0);
      toast({
        title: "Continuing with Unsold Players",
        description: `${remainingUnsoldInCategory.length} unsold players remaining in ${currentCategory.category.name}`,
      });
    } else {
      // All players in category are now sold, move to next category
      if (currentCategoryIndex + 1 < playersByCategory.length) {
        toast({
          title: "Category Complete!",
          description: `${currentCategory.category.name} auction complete. Click "Next Category" to continue.`,
        });
      } else {
        toast({
          title: "Auction Complete!",
          description: "All categories have been auctioned",
        });
      }
    }
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

    // Move to next player in current category (unsold players stay in the list)
    if (currentPlayerIndex + 1 < currentCategoryPlayers.length) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      // Loop back to start to show unsold players again
      setCurrentPlayerIndex(0);
      toast({
        title: "Continuing with Unsold Players",
        description: `Showing unsold players in ${currentCategory.category.name} category`,
      });
    }
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex + 1 < playersByCategory.length) {
      setCurrentCategoryIndex(prev => prev + 1);
      setCurrentPlayerIndex(0);
      toast({
        title: "New Category Started",
        description: `Starting ${playersByCategory[currentCategoryIndex + 1].category.name} auction`,
      });
    }
  };

  if (tournamentLoading || playersLoading || ownersLoading || categoriesLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-8">Tournament not found</div>;
  }

  // Check if there are no players at all
  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Gavel className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">No Players Available</h1>
          <p className="text-muted-foreground mb-8">Please add players to start the auction</p>
          <Button onClick={() => navigate(`/tournaments/${tournamentId}`)}>
            Back to Tournament
          </Button>
        </div>
      </div>
    );
  }

  const allPlayersAuctioned = unsoldPlayers.length === 0;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Gavel className="h-6 w-6 sm:h-8 sm:w-8" />
              Live Auction
            </h1>
            <p className="text-sm text-muted-foreground">{tournament.name}</p>
          </div>
        </div>

        <Tabs defaultValue="live" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="live" className="text-xs sm:text-sm">Live Auction</TabsTrigger>
            <TabsTrigger value="all-players" className="text-xs sm:text-sm">All Players</TabsTrigger>
            <TabsTrigger value="sold" className="text-xs sm:text-sm">Sold ({soldPlayers.length})</TabsTrigger>
            <TabsTrigger value="unsold" className="text-xs sm:text-sm">Unsold ({unsoldPlayers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            {allPlayersAuctioned ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h2 className="text-3xl font-bold mb-4">Auction Complete!</h2>
                <p className="text-muted-foreground mb-8">All players have been auctioned</p>
                <Button onClick={() => navigate(`/tournaments/${tournamentId}`)}>
                  View Tournament
                </Button>
              </div>
            ) : (
              <>
                {/* Category Toggle Buttons */}
                <Card className="p-4 mb-4">
                  <h3 className="text-sm font-semibold mb-3">Select Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {playersByCategory.map((categoryGroup, idx) => (
                      <Button
                        key={categoryGroup.category.id}
                        onClick={() => {
                          setCurrentCategoryIndex(idx);
                          setCurrentPlayerIndex(0);
                        }}
                        variant={currentCategoryIndex === idx ? "default" : "outline"}
                        size="sm"
                        className="flex-1 min-w-[120px]"
                      >
                        {categoryGroup.category.name}
                        <Badge 
                          variant="secondary" 
                          className="ml-2"
                        >
                          {categoryGroup.players.length}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Current Player */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                  {currentPlayer ? (
                    <Card className="p-6">
                      <div className="text-center mb-6">
                        <div className="flex justify-center gap-2 mb-4">
                          <Badge variant="secondary">
                            Category: {currentCategory.category.name}
                          </Badge>
                          <Badge variant="outline">
                            Player {currentPlayerIndex + 1} of {currentCategoryPlayers.length}
                          </Badge>
                        </div>
                        <h2 className="text-4xl font-bold mb-2">{currentPlayer.name}</h2>
                        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                          <span className="capitalize">{currentPlayer.role}</span>
                          <span>•</span>
                          <span>{currentPlayer.real_teams?.name}</span>
                          <span>•</span>
                          <span>Base: ₹{currentPlayer.base_price?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-primary/10 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Current Bid</p>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
                          ₹{currentBid.toLocaleString()}
                        </p>
                        {selectedOwner && (
                          <p className="text-xs sm:text-sm mt-2">
                            by {teamOwners.find(o => o.id === selectedOwner)?.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={handleIncrementBid}
                            variant="outline"
                            className="flex items-center justify-center gap-2 w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">Add ₹{currentCategory.category.adder?.toLocaleString() || '1,000'}</span>
                          </Button>
                          <Input
                            type="number"
                            placeholder="Custom bid"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleBid} disabled={!selectedOwner || !bidAmount} className="w-full sm:w-auto">
                            Place Bid
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSold}
                            disabled={currentBid === 0 || !selectedOwner}
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

                        {currentPlayerIndex + 1 >= currentCategoryPlayers.length && 
                         currentCategoryIndex + 1 < playersByCategory.length && (
                          <Button
                            onClick={handleNextCategory}
                            variant="outline"
                            className="w-full"
                          >
                            Next Category: {playersByCategory[currentCategoryIndex + 1].category.name}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">
                        {currentCategory 
                          ? `No more players in ${currentCategory.category.name} category`
                          : 'No players available for auction'}
                      </p>
                      {currentCategoryIndex + 1 < playersByCategory.length && (
                        <Button onClick={handleNextCategory} className="mt-4">
                          Next Category: {playersByCategory[currentCategoryIndex + 1].category.name}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </Card>
                  )}
                </div>

                {/* Team Owners */}
                <div className="order-1 lg:order-2 space-y-4">
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Team Owners</h3>
                    <div className="space-y-2 max-h-[300px] sm:max-h-none overflow-y-auto">
                      {teamOwners.map((owner) => (
                        <button
                          key={owner.id}
                          onClick={() => setSelectedOwner(owner.id)}
                          className={`w-full text-left p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                            selectedOwner === owner.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm sm:text-base">{owner.name}</span>
                            <Badge style={{ backgroundColor: owner.color }} className="text-xs">
                              {owner.short_name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>₹{owner.budget_remaining.toLocaleString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Teams Leaderboard */}
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Live Standings
                    </h3>
                    <div className="space-y-2">
                      {[...teamOwners]
                        .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
                        .map((owner, index) => (
                          <div
                            key={owner.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                          >
                            <div 
                              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                              style={{ 
                                backgroundColor: `${owner.color}20`, 
                                color: owner.color 
                              }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">{owner.short_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {players.filter(p => p.owner_id === owner.id).length} players
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold">{owner.total_points || 0}</p>
                              <p className="text-xs text-muted-foreground">pts</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="all-players">
            <div className="space-y-6">
              {playersByCategory.map((categoryGroup, idx) => (
                <Card key={categoryGroup.category.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{categoryGroup.category.name}</h3>
                    <Badge variant="secondary">
                      {categoryGroup.players.length} players remaining
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryGroup.players.map((player) => (
                      <Card
                        key={player.id}
                        className="p-4 cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <h4 className="font-semibold">{player.name}</h4>
                        <div className="text-sm text-muted-foreground space-y-1 mt-2">
                          <p className="capitalize">{player.role}</p>
                          <p>{player.real_teams?.name}</p>
                          <p>Base: ₹{player.base_price?.toLocaleString()}</p>
                        </div>
                      </Card>
                    ))}
                    {categoryGroup.players.length === 0 && (
                      <p className="text-muted-foreground col-span-full text-center py-8">
                        All players in this category have been auctioned
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sold">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {soldPlayers.map((player) => (
                <Card
                  key={player.id}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{player.name}</h4>
                    <Badge variant="default">Sold</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="capitalize">{player.role}</p>
                    <p>{player.real_teams?.name}</p>
                    <p className="font-semibold text-primary">
                      ₹{player.auction_price?.toLocaleString()}
                    </p>
                    <p>Owner: {player.team_owners?.name}</p>
                  </div>
                </Card>
              ))}
              {soldPlayers.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">
                  No players sold yet
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unsold">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unsoldPlayers.map((player) => (
                <Card
                  key={player.id}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{player.name}</h4>
                    <Badge variant="secondary">{player.category || 'N/A'}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="capitalize">{player.role}</p>
                    <p>{player.real_teams?.name}</p>
                    <p>Base: ₹{player.base_price?.toLocaleString()}</p>
                  </div>
                </Card>
              ))}
              {unsoldPlayers.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">
                  All players have been sold
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {selectedPlayer && (
          <PlayerDetailModal
            isOpen={!!selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            player={selectedPlayer}
            tournamentId={tournamentId || ''}
          />
        )}
      </div>
    </div>
  );
};

export default Auction;
