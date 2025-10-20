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
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <Trophy className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Fantasy Tournament Manager
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Create and manage your fantasy sports tournaments with ease. 
              Track players, teams, and points all in one place.
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
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
          <div className="mt-12 sm:mt-16 md:mt-20 max-w-4xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10 text-foreground">
              Why Choose Our Platform?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center p-4 sm:p-6">
                <div className="mb-3 sm:mb-4 p-3 bg-primary/10 rounded-full w-fit mx-auto">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground text-sm sm:text-base">Team Management</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Easily manage multiple team owners and their squads
                </p>
              </div>
              <div className="text-center p-4 sm:p-6">
                <div className="mb-3 sm:mb-4 p-3 bg-secondary/10 rounded-full w-fit mx-auto">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground text-sm sm:text-base">Live Tracking</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Real-time point updates and leaderboard changes
                </p>
              </div>
              <div className="text-center p-4 sm:p-6">
                <div className="mb-3 sm:mb-4 p-3 bg-accent/10 rounded-full w-fit mx-auto">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground text-sm sm:text-base">Complete Analytics</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
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
