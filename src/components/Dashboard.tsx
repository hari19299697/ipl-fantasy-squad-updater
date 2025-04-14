
import { useState, useEffect } from "react";
import { getInitializedData } from "../data/sampleData";
import { TeamOwner } from "../types";
import TeamCard from "./TeamCard";

const Dashboard = () => {
  const [teams, setTeams] = useState<TeamOwner[]>([]);

  useEffect(() => {
    const { owners } = getInitializedData();
    setTeams(owners);
  }, []);

  // Sort teams by total points (descending)
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ipl-dark">Fantasy Leaderboard</h1>
        <p className="text-gray-500">Track points and rankings for all team owners</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTeams.map((team, index) => (
          <TeamCard key={team.id} team={team} rank={index + 1} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
