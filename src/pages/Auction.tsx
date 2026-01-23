import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeamOwners } from '@/hooks/useTeamOwners';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AdminGuard from '@/components/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Gavel, 
  Trophy, 
  DollarSign, 
  Plus,
  Minus,
  ChevronRight, 
  RotateCcw,
  Users,
  TrendingUp,
  Sparkles,
  User,
  Zap,
  Crown,
  ScrollText,
  Clock,
  Undo2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import PlayerDetailModal from '@/components/PlayerDetailModal';
import SoldCelebration from '@/components/SoldCelebration';

// Format number with Indian locale and support decimals
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

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
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [initialBudget, setInitialBudget] = useState<number>(0);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState<number>(25);
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    playerName: '',
    teamName: '',
    teamColor: '',
    soldPrice: 0,
  });
  
  // Audit logs state
  const [auctionLogs, setAuctionLogs] = useState<any[]>([]);
  
  // Last sold player for undo
  const [lastSoldPlayer, setLastSoldPlayer] = useState<{
    playerId: string;
    playerName: string;
    ownerId: string;
    ownerName: string;
    soldPrice: number;
    previousBudget: number;
  } | null>(null);

  // Calculate minimum base price of unsold players
  const minBasePrice = React.useMemo(() => {
    const unsoldWithPrice = players.filter(p => !p.owner_id && p.base_price && p.base_price > 0);
    if (unsoldWithPrice.length === 0) return 0;
    return Math.min(...unsoldWithPrice.map(p => p.base_price!));
  }, [players]);

  // Calculate max bid for each team owner
  const getMaxBidForOwner = useCallback((ownerId: string) => {
    const owner = teamOwners.find(o => o.id === ownerId);
    if (!owner) return 0;
    
    const playersBought = players.filter(p => p.owner_id === ownerId).length;
    const remainingSlots = maxPlayersPerTeam - playersBought;
    
    if (remainingSlots <= 0) return 0;
    
    // If no unsold players with price, allow full budget
    if (minBasePrice === 0) return owner.budget_remaining;
    
    // Max bid = budget - (remaining slots after this purchase - 1) * min base price
    const maxBid = owner.budget_remaining - (remainingSlots - 1) * minBasePrice;
    
    return Math.max(0, maxBid);
  }, [teamOwners, players, maxPlayersPerTeam, minBasePrice]);

  // Check if owner can still participate in auction
  const canOwnerBid = useCallback((ownerId: string, playerBasePrice?: number) => {
    const owner = teamOwners.find(o => o.id === ownerId);
    if (!owner) return false;
    
    const playersBought = players.filter(p => p.owner_id === ownerId).length;
    const remainingSlots = maxPlayersPerTeam - playersBought;
    
    if (remainingSlots <= 0) return false;
    
    // If no minimum base price calculated, just check if budget > 0
    if (minBasePrice === 0) return owner.budget_remaining > 0;
    
    // Check if budget can cover at least the current player's base price
    const currentPrice = playerBasePrice || minBasePrice;
    
    return owner.budget_remaining >= currentPrice;
  }, [teamOwners, players, maxPlayersPerTeam, minBasePrice]);

  // Shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch auction rules
  useEffect(() => {
    const fetchAuctionRules = async () => {
      if (!tournamentId) return;
      
      const { data, error } = await supabase
        .from('tournament_auction_rules')
        .select('auction_rule_id, auction_rules(initial_budget, max_players_per_team), custom_config')
        .eq('tournament_id', tournamentId)
        .single();
      
      if (data) {
        const customConfig = data.custom_config as any;
        const budget = customConfig?.initial_budget || data.auction_rules?.initial_budget || 2000000;
        const maxPlayers = customConfig?.max_players_per_team || data.auction_rules?.max_players_per_team || 25;
        setInitialBudget(budget);
        setMaxPlayersPerTeam(maxPlayers);
      }
    };
    
    fetchAuctionRules();
  }, [tournamentId]);

  // Fetch auction logs
  useEffect(() => {
    const fetchAuctionLogs = async () => {
      if (!tournamentId) return;
      
      const { data, error } = await supabase
        .from('auction_logs')
        .select(`
          *,
          players(name, category),
          team_owners(name, short_name, color)
        `)
        .eq('tournament_id', tournamentId)
        .eq('revoked', false)
        .order('timestamp', { ascending: false });
      
      if (data && !error) {
        setAuctionLogs(data);
      }
    };
    
    fetchAuctionLogs();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('auction-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_logs',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchAuctionLogs();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  // Initialize shuffled players - update when players change
  useEffect(() => {
    if (players.length > 0 && categories.length > 0) {
      const unsoldPlayers = players.filter(p => !p.owner_id);
      const shuffled = shuffleArray(unsoldPlayers);
      setShuffledPlayers(shuffled);
    }
  }, [players, categories.length]);

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
      description: `New bid: ₹${formatCurrency(newBid)}`,
    });
  };

  const handleDecrementBid = () => {
    if (!currentPlayer || !currentCategory) return;

    const adder = currentCategory.category.adder || 1000;
    const basePrice = currentPlayer.base_price || 0;
    const newBid = Math.max(basePrice, currentBid - adder);

    if (newBid === currentBid) {
      toast({
        title: "Cannot Decrease",
        description: "Bid cannot go below base price",
        variant: "destructive",
      });
      return;
    }

    setCurrentBid(newBid);
    setBidAmount(newBid.toString());

    toast({
      title: "Bid Decremented",
      description: `New bid: ₹${formatCurrency(newBid)}`,
    });
  };

  const handleBid = async () => {
    if (!selectedOwner || !currentPlayer) return;
    
    // If no custom bid entered, use current bid (for placing bid at current level)
    const bidValue = bidAmount.trim();
    if (!bidValue) {
      toast({
        title: "Enter Bid Amount",
        description: "Please enter a bid amount or use the increment button",
        variant: "destructive",
      });
      return;
    }

    const bid = parseFloat(bidValue);
    
    if (isNaN(bid)) {
      toast({
        title: "Invalid Bid",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }
    
    const owner = teamOwners.find(o => o.id === selectedOwner);
    
    if (!owner) return;

    // Allow bid equal to current bid if it's higher than base price, or if it's a new bid
    if (bid < currentBid) {
      toast({
        title: "Invalid Bid",
        description: "Bid must be equal to or higher than current bid",
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

    const maxBid = getMaxBidForOwner(selectedOwner);
    if (bid > maxBid) {
      toast({
        title: "Bid Exceeds Limit",
        description: `${owner.name} can only bid up to ₹${formatCurrency(maxBid)} to complete squad`,
        variant: "destructive",
      });
      return;
    }

    if (!canOwnerBid(selectedOwner, currentPlayer.base_price || undefined)) {
      toast({
        title: "Cannot Bid",
        description: `${owner.name} doesn't have enough budget to complete squad requirements`,
        variant: "destructive",
      });
      return;
    }

    setCurrentBid(bid);
    
    await supabase.from('auction_logs').insert({
      tournament_id: tournamentId,
      player_id: currentPlayer.id,
      bidder_id: selectedOwner,
      bid_amount: bid,
      action: 'bid',
    });

    toast({
      title: "Bid Placed",
      description: `${owner.name} bid ₹${formatCurrency(bid)}`,
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

    const soldPlayerId = currentPlayer.id;
    const soldPlayerName = currentPlayer.name;
    const soldOwnerId = selectedOwner;
    const soldOwnerName = owner.name;
    const soldPrice = currentBid;
    const previousBudget = owner.budget_remaining;

    // Store for undo
    setLastSoldPlayer({
      playerId: soldPlayerId,
      playerName: soldPlayerName,
      ownerId: soldOwnerId,
      ownerName: soldOwnerName,
      soldPrice: soldPrice,
      previousBudget: previousBudget,
    });

    // Show celebration
    setCelebrationData({
      playerName: soldPlayerName,
      teamName: soldOwnerName,
      teamColor: owner.color || '#004CA3',
      soldPrice: soldPrice,
    });
    setShowCelebration(true);

    // Remove sold player from shuffled list IMMEDIATELY
    const newShuffledPlayers = shuffledPlayers.filter(p => p.id !== soldPlayerId);
    setShuffledPlayers(newShuffledPlayers);

    // Check remaining players in current category
    const remainingInCategory = newShuffledPlayers.filter(p => p.category === currentCategory?.category.name);
    
    if (remainingInCategory.length === 0) {
      // No more players in this category - show toast to move to next
      if (currentCategoryIndex + 1 < playersByCategory.length) {
        toast({
          title: "Category Complete!",
          description: `All players in ${currentCategory?.category.name} are done. Click "Next Category" to continue.`,
        });
      } else {
        toast({
          title: "All Categories Complete!",
          description: "All players have been auctioned.",
        });
      }
      // Reset index for when they switch category
      setCurrentPlayerIndex(0);
    } else {
      // Move to next player if current index is beyond remaining
      if (currentPlayerIndex >= remainingInCategory.length) {
        setCurrentPlayerIndex(0);
      }
    }

    // Reset bid state for next player
    setCurrentBid(0);
    setSelectedOwner(null);
    setBidAmount('');

    // Update player with owner and auction price
    await updatePlayer({
      id: soldPlayerId,
      updates: {
        owner_id: soldOwnerId,
        auction_price: soldPrice,
      },
    });

    // Update owner budget
    await supabase
      .from('team_owners')
      .update({ budget_remaining: previousBudget - soldPrice })
      .eq('id', soldOwnerId);

    // Insert auction log
    await supabase.from('auction_logs').insert({
      tournament_id: tournamentId,
      player_id: soldPlayerId,
      bidder_id: soldOwnerId,
      bid_amount: soldPrice,
      action: 'sold',
    });

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
    queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });
  };

  const handleUndoLastSale = async () => {
    if (!lastSoldPlayer || !tournamentId) return;

    try {
      // Revert player ownership
      await supabase
        .from('players')
        .update({ owner_id: null, auction_price: null })
        .eq('id', lastSoldPlayer.playerId);

      // Restore owner budget
      await supabase
        .from('team_owners')
        .update({ budget_remaining: lastSoldPlayer.previousBudget })
        .eq('id', lastSoldPlayer.ownerId);

      // Mark the sold log as revoked
      await supabase
        .from('auction_logs')
        .update({ revoked: true })
        .eq('player_id', lastSoldPlayer.playerId)
        .eq('action', 'sold')
        .eq('revoked', false);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });

      toast({
        title: "Sale Undone",
        description: `${lastSoldPlayer.playerName} is back in the pool`,
      });

      // Clear last sold player
      setLastSoldPlayer(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to undo sale",
        variant: "destructive",
      });
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
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

    if (currentPlayerIndex + 1 < currentCategoryPlayers.length) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setCurrentPlayerIndex(0);
      toast({
        title: "Continuing with Unsold Players",
        description: `Showing unsold players in ${currentCategory?.category.name} category`,
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

  const handleResetAuction = async () => {
    if (!tournamentId) return;
    
    try {
      const { error: playersError } = await supabase
        .from('players')
        .update({ owner_id: null, auction_price: null })
        .eq('tournament_id', tournamentId);
      
      if (playersError) throw playersError;

      const { error: ownersError } = await supabase
        .from('team_owners')
        .update({ budget_remaining: initialBudget })
        .eq('tournament_id', tournamentId);
      
      if (ownersError) throw ownersError;

      const { error: logsError } = await supabase
        .from('auction_logs')
        .update({ revoked: true })
        .eq('tournament_id', tournamentId);
      
      if (logsError) throw logsError;

      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });
      
      setCurrentCategoryIndex(0);
      setCurrentPlayerIndex(0);
      setCurrentBid(0);
      setSelectedOwner(null);
      setBidAmount('');
      
      toast({
        title: "Auction Reset Complete!",
        description: "All auction data has been reset. You can start fresh.",
      });
      
      setResetDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset auction",
        variant: "destructive",
      });
    }
  };

  if (tournamentLoading || playersLoading || ownersLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Gavel className="w-12 h-12 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Loading auction...</p>
        </motion.div>
      </div>
    );
  }

  if (!tournament) {
    return <div className="p-8">Tournament not found</div>;
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Gavel className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">No Players Available</h1>
            <p className="text-muted-foreground mb-8">Please add players to start the auction</p>
            <Button onClick={() => navigate(`/tournaments/${tournamentId}`)}>
              Back to Tournament
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const allPlayersAuctioned = unsoldPlayers.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Celebration Overlay */}
      <SoldCelebration
        isVisible={showCelebration}
        playerName={celebrationData.playerName}
        teamName={celebrationData.teamName}
        teamColor={celebrationData.teamColor}
        soldPrice={celebrationData.soldPrice}
        onComplete={handleCelebrationComplete}
      />

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 glass-dark border-b border-border/50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/tournaments/${tournamentId}`)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  Live Auction
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                  </motion.span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{tournament.name}</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{soldPlayers.length} Sold</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{unsoldPlayers.length} Remaining</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <RotateCcw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-12 p-1 bg-muted/50">
            <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Live</span>
            </TabsTrigger>
            <TabsTrigger value="all-players" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
            <TabsTrigger value="sold" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span>Sold ({soldPlayers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="unsold" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Unsold ({unsoldPlayers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <AnimatePresence mode="wait">
              {allPlayersAuctioned ? (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Trophy className="w-20 h-20 mx-auto mb-6 text-secondary" />
                  </motion.div>
                  <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Auction Complete!
                  </h2>
                  <p className="text-muted-foreground mb-8 text-lg">All players have been auctioned successfully</p>
                  <Button onClick={() => navigate(`/tournaments/${tournamentId}`)} size="lg">
                    View Tournament
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Category Selector */}
                  <Card className="p-4 mb-6 glass-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-secondary" />
                      <h3 className="text-sm font-semibold">Categories</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {playersByCategory.map((categoryGroup, idx) => (
                        <motion.button
                          key={categoryGroup.category.id}
                          onClick={() => {
                            setCurrentCategoryIndex(idx);
                            setCurrentPlayerIndex(0);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            currentCategoryIndex === idx
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {categoryGroup.category.name}
                          <Badge 
                            variant={currentCategoryIndex === idx ? "secondary" : "outline"}
                            className="ml-2"
                          >
                            {categoryGroup.players.length}
                          </Badge>
                        </motion.button>
                      ))}
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Current Player Card */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                      {currentPlayer ? (
                        <motion.div
                          key={currentPlayer.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="overflow-hidden player-card-shine">
                            {/* Player Header */}
                            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                              <div className="flex items-center justify-between mb-4">
                                <Badge className="category-badge text-primary-foreground border-0">
                                  {currentCategory?.category.name}
                                </Badge>
                                <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                                  {currentPlayerIndex + 1} / {currentCategoryPlayers.length}
                                </Badge>
                              </div>
                              <motion.h2 
                                className="text-3xl sm:text-4xl font-black mb-2"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                key={currentPlayer.name}
                              >
                                {currentPlayer.name}
                              </motion.h2>
                              <div className="flex flex-wrap items-center gap-3 text-sm opacity-90">
                                <span className="capitalize flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {currentPlayer.role}
                                </span>
                                <span>•</span>
                                <span>{currentPlayer.real_teams?.name || 'N/A'}</span>
                                <span>•</span>
                                <span className="font-semibold">Base: ₹{formatCurrency(currentPlayer.base_price)}</span>
                              </div>
                            </div>

                            {/* Bid Section */}
                            <div className="p-6">
                              {/* Current Bid Display */}
                              <motion.div 
                                className={`rounded-2xl p-6 mb-6 text-center ${
                                  selectedOwner ? 'bid-display-active' : 'bid-display'
                                }`}
                                animate={selectedOwner ? { scale: [1, 1.02, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                <p className="text-sm text-muted-foreground mb-1">Current Bid</p>
                                <motion.p 
                                  className="text-4xl sm:text-5xl md:text-6xl font-black text-primary"
                                  key={currentBid}
                                  initial={{ scale: 1.1 }}
                                  animate={{ scale: 1 }}
                                >
                                  ₹{formatCurrency(currentBid)}
                                </motion.p>
                                {selectedOwner && (
                                  <motion.div 
                                    className="mt-3 flex items-center justify-center gap-2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                  >
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: teamOwners.find(o => o.id === selectedOwner)?.color }}
                                    />
                                    <span className="text-sm font-medium">
                                      {teamOwners.find(o => o.id === selectedOwner)?.name}
                                    </span>
                                  </motion.div>
                                )}
                              </motion.div>

                              {/* Bid Controls */}
                              <div className="space-y-4">
                                {/* Increment/Decrement Buttons */}
                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleDecrementBid}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 h-12 text-base font-semibold text-destructive hover:bg-destructive/10 border-destructive/30"
                                  >
                                    <Minus className="h-5 w-5 mr-2" />
                                    -₹{formatCurrency(currentCategory?.category.adder) || '1,000'}
                                  </Button>
                                  <Button
                                    onClick={handleIncrementBid}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 h-12 text-base font-semibold text-primary hover:bg-primary/10 border-primary/30"
                                  >
                                    <Plus className="h-5 w-5 mr-2" />
                                    +₹{formatCurrency(currentCategory?.category.adder) || '1,000'}
                                  </Button>
                                </div>
                                
                                {/* Custom Bid Input */}
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="Custom bid amount"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    className="flex-1 h-12 text-base"
                                  />
                                  <Button 
                                    onClick={handleBid} 
                                    disabled={!selectedOwner || !bidAmount || bidAmount.trim() === ''}
                                    size="lg"
                                    className="h-12 px-6"
                                  >
                                    Bid
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    onClick={handleSold}
                                    disabled={currentBid === 0 || !selectedOwner}
                                    className="h-14 text-lg font-bold btn-sold"
                                    size="lg"
                                  >
                                    <Trophy className="h-5 w-5 mr-2" />
                                    SOLD!
                                  </Button>
                                  <Button
                                    onClick={handleUnsold}
                                    variant="secondary"
                                    className="h-14 text-lg font-bold"
                                    size="lg"
                                  >
                                    Unsold
                                  </Button>
                                </div>

                                {/* Undo Last Sale Button */}
                                {lastSoldPlayer && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                  >
                                    <Button
                                      onClick={handleUndoLastSale}
                                      variant="outline"
                                      className="w-full h-10 text-sm border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                    >
                                      <Undo2 className="h-4 w-4 mr-2" />
                                      Undo: {lastSoldPlayer.playerName} → {lastSoldPlayer.ownerName} (₹{formatCurrency(lastSoldPlayer.soldPrice)})
                                    </Button>
                                  </motion.div>
                                )}

                                {currentPlayerIndex + 1 >= currentCategoryPlayers.length && 
                                 currentCategoryIndex + 1 < playersByCategory.length && (
                                  <Button
                                    onClick={handleNextCategory}
                                    variant="outline"
                                    className="w-full h-12"
                                    size="lg"
                                  >
                                    Next: {playersByCategory[currentCategoryIndex + 1].category.name}
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ) : (
                        <Card className="p-8 text-center">
                          <Trophy className="w-12 h-12 mx-auto mb-4 text-secondary" />
                          <p className="text-lg font-semibold mb-2">
                            {currentCategory 
                              ? `${currentCategory.category.name} Complete!`
                              : 'No players available'}
                          </p>
                          <p className="text-muted-foreground mb-4">
                            {currentCategory 
                              ? 'All players in this category have been auctioned'
                              : 'No players available for auction'}
                          </p>
                          
                          {/* Show Undo button even when no current player */}
                          {lastSoldPlayer && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-4"
                            >
                              <Button
                                onClick={handleUndoLastSale}
                                variant="outline"
                                className="w-full h-10 text-sm border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              >
                                <Undo2 className="h-4 w-4 mr-2" />
                                Undo: {lastSoldPlayer.playerName} → {lastSoldPlayer.ownerName} (₹{formatCurrency(lastSoldPlayer.soldPrice)})
                              </Button>
                            </motion.div>
                          )}
                          
                          {currentCategoryIndex + 1 < playersByCategory.length && (
                            <Button onClick={handleNextCategory} size="lg">
                              Next Category: {playersByCategory[currentCategoryIndex + 1].category.name}
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </Card>
                      )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="order-1 lg:order-2 space-y-4">
                      {/* Team Owners Selection */}
                      <Card className="p-4">
                        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-secondary" />
                          Select Team
                        </h3>
                        <div className="space-y-2 max-h-[350px] overflow-y-auto auction-scroll pr-1">
                          {teamOwners.map((owner) => {
                            const playersBought = players.filter(p => p.owner_id === owner.id).length;
                            const remainingSlots = maxPlayersPerTeam - playersBought;
                            const maxBid = getMaxBidForOwner(owner.id);
                            const ownerCanBid = canOwnerBid(owner.id, currentPlayer?.base_price || undefined);
                            const squadFull = remainingSlots <= 0;
                            const isSelected = selectedOwner === owner.id;
                            
                            return (
                              <motion.button
                                key={owner.id}
                                onClick={() => !squadFull && ownerCanBid && setSelectedOwner(owner.id)}
                                disabled={squadFull || !ownerCanBid}
                                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                  squadFull || !ownerCanBid
                                    ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'
                                    : isSelected
                                      ? 'team-owner-selected border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50 bg-card'
                                }`}
                                whileHover={!squadFull && ownerCanBid ? { scale: 1.01 } : {}}
                                whileTap={!squadFull && ownerCanBid ? { scale: 0.99 } : {}}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: owner.color }}
                                    />
                                    <span className="font-semibold text-sm">{owner.name}</span>
                                  </div>
                                  {squadFull && (
                                    <Badge variant="secondary" className="text-xs">Full</Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    ₹{formatCurrency(owner.budget_remaining)}
                                  </span>
                                  <span>{playersBought}/{maxPlayersPerTeam}</span>
                                </div>
                                {!squadFull && ownerCanBid && (
                                  <div className="mt-2 text-xs font-medium text-primary flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Max: ₹{formatCurrency(maxBid)}
                                  </div>
                                )}
                                {!squadFull && !ownerCanBid && (
                                  <div className="mt-2 text-xs font-medium text-destructive">
                                    Insufficient budget
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </Card>

                      {/* Standings with Category Breakdown */}
                      <Card className="p-4">
                        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                          <Crown className="h-4 w-4 text-secondary" />
                          Standings
                        </h3>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3 pr-2">
                            {[...teamOwners]
                              .sort((a, b) => players.filter(p => p.owner_id === b.id).length - players.filter(p => p.owner_id === a.id).length)
                              .map((owner, index) => {
                                const ownerPlayers = players.filter(p => p.owner_id === owner.id);
                                const categoryBreakdown = categories.reduce((acc, cat) => {
                                  acc[cat.name] = ownerPlayers.filter(p => p.category === cat.name).length;
                                  return acc;
                                }, {} as Record<string, number>);
                                
                                return (
                                  <motion.div
                                    key={owner.id}
                                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <div 
                                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                          index === 0 ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                                        }`}
                                      >
                                        {index + 1}
                                      </div>
                                      <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: owner.color }}
                                      />
                                      <span className="text-sm font-semibold truncate flex-1">{owner.short_name}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {ownerPlayers.length} players
                                      </Badge>
                                    </div>
                                    {ownerPlayers.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {Object.entries(categoryBreakdown)
                                          .filter(([_, count]) => count > 0)
                                          .map(([category, count]) => (
                                            <Badge 
                                              key={category} 
                                              variant="outline" 
                                              className="text-xs py-0 px-1.5"
                                            >
                                              {category}: {count}
                                            </Badge>
                                          ))}
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                          </div>
                        </ScrollArea>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="all-players">
            <div className="space-y-6">
              {playersByCategory.map((categoryGroup) => (
                <Card key={categoryGroup.category.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{categoryGroup.category.name}</h3>
                    <Badge variant="secondary">
                      {categoryGroup.players.length} remaining
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryGroup.players.map((player, idx) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Card
                          className="p-4 cursor-pointer hover:border-primary transition-all hover:shadow-md player-card-shine"
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <h4 className="font-semibold mb-2">{player.name}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="capitalize">{player.role}</p>
                            <p>{player.real_teams?.name}</p>
                            <p className="font-medium text-primary">₹{formatCurrency(player.base_price)}</p>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                    {categoryGroup.players.length === 0 && (
                      <p className="text-muted-foreground col-span-full text-center py-8">
                        All players auctioned
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sold">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {soldPlayers.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card
                    className="p-4 cursor-pointer hover:border-primary transition-all hover:shadow-md player-card-shine border-l-4"
                    style={{ borderLeftColor: player.team_owners?.color || 'hsl(var(--primary))' }}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{player.name}</h4>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Sold</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="capitalize">{player.role}</p>
                      <p className="font-bold text-lg text-primary">
                        ₹{formatCurrency(player.auction_price)}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: player.team_owners?.color }}
                        />
                        <span className="text-xs font-medium">{player.team_owners?.name}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
              {soldPlayers.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">
                  No players sold yet
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unsold">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {unsoldPlayers.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card
                    className="p-4 cursor-pointer hover:border-primary transition-all hover:shadow-md player-card-shine"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{player.name}</h4>
                      <Badge variant="secondary">{player.category || 'N/A'}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="capitalize">{player.role}</p>
                      <p>{player.real_teams?.name}</p>
                      <p className="font-medium">Base: ₹{formatCurrency(player.base_price)}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
              {unsoldPlayers.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">
                  All players have been sold
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <ScrollText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Auction Audit Trail</h2>
                <Badge variant="secondary" className="ml-auto">
                  {auctionLogs.length} entries
                </Badge>
              </div>
              
              {auctionLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No auction activity yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {auctionLogs.map((log, idx) => {
                      const timestamp = new Date(log.timestamp);
                      const formattedTime = timestamp.toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      });
                      const formattedDate = timestamp.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                      });
                      
                      const getActionColor = (action: string) => {
                        switch (action) {
                          case 'sold': return 'bg-green-500/10 text-green-600 border-green-500/20';
                          case 'bid': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
                          case 'unsold': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
                          default: return 'bg-muted text-muted-foreground';
                        }
                      };
                      
                      const getActionIcon = (action: string) => {
                        switch (action) {
                          case 'sold': return <Trophy className="h-4 w-4" />;
                          case 'bid': return <Gavel className="h-4 w-4" />;
                          case 'unsold': return <User className="h-4 w-4" />;
                          default: return <Clock className="h-4 w-4" />;
                        }
                      };
                      
                      return (
                        <motion.div
                          key={log.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{log.players?.name || 'Unknown Player'}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.players?.category || 'N/A'}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {log.action === 'sold' && (
                                <span>
                                  Sold to <span className="font-medium" style={{ color: log.team_owners?.color }}>
                                    {log.team_owners?.name}
                                  </span> for <span className="font-semibold text-primary">₹{formatCurrency(log.bid_amount)}</span>
                                </span>
                              )}
                              {log.action === 'bid' && (
                                <span>
                                  <span className="font-medium" style={{ color: log.team_owners?.color }}>
                                    {log.team_owners?.name}
                                  </span> bid <span className="font-semibold text-primary">₹{formatCurrency(log.bid_amount)}</span>
                                </span>
                              )}
                              {log.action === 'unsold' && (
                                <span>Player went unsold</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                            <div>{formattedTime}</div>
                            <div>{formattedDate}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </Card>
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

      {/* Reset Auction Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-destructive" />
              Reset Auction?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all auction data:
              <ul className="list-disc list-inside mt-3 space-y-1.5 text-sm">
                <li>All players will be marked as unsold</li>
                <li>Team budgets restored to ₹{formatCurrency(initialBudget)}</li>
                <li>Auction history will be marked as revoked</li>
              </ul>
              <p className="mt-4 font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAuction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Reset Auction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auction;
