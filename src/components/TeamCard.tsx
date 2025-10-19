
import type { Database } from "@/integrations/supabase/types";
import { Trophy, Users } from "lucide-react";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];

interface TeamCardProps {
  team: TeamOwner;
  rank: number;
}

const TeamCard = ({ team, rank }: TeamCardProps) => {
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
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-lg font-semibold text-foreground">{team.total_points}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
          
          <div className="flex items-center gap-1.5 justify-end">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Squad</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
