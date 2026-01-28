import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useTournament } from '@/hooks/useTournaments';
import { useTeamOwners } from '@/hooks/useTeamOwners';
import { useRealTeams } from '@/hooks/useRealTeams';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Filter, X, Edit, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
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
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(tournamentId);
  const { players, isLoading: playersLoading, updatePlayer } = usePlayers(tournamentId);
  const { teamOwners } = useTeamOwners(tournamentId);
  const { realTeams } = useRealTeams(tournamentId);
  const { categories } = useCategories(tournamentId);

  // Filters
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [realTeamFilter, setRealTeamFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPoints, setMinPoints] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  // Editing state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editOwnerId, setEditOwnerId] = useState<string | null>(null);
  const [editAuctionPrice, setEditAuctionPrice] = useState<string>("");

  // Get unique roles from players
  const uniqueRoles = useMemo(() => {
    const roles = new Set(players.map(p => p.role?.toLowerCase()).filter(Boolean));
    return Array.from(roles);
  }, [players]);

  // Calculate max base price for slider
  const maxBasePrice = useMemo(() => {
    return Math.max(...players.map(p => p.base_price || 0), 0);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOwner = ownerFilter === "all" || 
        (ownerFilter === "unsold" ? !player.owner_id : player.owner_id === ownerFilter);
      const matchesRealTeam = realTeamFilter === "all" || player.real_team_id === realTeamFilter;
      const matchesRole = roleFilter === "all" || player.role?.toLowerCase() === roleFilter;
      const matchesCategory = categoryFilter === "all" || player.category === categoryFilter;
      const matchesPoints = (player.total_points || 0) >= minPoints;
      const matchesPrice = maxPrice === null || (player.base_price || 0) <= maxPrice;
      return matchesSearch && matchesOwner && matchesRealTeam && matchesRole && matchesCategory && matchesPoints && matchesPrice;
    });
  }, [players, searchTerm, ownerFilter, realTeamFilter, roleFilter, categoryFilter, minPoints, maxPrice]);

  // Sort players by total points
  const sortedPlayers = [...filteredPlayers].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

  const handleStartEdit = (player: any) => {
    setEditingPlayerId(player.id);
    setEditOwnerId(player.owner_id || null);
    setEditAuctionPrice(player.auction_price?.toString() || "");
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditOwnerId(null);
    setEditAuctionPrice("");
  };

  const handleSaveEdit = (playerId: string, currentOwnerId: string | null) => {
    const newOwnerId = editOwnerId === "unsold" ? null : editOwnerId;
    const newAuctionPrice = editAuctionPrice ? parseFloat(editAuctionPrice) : null;

    // If owner is changing, we need to update budgets
    if (newOwnerId !== currentOwnerId) {
      updatePlayer({
        id: playerId,
        updates: {
          owner_id: newOwnerId,
          auction_price: newAuctionPrice,
        },
      });
    } else {
      updatePlayer({
        id: playerId,
        updates: {
          auction_price: newAuctionPrice,
        },
      });
    }

    toast({
      title: "Success",
      description: "Player updated successfully",
    });

    handleCancelEdit();
  };

  const clearFilters = () => {
    setOwnerFilter("all");
    setRealTeamFilter("all");
    setRoleFilter("all");
    setCategoryFilter("all");
    setSearchTerm("");
    setMinPoints(0);
    setMaxPrice(null);
  };

  const hasActiveFilters = ownerFilter !== "all" || realTeamFilter !== "all" || roleFilter !== "all" || categoryFilter !== "all" || searchTerm !== "" || minPoints > 0 || maxPrice !== null;

  if (tournamentLoading || playersLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-8">Tournament not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
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

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Input
                placeholder="Search player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={realTeamFilter} onValueChange={setRealTeamFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Real Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Real Teams</SelectItem>
                  {realTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.short_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="unsold">Unsold Only</SelectItem>
                  {teamOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Advanced filters row */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Min Points:</span>
                <Input
                  type="number"
                  value={minPoints}
                  onChange={(e) => setMinPoints(parseInt(e.target.value) || 0)}
                  className="w-20"
                  min={0}
                />
              </div>

              {maxBasePrice > 0 && (
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Max Price:</span>
                  <Slider
                    value={[maxPrice ?? maxBasePrice]}
                    onValueChange={(val) => setMaxPrice(val[0] === maxBasePrice ? null : val[0])}
                    max={maxBasePrice}
                    step={1000}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-24">
                    {maxPrice !== null ? `₹${maxPrice.toLocaleString()}` : 'Any'}
                  </span>
                </div>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                Showing {sortedPlayers.length} of {players.length} players
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Player Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Real Team</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Sold Price</TableHead>
                <TableHead className="text-right">
                  <Trophy className="h-4 w-4 inline mr-1" />
                  Points
                </TableHead>
                {isAdmin && <TableHead className="w-20">Actions</TableHead>}
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
                  <TableCell>{player.category || 'N/A'}</TableCell>
                  <TableCell>{player.real_teams?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {editingPlayerId === player.id ? (
                      <Select 
                        value={editOwnerId || "unsold"} 
                        onValueChange={(value) => setEditOwnerId(value === "unsold" ? null : value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unsold">Unsold</SelectItem>
                          {teamOwners.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.short_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : player.team_owners ? (
                      <Badge style={{ backgroundColor: player.team_owners.color }}>
                        {player.team_owners.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Unsold</span>
                    )}
                  </TableCell>
                  <TableCell>₹{player.base_price?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    {editingPlayerId === player.id ? (
                      <Input
                        type="number"
                        value={editAuctionPrice}
                        onChange={(e) => setEditAuctionPrice(e.target.value)}
                        placeholder="0"
                        className="w-24"
                      />
                    ) : player.auction_price ? (
                      <span className="text-primary font-medium">₹{player.auction_price.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {player.total_points || 0}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {editingPlayerId === player.id ? (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleSaveEdit(player.id, player.owner_id)}
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleStartEdit(player)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {sortedPlayers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? "No players match your filters" : "No players found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Players;
