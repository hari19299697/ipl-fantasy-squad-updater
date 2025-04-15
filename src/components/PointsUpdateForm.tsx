
import { useState, useEffect } from "react";
import { Match, Player } from "../types";
import { getInitializedData, sampleMatches } from "../data/sampleData";
import { toast } from "sonner";
import { Search, Save } from "lucide-react";
import { Input } from "./ui/input";

const PointsUpdateForm = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>(sampleMatches);
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [currentMatchTeams, setCurrentMatchTeams] = useState<string[]>([]);
  const [ownersList, setOwnersList] = useState<string[]>([]);
  
  useEffect(() => {
    const { players } = getInitializedData();
    setPlayers(players);
    
    const initialPoints: Record<string, number> = {};
    players.forEach(player => {
      initialPoints[player.id] = player.matchPoints[selectedMatch] || 0;
    });
    setPlayerPoints(initialPoints);
    
    // Extract unique owner IDs from players
    const uniqueOwners = [...new Set(players.map(player => player.owner))];
    setOwnersList(uniqueOwners);
  }, [selectedMatch]);

  useEffect(() => {
    if (selectedMatch) {
      const match = matches.find(m => m.id === selectedMatch);
      if (match) {
        setCurrentMatchTeams([match.team1, match.team2]);
      }
    } else {
      setCurrentMatchTeams([]);
    }
  }, [selectedMatch, matches]);

  const handlePointChange = (playerId: string, value: string) => {
    const pointValue = value === '' ? 0 : parseInt(value);
    if (isNaN(pointValue)) return;
    
    setPlayerPoints(prev => ({
      ...prev,
      [playerId]: pointValue
    }));
  };

  const handleSavePoints = () => {
    if (!selectedMatch) {
      toast.error("Please select a match first!");
      return;
    }
    
    const updatedPlayers = players.map(player => {
      const matchPoint = playerPoints[player.id] || 0;
      const newMatchPoints = {
        ...player.matchPoints,
        [selectedMatch]: matchPoint
      };
      
      const totalPoints = Object.values(newMatchPoints).reduce((sum, points) => sum + points, 0);
      
      return {
        ...player,
        matchPoints: newMatchPoints,
        totalPoints: totalPoints
      };
    });
    
    localStorage.setItem('fantasyPlayers', JSON.stringify(updatedPlayers));
    
    const { owners } = getInitializedData();
    const ownerPointsMap: Record<string, number> = {};
    
    updatedPlayers.forEach(player => {
      if (!ownerPointsMap[player.owner]) {
        ownerPointsMap[player.owner] = 0;
      }
      ownerPointsMap[player.owner] += player.totalPoints;
    });
    
    const updatedOwners = owners.map(owner => ({
      ...owner,
      totalPoints: ownerPointsMap[owner.id] || 0
    }));
    
    localStorage.setItem('fantasyOwners', JSON.stringify(updatedOwners));
    
    setPlayers(updatedPlayers);
    toast.success("Points saved successfully!");
    
    const currentMatchIndex = matches.findIndex(m => m.id === selectedMatch);
    if (currentMatchIndex < matches.length - 1) {
      setSelectedMatch(matches[currentMatchIndex + 1].id);
    } else {
      setSelectedMatch('');
      toast.success("All matches completed!");
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = filterOwner === "all" || player.owner === filterOwner;
    const matchesTeam = currentMatchTeams.length === 0 || currentMatchTeams.includes(player.iplTeam);
    return matchesSearch && matchesOwner && matchesTeam;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ipl-dark">Update Points</h1>
        <p className="text-gray-500">Enter player points for each match</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Match
            </label>
            <select
              className="w-full md:w-64 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ipl-blue"
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
            >
              <option value="">Select a match</option>
              {matches.map(match => (
                <option key={match.id} value={match.id}>
                  Match {match.matchNumber}: {match.team1} vs {match.team2} ({match.date})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Owner
            </label>
            <select
              className="w-full md:w-48 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ipl-blue"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
            >
              <option value="all">All Owners</option>
              {ownersList.map(ownerId => (
                <option key={ownerId} value={ownerId}>Owner {ownerId}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Players
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by player name..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ipl-blue"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            className="bg-ipl-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            onClick={handleSavePoints}
          >
            <Save className="h-4 w-4" />
            Save All Points
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {selectedMatch ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.map(player => (
                  <tr key={player.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          <div className="text-xs text-gray-500">{player.role}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Owner {player.owner}</span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {player.iplTeam}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Input
                        type="number"
                        value={playerPoints[player.id] || ""}
                        onChange={(e) => handlePointChange(player.id, e.target.value)}
                        className="w-20 text-center mx-auto"
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
                
                {filteredPlayers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No players found. Try a different search term or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Please select a match to update player points.
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsUpdateForm;
