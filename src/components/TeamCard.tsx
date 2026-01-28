
import type { Database } from "@/integrations/supabase/types";
import { Trophy, Users, Wallet } from "lucide-react";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];

interface TeamCardProps {
  team: TeamOwner;
  rank: number;
  playerCount?: number;
  maxPlayers?: number;
}

const TeamCard = ({ team, rank, playerCount = 0, maxPlayers }: TeamCardProps) => {
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden border transition-all hover:shadow-lg">
      <div 
        className="h-2" 
        style={{ backgroundColor: team.color }} 
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground">{team.name}</h3>
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
        
        <div className="grid grid-cols-1 gap-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Points</span>
            </div>
            <span className="text-lg font-semibold text-foreground">{team.total_points}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Players</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {playerCount}{maxPlayers ? ` / ${maxPlayers}` : ''}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Wallet</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              ₹{team.budget_remaining?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
