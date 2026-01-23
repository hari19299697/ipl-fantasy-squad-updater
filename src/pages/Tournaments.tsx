import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useTournaments } from "@/hooks/useTournaments";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Trophy, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Tournaments = () => {
  const navigate = useNavigate();
  const { tournaments, isLoading, deleteTournament } = useTournaments();
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, tournament: { id: string; name: string }) => {
    e.stopPropagation();
    setTournamentToDelete(tournament);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tournamentToDelete) {
      deleteTournament(tournamentToDelete.id, {
        onSuccess: () => {
          toast.success(`Tournament "${tournamentToDelete.name}" deleted successfully`);
          setDeleteDialogOpen(false);
          setTournamentToDelete(null);
        },
        onError: () => {
          toast.error("Failed to delete tournament");
        }
      });
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === "all") return true;
    return tournament.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted text-muted-foreground";
      case "auction": return "bg-secondary text-secondary-foreground";
      case "active": return "bg-primary text-primary-foreground";
      case "completed": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tournaments</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Manage all your fantasy tournaments" : "View all fantasy tournaments"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto">
              Back to Home
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate("/tournaments/new")} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-2 px-2">
          {["all", "draft", "auction", "active", "completed"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="shrink-0 text-xs sm:text-sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Tournaments Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTournaments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No tournaments found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all" 
                  ? isAdmin 
                    ? "Create your first tournament to get started"
                    : "No tournaments available yet"
                  : `No ${filter} tournaments available`
                }
              </p>
              {isAdmin && (
                <Button onClick={() => navigate("/tournaments/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map((tournament) => (
              <Card 
                key={tournament.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow relative group"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status}
                      </Badge>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClick(e, { id: tournament.id, name: tournament.name })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-2">{tournament.name}</CardTitle>
                  <CardDescription className="capitalize">
                    {tournament.type} Tournament
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(tournament.start_date), "MMM dd, yyyy")} - 
                        {format(new Date(tournament.end_date), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{tournamentToDelete?.name}"? 
                This action cannot be undone and will permanently delete all associated data including teams, players, and matches.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Tournament
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Tournaments;
