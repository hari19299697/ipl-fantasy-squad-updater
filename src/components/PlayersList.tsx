
import { useState, useEffect } from "react";
import { Player, TeamOwner } from "../types";
import PlayerCard from "./PlayerCard";
import { getInitializedData } from "../data/sampleData";
import { Search } from "lucide-react";

const PlayersList = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  
  useEffect(() => {
    const { players, owners } = getInitializedData();
    setPlayers(players);
    setOwners(owners);
  }, []);

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = selectedOwner === "all" || player.owner === selectedOwner;
    return matchesSearch && matchesOwner;
  });

  const getPlayerOwner = (ownerId: string) => {
    return owners.find(owner => owner.id === ownerId);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ipl-dark">Players</h1>
        <p className="text-gray-500">View and filter all players in your fantasy league</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ipl-blue"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="w-full md:w-48 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ipl-blue"
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
            >
              <option value="all">All Owners</option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.id}>{owner.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map(player => (
          <PlayerCard 
            key={player.id} 
            player={player} 
            owner={getPlayerOwner(player.owner)} 
          />
        ))}
        
        {filteredPlayers.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No players found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayersList;
