
import { Player, TeamOwner } from "../types";

interface PlayerCardProps {
  player: Player;
  owner: TeamOwner | undefined;
}

const PlayerCard = ({ player, owner }: PlayerCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all">
      <div className="flex items-center p-3 sm:p-4">
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100">
              {player.iplTeam}
            </span>
            <span 
              className="text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: owner?.color || '#ccc' }}
            >
              {owner?.shortName || 'N/A'}
            </span>
          </div>
          <h3 className="font-semibold text-sm sm:text-base truncate">{player.name}</h3>
          <div className="flex items-center gap-2 sm:gap-4 mt-1">
            <span className="text-xs text-gray-500">{player.role}</span>
            <span className="text-xs text-gray-500">₹{player.price}Cr</span>
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="text-lg sm:text-xl font-bold">{player.totalPoints}</div>
          <div className="text-xs text-gray-500">PTS</div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
