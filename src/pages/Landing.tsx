import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Plus, List, Users, TrendingUp } from "lucide-react";
import MigrationPrompt from "@/components/MigrationPrompt";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <>
      <MigrationPrompt />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Trophy className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Fantasy Tournament Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create and manage your fantasy sports tournaments with ease. 
              Track players, teams, and points all in one place.
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Add Tournament Card */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer group">
              <CardHeader>
                <div className="mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create New Tournament</CardTitle>
                <CardDescription className="text-base">
                  Set up a fresh tournament with custom rules, teams, and players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Configure team owners and budgets
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Import player database with prices
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Set up matches and scoring rules
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate("/tournaments/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              </CardContent>
            </Card>

            {/* View Tournaments Card */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary cursor-pointer group">
              <CardHeader>
                <div className="mb-4 p-4 bg-secondary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <List className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl">View Tournaments</CardTitle>
                <CardDescription className="text-base">
                  Browse and manage your existing fantasy tournaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    View live leaderboards and rankings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Track player performance and points
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Update match results and scores
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/tournaments")}
                >
                  <List className="h-4 w-4 mr-2" />
                  Browse Tournaments
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Highlights */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
              Why Choose Our Platform?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Team Management</h3>
                <p className="text-sm text-muted-foreground">
                  Easily manage multiple team owners and their squads
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mb-4 p-3 bg-secondary/10 rounded-full w-fit mx-auto">
                  <TrendingUp className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Live Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time point updates and leaderboard changes
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mb-4 p-3 bg-accent/10 rounded-full w-fit mx-auto">
                  <Trophy className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Complete Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed stats and performance insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landing;
