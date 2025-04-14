
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { TeamOwner, Player } from "../types";
import { sampleMatches } from "../data/sampleData";
import { useState } from "react";
import { toast } from "sonner";

interface ExportButtonProps {
  className?: string;
}

const ExportButton = ({ className }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Retrieve data from localStorage
      const storedOwners = localStorage.getItem('fantasyOwners');
      const storedPlayers = localStorage.getItem('fantasyPlayers');
      
      if (!storedOwners || !storedPlayers) {
        toast.error("No data found to export");
        return;
      }
      
      const owners: TeamOwner[] = JSON.parse(storedOwners);
      const players: Player[] = JSON.parse(storedPlayers);
      const matches = sampleMatches;
      
      // Create CSV content
      let csvContent = "";
      
      // Process each owner and their players
      for (const owner of owners) {
        // Add owner header
        csvContent += `${owner.name.toUpperCase()}\n`;
        
        // Get players for this owner
        const ownerPlayers = players
          .filter(player => player.owner === owner.id)
          .sort((a, b) => b.totalPoints - a.totalPoints);
        
        // Add headers for matches
        let headerRow = "Player,";
        matches.forEach(match => {
          headerRow += `Match ${match.matchNumber} (${match.team1} vs ${match.team2}),`;
        });
        headerRow += "Total Points\n";
        csvContent += headerRow;
        
        // Add player rows
        ownerPlayers.forEach((player, index) => {
          let playerRow = `${index + 1}. ${player.name},`;
          
          // Add match points
          matches.forEach(match => {
            const matchPoints = player.matchPoints[match.id] || 0;
            playerRow += `${matchPoints},`;
          });
          
          // Add total points
          playerRow += `${player.totalPoints}\n`;
          csvContent += playerRow;
        });
        
        // Add empty line between owners
        csvContent += "\n";
      }
      
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a link element to download the CSV
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `fantasy_points_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export to CSV"}
    </Button>
  );
};

export default ExportButton;
