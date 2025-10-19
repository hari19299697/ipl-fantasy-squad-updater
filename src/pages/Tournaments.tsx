import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useTournaments } from "@/hooks/useTournaments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Trophy, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";

const Tournaments = () => {
  const navigate = useNavigate();
  const { tournaments, isLoading } = useTournaments();
  const [filter, setFilter] = useState<string>("all");

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
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tournaments</h1>
            <p className="text-muted-foreground">Manage all your fantasy tournaments</p>
          </div>
          <Button onClick={() => navigate("/tournaments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "draft", "auction", "active", "completed"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
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
                  ? "Create your first tournament to get started"
                  : `No ${filter} tournaments available`
                }
              </p>
              <Button onClick={() => navigate("/tournaments/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map((tournament) => (
              <Card 
                key={tournament.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Trophy className="h-8 w-8 text-primary" />
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
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
      </div>
    </div>
  );
};

export default Tournaments;
