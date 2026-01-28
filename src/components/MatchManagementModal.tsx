import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMatches } from "@/hooks/useMatches";
import { useRealTeams } from "@/hooks/useRealTeams";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Upload, Trash2, Edit, X, Check, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface MatchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

const MatchManagementModal = ({ isOpen, onClose, tournamentId }: MatchManagementModalProps) => {
  const { matches, bulkCreateMatches, deleteMatch, deleteAllMatches, updateMatch, isDeletingAll } = useMatches(tournamentId);
  const { realTeams } = useRealTeams(tournamentId);
  const { toast } = useToast();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    match_number: "",
    team1_id: "",
    team2_id: "",
    venue: "",
    match_date: "",
    is_completed: false,
  });
  const [newMatch, setNewMatch] = useState({
    match_number: "",
    team1_id: "",
    team2_id: "",
    venue: "",
    match_date: "",
  });

  const handleAddMatch = () => {
    if (!newMatch.match_number || !newMatch.team1_id || !newMatch.team2_id || !newMatch.match_date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    bulkCreateMatches([{
      tournament_id: tournamentId,
      match_number: parseInt(newMatch.match_number),
      team1_id: newMatch.team1_id,
      team2_id: newMatch.team2_id,
      venue: newMatch.venue || null,
      match_date: new Date(newMatch.match_date).toISOString(),
    }]);

    setNewMatch({ match_number: "", team1_id: "", team2_id: "", venue: "", match_date: "" });
  };

  const handleStartEdit = (match: any) => {
    setEditingMatchId(match.id);
    setEditForm({
      match_number: match.match_number.toString(),
      team1_id: match.team1_id || "",
      team2_id: match.team2_id || "",
      venue: match.venue || "",
      match_date: format(new Date(match.match_date), "yyyy-MM-dd'T'HH:mm"),
      is_completed: match.is_completed || false,
    });
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setEditForm({ match_number: "", team1_id: "", team2_id: "", venue: "", match_date: "", is_completed: false });
  };

  const handleSaveEdit = (matchId: string) => {
    if (!editForm.match_number || !editForm.team1_id || !editForm.team2_id || !editForm.match_date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    updateMatch({
      id: matchId,
      updates: {
        match_number: parseInt(editForm.match_number),
        team1_id: editForm.team1_id,
        team2_id: editForm.team2_id,
        venue: editForm.venue || null,
        match_date: new Date(editForm.match_date).toISOString(),
        is_completed: editForm.is_completed,
      },
    });

    setEditingMatchId(null);
  };

  const handleDeleteAllMatches = () => {
    deleteAllMatches();
    setShowDeleteAllDialog(false);
  };

  const handleExport = () => {
    const exportData = matches.map((match) => ({
      MatchNumber: match.match_number,
      Team1: match.team1?.short_name || "",
      Team2: match.team2?.short_name || "",
      Venue: match.venue || "",
      MatchDate: format(new Date(match.match_date), "yyyy-MM-dd"),
      IsCompleted: match.is_completed ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Matches");
    XLSX.writeFile(wb, `matches_${tournamentId}.xlsx`);
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

        const matchesToImport = jsonData.map((row) => {
          const team1 = realTeams.find(
            (t) => t.short_name === row.Team1 || t.name === row.Team1
          );
          const team2 = realTeams.find(
            (t) => t.short_name === row.Team2 || t.name === row.Team2
          );

          return {
            tournament_id: tournamentId,
            match_number: parseInt(row.MatchNumber || row.match_number),
            team1_id: team1?.id || null,
            team2_id: team2?.id || null,
            venue: row.Venue || row.venue || null,
            match_date: new Date(row.MatchDate || row.match_date).toISOString(),
          };
        });

        bulkCreateMatches(matchesToImport);
      } catch (error) {
        toast({ title: "Import Error", description: "Failed to import file", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Matches</DialogTitle>
            <DialogDescription>Add, edit, or import matches for this tournament</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Delete All Button */}
            {matches.length > 0 && (
              <div className="flex justify-end">
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={isDeletingAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Matches ({matches.length})
                </Button>
              </div>
            )}

            {/* Add New Match */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Match
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Match Number *</Label>
                  <Input
                    type="number"
                    value={newMatch.match_number}
                    onChange={(e) => setNewMatch({ ...newMatch, match_number: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Team 1 *</Label>
                  <Select value={newMatch.team1_id} onValueChange={(value) => setNewMatch({ ...newMatch, team1_id: value })}>
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
                  <Label>Team 2 *</Label>
                  <Select value={newMatch.team2_id} onValueChange={(value) => setNewMatch({ ...newMatch, team2_id: value })}>
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
                  <Label>Venue</Label>
                  <Input
                    value={newMatch.venue}
                    onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                    placeholder="Stadium name"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Match Date *</Label>
                  <Input
                    type="datetime-local"
                    value={newMatch.match_date}
                    onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddMatch} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Match
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

            {/* Matches List */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match #</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      {editingMatchId === match.id ? (
                        <>
                          <TableCell>
                            <Input
                              type="number"
                              value={editForm.match_number}
                              onChange={(e) => setEditForm({ ...editForm, match_number: e.target.value })}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Select value={editForm.team1_id} onValueChange={(value) => setEditForm({ ...editForm, team1_id: value })}>
                                <SelectTrigger className="w-20">
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
                              <span className="flex items-center">vs</span>
                              <Select value={editForm.team2_id} onValueChange={(value) => setEditForm({ ...editForm, team2_id: value })}>
                                <SelectTrigger className="w-20">
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
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editForm.venue}
                              onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="datetime-local"
                              value={editForm.match_date}
                              onChange={(e) => setEditForm({ ...editForm, match_date: e.target.value })}
                              className="w-44"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={editForm.is_completed ? "completed" : "upcoming"} 
                              onValueChange={(value) => setEditForm({ ...editForm, is_completed: value === "completed" })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(match.id)}>
                                <Check className="h-4 w-4 text-primary" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">Match {match.match_number}</TableCell>
                          <TableCell>
                            {match.team1?.short_name || "TBD"} vs {match.team2?.short_name || "TBD"}
                          </TableCell>
                          <TableCell>{match.venue || "—"}</TableCell>
                          <TableCell>{format(new Date(match.match_date), "MMM dd, yyyy HH:mm")}</TableCell>
                          <TableCell>
                            <Badge variant={match.is_completed ? "default" : "secondary"}>
                              {match.is_completed ? "Completed" : "Upcoming"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleStartEdit(match)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteMatch(match.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  {matches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No matches added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete All Matches
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {matches.length} matches? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllMatches}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MatchManagementModal;
