
import { useState, useEffect } from "react";
import { Match, Player, PointsCategory } from "../types";
import { getInitializedData } from "../data/sampleData";
import { pointsCategories, sampleMatches } from "../data/sampleData";
import { toast } from "sonner";
import { Search, Plus, Minus, Save } from "lucide-react";

const PointsUpdateForm = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>(sampleMatches);
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [playerPoints, setPlayerPoints] = useState<Record<string, Record<string, number>>>({});
  
  useEffect(() => {
    const { players } = getInitializedData();
    setPlayers(players);
    
    // Initialize player points
    const initialPoints: Record<string, Record<string, number>> = {};
    players.forEach(player => {
      initialPoints[player.id] = {};
      pointsCategories.forEach(category => {
        initialPoints[player.id][category.id] = 0;
      });
    });
    setPlayerPoints(initialPoints);
  }, []);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePointChange = (playerId: string, categoryId: string, increment: boolean) => {
    setPlayerPoints(prev => {
      const currentValue = prev[playerId]?.[categoryId] || 0;
      const newPoints = { ...prev };
      
      // Don't allow negative values for most categories
      if (!increment && currentValue === 0) {
        return prev;
      }
      
      newPoints[playerId] = {
        ...newPoints[playerId],
        [categoryId]: increment ? currentValue + 1 : currentValue - 1
      };
      
      return newPoints;
    });
  };

  const calculateTotalPoints = (playerId: string) => {
    if (!playerPoints[playerId]) return 0;
    
    return pointsCategories.reduce((total, category) => {
      const count = playerPoints[playerId][category.id] || 0;
      return total + (count * category.pointsValue);
    }, 0);
  };

  const handleSavePoints = () => {
    if (!selectedMatch) {
      toast.error("Please select a match first!");
      return;
    }
    
    // Here you would typically save to a database
    // For now, we'll just show a success message
    toast.success("Points saved successfully!");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ipl-dark">Update Points</h1>
        <p className="text-gray-500">Add or update player points after matches</p>
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
                  Match {match.matchNumber}: {match.team1} vs {match.team2}
                </option>
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
                  {pointsCategories.map(category => (
                    <th key={category.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {category.name}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
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
                          <div className="text-xs text-gray-500">{player.iplTeam} | {player.role}</div>
                        </div>
                      </div>
                    </td>
                    
                    {pointsCategories.map(category => (
                      <td key={`${player.id}-${category.id}`} className="px-2 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                            onClick={() => handlePointChange(player.id, category.id, false)}
                          >
                            <Minus className="h-3 w-3 text-gray-500" />
                          </button>
                          
                          <span className="text-sm w-6 text-center">
                            {playerPoints[player.id]?.[category.id] || 0}
                          </span>
                          
                          <button
                            className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                            onClick={() => handlePointChange(player.id, category.id, true)}
                          >
                            <Plus className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    ))}
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {calculateTotalPoints(player.id)}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {filteredPlayers.length === 0 && (
                  <tr>
                    <td colSpan={pointsCategories.length + 2} className="px-6 py-4 text-center text-gray-500">
                      No players found. Try a different search term.
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
