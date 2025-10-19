import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament } from "@/hooks/useTournaments";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamOwners } from "@/hooks/useTeamOwners";
import { useMatches } from "@/hooks/useMatches";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Calendar, Loader2, Edit, Gavel } from "lucide-react";
import { format } from "date-fns";
import TeamCard from "@/components/TeamCard";
import TeamSquadModal from "@/components/TeamSquadModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tournament, isLoading: loadingTournament } = useTournament(id);
  const { players, isLoading: loadingPlayers } = usePlayers(id);
  const { teamOwners, isLoading: loadingOwners } = useTeamOwners(id);
  const { matches, isLoading: loadingMatches } = useMatches(id);
  
  const [selectedTeam, setSelectedTeam] = useState<TeamOwner | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);

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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-8 w-8 text-primary" />
                  <CardTitle className="text-3xl">{tournament.name}</CardTitle>
                  <Badge className={getStatusColor(tournament.status)}>
                    {tournament.status}
                  </Badge>
                </div>
                <CardDescription className="text-base capitalize">
                  {tournament.type} Tournament
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => navigate(`/auction/${tournament.id}`)}
                  variant="default"
                >
                  <Gavel className="h-4 w-4 mr-2" />
                  Start Auction
                </Button>
                <Button
                  onClick={() => navigate(`/update-points/${tournament.id}`)}
                  variant="secondary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Points
                </Button>
                <Button
                  onClick={() => navigate(`/players/${tournament.id}`)}
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Players
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="players">All Players</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            {teamOwners.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add team owners during tournament setup to see the leaderboard
                  </p>
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

          {/* Players Tab */}
          <TabsContent value="players" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Players</CardTitle>
                <CardDescription>Complete player database for this tournament</CardDescription>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <div className="py-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Players Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add players during tournament setup or import them via Excel
                    </p>
                  </div>
                ) : (
                  <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Player Name</TableHead>
                       <TableHead>Role</TableHead>
                       <TableHead>Category</TableHead>
                       <TableHead>Real Team</TableHead>
                       <TableHead>Owner</TableHead>
                       <TableHead>Base Price</TableHead>
                       <TableHead className="text-right">Total Points</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {players.map((player) => (
                       <TableRow key={player.id}>
                         <TableCell className="font-medium">{player.name}</TableCell>
                         <TableCell className="capitalize">{player.role.replace('_', ' ')}</TableCell>
                         <TableCell>{player.category || 'N/A'}</TableCell>
                         <TableCell>{player.real_teams?.short_name || 'N/A'}</TableCell>
                         <TableCell>{player.team_owners?.short_name || 'Unsold'}</TableCell>
                         <TableCell>₹{(player.base_price || 0).toLocaleString()}</TableCell>
                         <TableCell className="text-right font-semibold">{player.total_points || 0}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Matches Schedule</CardTitle>
                <CardDescription>All matches in this tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match #</TableHead>
                      <TableHead>Teams</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>Match {match.match_number}</TableCell>
                        <TableCell>
                          {match.team1?.short_name || 'TBD'} vs {match.team2?.short_name || 'TBD'}
                        </TableCell>
                        <TableCell>{match.venue}</TableCell>
                        <TableCell>{format(new Date(match.match_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={match.is_completed ? "default" : "secondary"}>
                            {match.is_completed ? "Completed" : "Upcoming"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );
};

export default TournamentDetail;
