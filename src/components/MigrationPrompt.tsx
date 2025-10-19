import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { migrateLocalStorageToSupabase } from "@/utils/migrateLocalStorageData";
import { useTournamentContext } from "@/contexts/TournamentContext";

const MigrationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { setSelectedTournamentId } = useTournamentContext();

  useEffect(() => {
    // Check if migration is needed
    const migrationCompleted = localStorage.getItem('migrationCompleted');
    const hasLocalData = localStorage.getItem('players') || 
                         localStorage.getItem('teamOwners') || 
                         localStorage.getItem('matches');
    
    // Show prompt if migration not done and either has local data or wants to use sample data
    if (migrationCompleted !== 'true') {
      setShowPrompt(true);
    }
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationStatus("idle");
    setErrorMessage("");

    try {
      const tournamentId = await migrateLocalStorageToSupabase();
      if (tournamentId) {
        setSelectedTournamentId(tournamentId);
      }
      setMigrationStatus("success");
      setTimeout(() => {
        setShowPrompt(false);
      }, 2000);
    } catch (error) {
      console.error("Migration error:", error);
      setMigrationStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Migration failed");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('migrationCompleted', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Setup Required</CardTitle>
              <CardDescription>Initialize your fantasy tournament database</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We need to set up your tournament data in the database. This will create an "IPL 2025" 
            tournament with sample data to get you started.
          </p>

          {migrationStatus === "success" && (
            <Alert className="bg-primary/10 border-primary">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Migration completed successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || "Migration failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              disabled={isMigrating}
              className="flex-1"
            >
              Skip
            </Button>
            <Button 
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex-1"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Initialize Database"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationPrompt;
