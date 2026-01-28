import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament, useTournaments } from "@/hooks/useTournaments";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamOwners } from "@/hooks/useTeamOwners";
import { useMatches } from "@/hooks/useMatches";
import { useAuctionRules } from "@/hooks/useAuctionRules";
import { useTournamentAuctionRules } from "@/hooks/useTournamentAuctionRules";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Calendar, Loader2, Edit, Gavel, Settings, Trash2, Check, FileText, Eye, Copy } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import TeamCard from "@/components/TeamCard";
import TeamSquadModal from "@/components/TeamSquadModal";
import TeamManagementModal from "@/components/TeamManagementModal";
import PlayerManagementModal from "@/components/PlayerManagementModal";
import RealTeamManagementModal from "@/components/RealTeamManagementModal";
import CategoryManagementModal from "@/components/CategoryManagementModal";
import MatchManagementModal from "@/components/MatchManagementModal";
import CloneTournamentModal from "@/components/CloneTournamentModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: tournament, isLoading: loadingTournament } = useTournament(id);
  const { deleteTournament, isDeleting } = useTournaments();
  const { players, isLoading: loadingPlayers } = usePlayers(id);
  const { teamOwners, isLoading: loadingOwners } = useTeamOwners(id);
  const { matches, isLoading: loadingMatches } = useMatches(id);
  const { auctionRules } = useAuctionRules();
  const { tournamentAuctionRule, applyTemplate, removeTemplate, isApplying } = useTournamentAuctionRules(id);
  
  const [selectedTeam, setSelectedTeam] = useState<TeamOwner | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showRealTeamManagement, setShowRealTeamManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showMatchManagement, setShowMatchManagement] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAuctionRuleDialog, setShowAuctionRuleDialog] = useState(false);
  const [selectedAuctionRuleId, setSelectedAuctionRuleId] = useState<string>("");

  const handleDeleteTournament = () => {
    if (id) {
      deleteTournament(id, {
        onSuccess: () => {
          navigate("/tournaments");
        },
      });
    }
  };

  const handleApplyAuctionTemplate = () => {
    if (id && selectedAuctionRuleId) {
      applyTemplate({ tournamentId: id, auctionRuleId: selectedAuctionRuleId });
      setShowAuctionRuleDialog(false);
      setSelectedAuctionRuleId("");
    }
  };

  const appliedAuctionRule = tournamentAuctionRule?.auction_rules;

  const isLoading = loadingTournament || loadingPlayers || loadingOwners || loadingMatches;

  const sortedTeams = [...teamOwners].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  
  const getTeamPlayers = (ownerId: string) => {
    return players.filter(player => player.owner_id === ownerId);
  };

  const handleTeamClick = (team: TeamOwner) => {
    setSelectedTeam(team);
    setShowSquadModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted text-muted-foreground";
      case "auction": return "bg-secondary text-secondary-foreground";
      case "active": return "bg-primary text-primary-foreground";
      case "completed": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <p>Tournament not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/tournaments")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>

        {/* Tournament Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl break-words">{tournament.name}</CardTitle>
                  <Badge className={getStatusColor(tournament.status)}>
                    {tournament.status}
                  </Badge>
                </div>
                <CardDescription className="text-sm sm:text-base capitalize">
                  {tournament.type} Tournament
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                {isAdmin && (
                  <Button
                    onClick={() => navigate(`/auction/${tournament.id}`)}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    <Gavel className="h-4 w-4 mr-2" />
                    Start Auction
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    onClick={() => navigate(`/update-points/${tournament.id}`)}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Points
                  </Button>
                )}
                <Button
                  onClick={() => navigate(`/players/${tournament.id}`)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isAdmin ? <Users className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {isAdmin ? "All Players" : "View Players"}
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => setShowCloneModal(true)}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Clone
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Tournament
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(new Date(tournament.start_date), "MMM dd, yyyy")} - 
                  {format(new Date(tournament.end_date), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {teamOwners.length} Teams
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {players.length} Players
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} h-auto`}>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2">Leaderboard</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs sm:text-sm py-2">Teams</TabsTrigger>
            <TabsTrigger value="players" className="text-xs sm:text-sm py-2">Players</TabsTrigger>
            <TabsTrigger value="matches" className="text-xs sm:text-sm py-2">Matches</TabsTrigger>
            {isAdmin && <TabsTrigger value="masters" className="text-xs sm:text-sm py-2">Masters</TabsTrigger>}
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowTeamManagement(true)} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Teams
                </Button>
              </div>
            )}
            {teamOwners.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isAdmin ? "Add team owners during tournament setup to see the leaderboard" : "No teams have been added to this tournament yet"}
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setShowTeamManagement(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Add Teams
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTeams.map((team, index) => (
                  <div key={team.id} onClick={() => handleTeamClick(team)} className="cursor-pointer">
                    <TeamCard team={team} rank={index + 1} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Teams</CardTitle>
                    <CardDescription>Complete team database for this tournament</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setShowTeamManagement(true)} variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Teams
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {teamOwners.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {isAdmin ? "Add team owners during tournament setup" : "No teams available"}
                    </p>
                    {isAdmin && (
                      <Button onClick={() => setShowTeamManagement(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Add Teams
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Rank</TableHead>
                            <TableHead className="text-xs sm:text-sm">Team Name</TableHead>
                            <TableHead className="text-xs sm:text-sm">Short Name</TableHead>
                            <TableHead className="text-xs sm:text-sm hidden md:table-cell">Budget Remaining</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Total Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedTeams.map((team, index) => (
                            <TableRow 
                              key={team.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleTeamClick(team)}
                            >
                              <TableCell className="text-xs sm:text-sm">
                                <div 
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
                                  style={{ 
                                    backgroundColor: `${team.color}20`, 
                                    color: team.color 
                                  }}
                                >
                                  {index + 1}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-xs sm:text-sm">{team.name}</TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <Badge style={{ backgroundColor: team.color }}>
                                  {team.short_name}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm hidden md:table-cell">₹{team.budget_remaining.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-semibold text-xs sm:text-sm">{team.total_points || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Players</CardTitle>
                    <CardDescription>Complete player database for this tournament</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setShowPlayerManagement(true)} variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Players
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <div className="py-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Players Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {isAdmin ? "Add players during tournament setup or import them via Excel" : "No players available"}
                    </p>
                    {isAdmin && (
                      <Button onClick={() => setShowPlayerManagement(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Add Players
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead className="text-xs sm:text-sm">Player Name</TableHead>
                           <TableHead className="text-xs sm:text-sm">Role</TableHead>
                           <TableHead className="text-xs sm:text-sm hidden md:table-cell">Category</TableHead>
                           <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Real Team</TableHead>
                           <TableHead className="text-xs sm:text-sm">Owner</TableHead>
                           <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Base Price</TableHead>
                           <TableHead className="text-right text-xs sm:text-sm">Points</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {players.map((player) => (
                           <TableRow key={player.id}>
                             <TableCell className="font-medium text-xs sm:text-sm">{player.name}</TableCell>
                             <TableCell className="capitalize text-xs sm:text-sm">{player.role.replace('_', ' ')}</TableCell>
                             <TableCell className="text-xs sm:text-sm hidden md:table-cell">{player.category || 'N/A'}</TableCell>
                             <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{player.real_teams?.short_name || 'N/A'}</TableCell>
                             <TableCell className="text-xs sm:text-sm">{player.team_owners?.short_name || 'Unsold'}</TableCell>
                             <TableCell className="text-xs sm:text-sm hidden sm:table-cell">₹{(player.base_price || 0).toLocaleString()}</TableCell>
                             <TableCell className="text-right font-semibold text-xs sm:text-sm">{player.total_points || 0}</TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Matches Schedule</CardTitle>
                    <CardDescription>All matches in this tournament</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setShowMatchManagement(true)} variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Matches
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Match #</TableHead>
                          <TableHead className="text-xs sm:text-sm">Teams</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden md:table-cell">Venue</TableHead>
                          <TableHead className="text-xs sm:text-sm">Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell className="text-xs sm:text-sm">Match {match.match_number}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {match.team1?.short_name || 'TBD'} vs {match.team2?.short_name || 'TBD'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell">{match.venue}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{format(new Date(match.match_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <Badge variant={match.is_completed ? "default" : "secondary"}>
                                {match.is_completed ? "Completed" : "Upcoming"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Masters Tab */}
          <TabsContent value="masters" className="mt-6">
            <div className="space-y-6">
              {/* Auction Rules Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        Auction Rules
                      </CardTitle>
                      <CardDescription>
                        Configure auction rules for this tournament
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowAuctionRuleDialog(true)} variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      {appliedAuctionRule ? "Change Template" : "Apply Template"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {appliedAuctionRule ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        <span className="font-medium">Template Applied: {appliedAuctionRule.name}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Initial Budget</p>
                          <p className="font-medium">{appliedAuctionRule.currency} {appliedAuctionRule.initial_budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Min Bid</p>
                          <p className="font-medium">{appliedAuctionRule.currency} {appliedAuctionRule.min_bid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bid Increment</p>
                          <p className="font-medium">{appliedAuctionRule.currency} {appliedAuctionRule.increment_value.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Players per Team</p>
                          <p className="font-medium">{appliedAuctionRule.min_players_per_team || 11} - {appliedAuctionRule.max_players_per_team}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Budget Safety</p>
                          <Badge variant={appliedAuctionRule.budget_safety_enabled ? "default" : "secondary"}>
                            {appliedAuctionRule.budget_safety_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Unsold Player Rule</p>
                          <p className="font-medium capitalize">{(appliedAuctionRule.unsold_player_rule || 'skip').replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Auction Rules Applied</h3>
                      <p className="text-muted-foreground mb-4">
                        Apply an auction template to configure bidding rules for this tournament
                      </p>
                      <Button onClick={() => setShowAuctionRuleDialog(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Apply Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Real Teams</CardTitle>
                    <CardDescription>Manage actual cricket teams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowRealTeamManagement(true)} className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Real Teams
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage player categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowCategoryManagement(true)} className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Categories
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {selectedTeam && (
          <TeamSquadModal
            isOpen={showSquadModal}
            onClose={() => setShowSquadModal(false)}
            ownerId={selectedTeam.id}
            ownerName={selectedTeam.name}
            players={getTeamPlayers(selectedTeam.id)}
          />
        )}

        <TeamManagementModal
          isOpen={showTeamManagement}
          onClose={() => setShowTeamManagement(false)}
          tournamentId={id || ""}
        />

        <PlayerManagementModal
          isOpen={showPlayerManagement}
          onClose={() => setShowPlayerManagement(false)}
          tournamentId={id || ""}
        />

        <RealTeamManagementModal
          isOpen={showRealTeamManagement}
          onClose={() => setShowRealTeamManagement(false)}
          tournamentId={id || ""}
        />

        <CategoryManagementModal
          isOpen={showCategoryManagement}
          onClose={() => setShowCategoryManagement(false)}
          tournamentId={id || ""}
        />

        <MatchManagementModal
          isOpen={showMatchManagement}
          onClose={() => setShowMatchManagement(false)}
          tournamentId={id || ""}
        />

        <CloneTournamentModal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          tournamentId={id || ""}
          tournamentName={tournament.name}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{tournament.name}"? This will permanently delete all associated data including teams, players, matches, and auction logs. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTournament}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Tournament"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Auction Rule Template Dialog */}
        <Dialog open={showAuctionRuleDialog} onOpenChange={setShowAuctionRuleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Auction Template</DialogTitle>
              <DialogDescription>
                Select an auction rule template to apply to this tournament
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select
                  value={selectedAuctionRuleId}
                  onValueChange={setSelectedAuctionRuleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {auctionRules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.name} ({rule.currency} {rule.initial_budget.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAuctionRuleId && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  {(() => {
                    const selectedRule = auctionRules.find(r => r.id === selectedAuctionRuleId);
                    if (!selectedRule) return null;
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Initial Budget:</span>
                          <span className="font-medium">{selectedRule.currency} {selectedRule.initial_budget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Players per Team:</span>
                          <span className="font-medium">{selectedRule.min_players_per_team || 11} - {selectedRule.max_players_per_team}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Budget Safety:</span>
                          <span className="font-medium">{selectedRule.budget_safety_enabled ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unsold Rule:</span>
                          <span className="font-medium capitalize">{(selectedRule.unsold_player_rule || 'skip').replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <Button 
                onClick={handleApplyAuctionTemplate}
                className="w-full"
                disabled={!selectedAuctionRuleId || isApplying}
              >
                {isApplying ? "Applying..." : "Apply Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TournamentDetail;
