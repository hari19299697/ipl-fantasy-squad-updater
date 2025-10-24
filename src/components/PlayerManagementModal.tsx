import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlayers } from "@/hooks/usePlayers";
import { useRealTeams } from "@/hooks/useRealTeams";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Download, Upload, Trash2, Edit2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Player = Database['public']['Tables']['players']['Row'] & {
  real_teams?: { short_name: string } | null;
  team_owners?: { short_name: string } | null;
};

interface PlayerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

const ROLES = ["batsman", "bowler", "all_rounder", "wicket_keeper"];

const PlayerManagementModal = ({ isOpen, onClose, tournamentId }: PlayerManagementModalProps) => {
  const { players, createPlayer, updatePlayer, deletePlayer, bulkCreatePlayers } = usePlayers(tournamentId);
  const { realTeams } = useRealTeams(tournamentId);
  const { toast } = useToast();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    role: "",
    category: "",
    real_team_id: "",
    base_price: "",
  });

  const handleAddPlayer = () => {
    if (!newPlayer.name || !newPlayer.role || !newPlayer.real_team_id) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    createPlayer({
      tournament_id: tournamentId,
      name: newPlayer.name,
      role: newPlayer.role,
      category: newPlayer.category || null,
      real_team_id: newPlayer.real_team_id,
      base_price: parseInt(newPlayer.base_price) || 0,
    });

    setNewPlayer({ name: "", role: "", category: "", real_team_id: "", base_price: "" });
  };

  const handleUpdatePlayer = () => {
    if (!editingPlayer) return;

    updatePlayer({
      id: editingPlayer.id,
      updates: {
        name: editingPlayer.name,
        role: editingPlayer.role,
        category: editingPlayer.category,
        real_team_id: editingPlayer.real_team_id,
        base_price: editingPlayer.base_price,
      },
    });

    setEditingPlayer(null);
  };

  const handleExport = () => {
    const exportData = players.map((player) => ({
      Name: player.name,
      Role: player.role,
      Category: player.category || "",
      RealTeam: player.real_teams?.short_name || "",
      Owner: player.team_owners?.short_name || "Unsold",
      BasePrice: player.base_price || 0,
      AuctionPrice: player.auction_price || 0,
      TotalPoints: player.total_points || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Players");
    XLSX.writeFile(wb, `players_${tournamentId}.xlsx`);
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

        const playersToImport = jsonData.map((row) => {
          const realTeamName = row.RealTeam || row.real_team || row.team;
          const realTeam = realTeams.find(
            (t) => t.short_name === realTeamName || t.name === realTeamName
          );

          return {
            tournament_id: tournamentId,
            name: row.Name || row.name,
            role: (row.Role || row.role || "batsman").toLowerCase().replace(" ", "_"),
            category: row.Category || row.category || null,
            real_team_id: realTeam?.id || realTeams[0]?.id,
            base_price: parseInt(row.BasePrice || row.base_price || row.baseprice || "0"),
          };
        });

        bulkCreatePlayers(playersToImport);
      } catch (error) {
        toast({ title: "Import Error", description: "Failed to import file", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `All ${players.length} players have been deleted`,
      });
      setDeleteAllDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Players</DialogTitle>
          <DialogDescription>Add, edit, or import players for this tournament</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Player */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Player
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Player Name *</Label>
                <Input
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="Virat Kohli"
                />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={newPlayer.role} onValueChange={(value) => setNewPlayer({ ...newPlayer, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={newPlayer.category}
                  onChange={(e) => setNewPlayer({ ...newPlayer, category: e.target.value })}
                  placeholder="A, B, C, etc."
                />
              </div>
              <div>
                <Label>Real Team *</Label>
                <Select value={newPlayer.real_team_id} onValueChange={(value) => setNewPlayer({ ...newPlayer, real_team_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {realTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.short_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Base Price</Label>
                <Input
                  type="number"
                  value={newPlayer.base_price}
                  onChange={(e) => setNewPlayer({ ...newPlayer, base_price: e.target.value })}
                  placeholder="50000"
                />
              </div>
            </div>
            <Button onClick={handleAddPlayer} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </div>

          {/* Import/Export/Delete All */}
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
            <Button 
              variant="destructive" 
              onClick={() => setDeleteAllDialogOpen(true)}
              disabled={players.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>

          {/* Players List */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Real Team</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    {editingPlayer?.id === player.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editingPlayer.name}
                            onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={editingPlayer.role}
                            onValueChange={(value) => setEditingPlayer({ ...editingPlayer, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role.replace("_", " ").toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editingPlayer.category || ""}
                            onChange={(e) => setEditingPlayer({ ...editingPlayer, category: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={editingPlayer.real_team_id || ""}
                            onValueChange={(value) => setEditingPlayer({ ...editingPlayer, real_team_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {realTeams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.short_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editingPlayer.base_price || 0}
                            onChange={(e) => setEditingPlayer({ ...editingPlayer, base_price: parseInt(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>{player.total_points || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleUpdatePlayer}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingPlayer(null)}>
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell className="capitalize">{player.role.replace("_", " ")}</TableCell>
                        <TableCell>{player.category || "N/A"}</TableCell>
                        <TableCell>{player.real_teams?.short_name || "N/A"}</TableCell>
                        <TableCell>₹{(player.base_price || 0).toLocaleString()}</TableCell>
                        <TableCell>{player.total_points || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingPlayer(player)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deletePlayer(player.id)}>
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

        <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Players?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {players.length} players from this tournament. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete All {players.length} Players
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerManagementModal;
