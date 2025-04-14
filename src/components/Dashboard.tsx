
import { useState, useEffect } from "react";
import { getInitializedData } from "../data/sampleData";
import { TeamOwner, Player } from "../types";
import TeamCard from "./TeamCard";
import TeamSquadModal from "./TeamSquadModal";

const Dashboard = () => {
  const [teams, setTeams] = useState<TeamOwner[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamOwner | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);

  useEffect(() => {
    const { owners, players } = getInitializedData();
    setTeams(owners);
    setPlayers(players);
  }, []);

  // Sort teams by total points (descending)
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  const handleTeamClick = (team: TeamOwner) => {
    setSelectedTeam(team);
    setShowSquadModal(true);
  };

  const getTeamPlayers = (ownerId: string) => {
    return players.filter(player => player.owner === ownerId);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ipl-dark">Fantasy Leaderboard</h1>
        <p className="text-gray-500">Track points and rankings for all team owners</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTeams.map((team, index) => (
          <div key={team.id} onClick={() => handleTeamClick(team)} className="cursor-pointer">
            <TeamCard team={team} rank={index + 1} />
          </div>
        ))}
      </div>

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
  );
};

export default Dashboard;
