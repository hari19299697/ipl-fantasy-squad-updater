
import { Player, TeamOwner } from "../types";

interface PlayerCardProps {
  player: Player;
  owner: TeamOwner | undefined;
}

const PlayerCard = ({ player, owner }: PlayerCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all">
      <div className="flex items-center p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100">
              {player.iplTeam}
            </span>
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: owner?.color || '#ccc' }}
            >
              {owner?.shortName || 'N/A'}
            </span>
          </div>
          <h3 className="font-semibold">{player.name}</h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-500">{player.role}</span>
            <span className="text-xs text-gray-500">₹{player.price}Cr</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{player.totalPoints}</div>
          <div className="text-xs text-gray-500">POINTS</div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
