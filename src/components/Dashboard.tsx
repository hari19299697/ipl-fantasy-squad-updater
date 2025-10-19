
import { useState } from "react";
import { useTournamentContext } from "@/contexts/TournamentContext";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamOwners } from "@/hooks/useTeamOwners";
import TeamCard from "./TeamCard";
import TeamSquadModal from "./TeamSquadModal";
import ExportButton from "./ExportButton";
import MigrationPrompt from "./MigrationPrompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];

const Dashboard = () => {
  const { selectedTournamentId } = useTournamentContext();
  const { teamOwners, isLoading: loadingOwners } = useTeamOwners(selectedTournamentId || undefined);
  const { players, isLoading: loadingPlayers } = usePlayers(selectedTournamentId || undefined);
  const [selectedTeam, setSelectedTeam] = useState<TeamOwner | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);

  // Sort teams by total points (descending)
  const sortedTeams = [...teamOwners].sort((a, b) => b.total_points - a.total_points);

  const handleTeamClick = (team: TeamOwner) => {
    setSelectedTeam(team);
    setShowSquadModal(true);
  };

  const getTeamPlayers = (ownerId: string) => {
    return players.filter(player => player.owner_id === ownerId);
  };

  const isLoading = loadingOwners || loadingPlayers;

  return (
    <>
      <MigrationPrompt />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fantasy Leaderboard</h1>
            <p className="text-muted-foreground">Track points and rankings for all team owners</p>
          </div>
          <ExportButton className="ml-auto" />
        </div>

        {!selectedTournamentId ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a tournament from the dropdown above to view the leaderboard.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedTeams.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No team owners found for this tournament. Please add team owners to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTeams.map((team, index) => (
              <div key={team.id} onClick={() => handleTeamClick(team)} className="cursor-pointer">
                <TeamCard team={team} rank={index + 1} />
              </div>
            ))}
          </div>
        )}

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
    </>
  );
};

export default Dashboard;
