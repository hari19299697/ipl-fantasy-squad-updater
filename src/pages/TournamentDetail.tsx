import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament, useTournaments } from "@/hooks/useTournaments";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamOwners } from "@/hooks/useTeamOwners";
import { useMatches } from "@/hooks/useMatches";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Calendar, Loader2, Edit, Gavel, Settings, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TeamCard from "@/components/TeamCard";
import TeamSquadModal from "@/components/TeamSquadModal";
import TeamManagementModal from "@/components/TeamManagementModal";
import PlayerManagementModal from "@/components/PlayerManagementModal";
import RealTeamManagementModal from "@/components/RealTeamManagementModal";
import CategoryManagementModal from "@/components/CategoryManagementModal";
import MatchManagementModal from "@/components/MatchManagementModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tournament, isLoading: loadingTournament } = useTournament(id);
  const { deleteTournament, isDeleting } = useTournaments();
  const { players, isLoading: loadingPlayers } = usePlayers(id);
  const { teamOwners, isLoading: loadingOwners } = useTeamOwners(id);
  const { matches, isLoading: loadingMatches } = useMatches(id);
  
  const [selectedTeam, setSelectedTeam] = useState<TeamOwner | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showRealTeamManagement, setShowRealTeamManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showMatchManagement, setShowMatchManagement] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteTournament = () => {
    if (id) {
      deleteTournament(id, {
        onSuccess: () => {
          navigate("/tournaments");
        },
      });
    }
  };

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
                <Button
                  onClick={() => navigate(`/auction/${tournament.id}`)}
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  <Gavel className="h-4 w-4 mr-2" />
                  Start Auction
                </Button>
                <Button
                  onClick={() => navigate(`/update-points/${tournament.id}`)}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Points
                </Button>
                <Button
                  onClick={() => navigate(`/players/${tournament.id}`)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Players
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tournament
                </Button>
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
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2">Leaderboard</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs sm:text-sm py-2">Teams</TabsTrigger>
            <TabsTrigger value="players" className="text-xs sm:text-sm py-2">Players</TabsTrigger>
            <TabsTrigger value="matches" className="text-xs sm:text-sm py-2">Matches</TabsTrigger>
            <TabsTrigger value="masters" className="text-xs sm:text-sm py-2">Masters</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowTeamManagement(true)} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage Teams
              </Button>
            </div>
            {teamOwners.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add team owners during tournament setup to see the leaderboard
                  </p>
                  <Button onClick={() => setShowTeamManagement(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Add Teams
                  </Button>
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
                  <Button onClick={() => setShowTeamManagement(true)} variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Teams
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {teamOwners.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add team owners during tournament setup
                    </p>
                    <Button onClick={() => setShowTeamManagement(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Add Teams
                    </Button>
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
                  <Button onClick={() => setShowPlayerManagement(true)} variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Players
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <div className="py-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Players Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add players during tournament setup or import them via Excel
                    </p>
                    <Button onClick={() => setShowPlayerManagement(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Add Players
                    </Button>
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
                  <Button onClick={() => setShowMatchManagement(true)} variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Matches
                  </Button>
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
      </div>
    </div>
  );
};

export default TournamentDetail;
