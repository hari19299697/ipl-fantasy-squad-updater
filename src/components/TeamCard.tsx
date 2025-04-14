
import { TeamOwner } from "../types";
import { Trophy, Users } from "lucide-react";

interface TeamCardProps {
  team: TeamOwner;
  rank: number;
}

const TeamCard = ({ team, rank }: TeamCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border transition-all hover:shadow-lg">
      <div 
        className="h-2" 
        style={{ backgroundColor: team.color }} 
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">{team.name}</h3>
          <span 
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${team.color}20`, 
              color: team.color 
            }}
          >
            {rank}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-ipl-gold" />
            <span className="text-lg font-semibold">{team.totalPoints}</span>
            <span className="text-xs text-gray-500">pts</span>
          </div>
          
          <div className="flex items-center gap-1.5 justify-end">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">{team.totalPlayers} players</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
