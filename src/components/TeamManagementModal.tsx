import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeamOwners } from "@/hooks/useTeamOwners";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Upload, Trash2, Edit2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];
type TeamOwnerInsert = Database['public']['Tables']['team_owners']['Insert'];

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

const TeamManagementModal = ({ isOpen, onClose, tournamentId }: TeamManagementModalProps) => {
  const { teamOwners, createTeamOwner, updateTeamOwner, deleteTeamOwner, bulkCreateTeamOwners } = useTeamOwners(tournamentId);
  const { toast } = useToast();
  const [editingTeam, setEditingTeam] = useState<TeamOwner | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", short_name: "", budget_remaining: "", color: "#000000" });

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.short_name || !newTeam.budget_remaining) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    createTeamOwner({
      tournament_id: tournamentId,
      name: newTeam.name,
      short_name: newTeam.short_name,
      budget_remaining: parseInt(newTeam.budget_remaining),
      color: newTeam.color,
    });

    setNewTeam({ name: "", short_name: "", budget_remaining: "", color: "#000000" });
  };

  const handleUpdateTeam = () => {
    if (!editingTeam) return;
    
    updateTeamOwner({
      id: editingTeam.id,
      updates: {
        name: editingTeam.name,
        short_name: editingTeam.short_name,
        budget_remaining: editingTeam.budget_remaining,
        color: editingTeam.color,
      }
    });
    
    setEditingTeam(null);
  };

  const handleExport = () => {
    const exportData = teamOwners.map(team => ({
      Name: team.name,
      ShortName: team.short_name,
      Budget: team.budget_remaining,
      TotalPoints: team.total_points || 0,
      Color: team.color,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teams");
    XLSX.writeFile(wb, `teams_${tournamentId}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const teamsToImport: TeamOwnerInsert[] = jsonData.map(row => ({
          tournament_id: tournamentId,
          name: row.Name || row.name,
          short_name: row.ShortName || row.short_name || row.shortname,
          budget_remaining: parseInt(row.Budget || row.budget || row.budget_remaining || "0"),
          color: row.Color || row.color || "#000000",
        }));

        bulkCreateTeamOwners(teamsToImport);
      } catch (error) {
        toast({ title: "Import Error", description: "Failed to import file", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Teams</DialogTitle>
          <DialogDescription>Add, edit, or import team owners for this tournament</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Team */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Team
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Team Name</Label>
                <Input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Royal Challengers"
                />
              </div>
              <div>
                <Label>Short Name</Label>
                <Input
                  value={newTeam.short_name}
                  onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value })}
                  placeholder="RCB"
                />
              </div>
              <div>
                <Label>Budget</Label>
                <Input
                  type="number"
                  value={newTeam.budget_remaining}
                  onChange={(e) => setNewTeam({ ...newTeam, budget_remaining: e.target.value })}
                  placeholder="10000000"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newTeam.color}
                  onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAddTeam} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </div>

          {/* Import/Export */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <label>
                <Upload className="h-4 w-4 mr-2" />
                Import from Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
              </label>
            </Button>
          </div>

          {/* Teams List */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Short Name</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamOwners.map((team) => (
                  <TableRow key={team.id}>
                    {editingTeam?.id === team.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editingTeam.name}
                            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editingTeam.short_name}
                            onChange={(e) => setEditingTeam({ ...editingTeam, short_name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editingTeam.budget_remaining}
                            onChange={(e) => setEditingTeam({ ...editingTeam, budget_remaining: parseInt(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>{team.total_points || 0}</TableCell>
                        <TableCell>
                          <Input
                            type="color"
                            value={editingTeam.color}
                            onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleUpdateTeam}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTeam(null)}>Cancel</Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.short_name}</TableCell>
                        <TableCell>₹{team.budget_remaining.toLocaleString()}</TableCell>
                        <TableCell>{team.total_points || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: team.color }} />
                            {team.color}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingTeam(team)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteTeamOwner(team.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagementModal;
