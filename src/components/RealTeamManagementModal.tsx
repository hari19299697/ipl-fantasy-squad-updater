import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealTeams } from "@/hooks/useRealTeams";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Upload, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

interface RealTeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

const RealTeamManagementModal = ({ isOpen, onClose, tournamentId }: RealTeamManagementModalProps) => {
  const { realTeams, bulkCreateRealTeams } = useRealTeams(tournamentId);
  const { toast } = useToast();
  const [newTeam, setNewTeam] = useState({ name: "", short_name: "" });

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.short_name) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    bulkCreateRealTeams([{
      tournament_id: tournamentId,
      name: newTeam.name,
      short_name: newTeam.short_name,
    }]);

    setNewTeam({ name: "", short_name: "" });
  };

  const handleExport = () => {
    const exportData = realTeams.map((team) => ({
      Name: team.name,
      ShortName: team.short_name,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RealTeams");
    XLSX.writeFile(wb, `real_teams_${tournamentId}.xlsx`);
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

        const teamsToImport = jsonData.map((row) => ({
          tournament_id: tournamentId,
          name: row.Name || row.name,
          short_name: row.ShortName || row.short_name || row.shortname,
        }));

        bulkCreateRealTeams(teamsToImport);
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
          <DialogTitle>Manage Real Teams</DialogTitle>
          <DialogDescription>Add or import real cricket teams for this tournament</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Team */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Real Team
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Team Name *</Label>
                <Input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Mumbai Indians"
                />
              </div>
              <div>
                <Label>Short Name *</Label>
                <Input
                  value={newTeam.short_name}
                  onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value })}
                  placeholder="MI"
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {realTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.short_name}</TableCell>
                  </TableRow>
                ))}
                {realTeams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      No real teams added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RealTeamManagementModal;
