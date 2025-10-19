import { useState } from "react";
import { useTournamentContext } from "@/contexts/TournamentContext";
import { useMatches } from "@/hooks/useMatches";
import { useRealTeams } from "@/hooks/useRealTeams";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Loader2, Edit } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const MatchManagement = () => {
  const { selectedTournamentId } = useTournamentContext();
  const { matches, isLoading, createMatch, updateMatch, bulkCreateMatches } = useMatches(selectedTournamentId || undefined);
  const { realTeams } = useRealTeams(selectedTournamentId || undefined);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  
  const [matchForm, setMatchForm] = useState({
    match_number: matches.length + 1,
    team1_id: "",
    team2_id: "",
    match_date: "",
    venue: "",
    is_completed: false,
  });

  const handleCreateMatch = () => {
    if (!selectedTournamentId) return;
    
    createMatch(
      {
        ...matchForm,
        tournament_id: selectedTournamentId,
        match_date: new Date(matchForm.match_date).toISOString(),
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setMatchForm({
            match_number: matches.length + 2,
            team1_id: "",
            team2_id: "",
            match_date: "",
            venue: "",
            is_completed: false,
          });
        },
      }
    );
  };

  const handleUpdateMatch = () => {
    if (editingMatch) {
      updateMatch(
        {
          id: editingMatch.id,
          updates: {
            ...matchForm,
            match_date: new Date(matchForm.match_date).toISOString(),
          },
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingMatch(null);
          },
        }
      );
    }
  };

  const openEditMatch = (match: any) => {
    setEditingMatch(match);
    setMatchForm({
      match_number: match.match_number,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      match_date: format(new Date(match.match_date), "yyyy-MM-dd"),
      venue: match.venue,
      is_completed: match.is_completed,
    });
    setDialogOpen(true);
  };

  const toggleMatchCompletion = (match: any) => {
    updateMatch({
      id: match.id,
      updates: { is_completed: !match.is_completed },
    });
  };

  if (!selectedTournamentId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a tournament from the dropdown to manage matches.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <CardTitle>Match Management</CardTitle>
                </div>
                <CardDescription>Schedule and manage tournament matches</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingMatch(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Match
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMatch ? "Edit Match" : "Create New Match"}
                    </DialogTitle>
                    <DialogDescription>
                      Add a new match to the tournament schedule
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Match Number</Label>
                      <Input
                        type="number"
                        value={matchForm.match_number}
                        onChange={(e) => setMatchForm({ ...matchForm, match_number: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Team 1</Label>
                      <Select 
                        value={matchForm.team1_id} 
                        onValueChange={(value) => setMatchForm({ ...matchForm, team1_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {realTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Team 2</Label>
                      <Select 
                        value={matchForm.team2_id} 
                        onValueChange={(value) => setMatchForm({ ...matchForm, team2_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {realTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={matchForm.match_date}
                        onChange={(e) => setMatchForm({ ...matchForm, match_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input
                        value={matchForm.venue}
                        onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                        placeholder="e.g., Wankhede Stadium"
                      />
                    </div>
                    <Button 
                      onClick={editingMatch ? handleUpdateMatch : handleCreateMatch}
                      className="w-full"
                    >
                      {editingMatch ? "Update Match" : "Create Match"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No matches scheduled yet. Add your first match to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match #</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">Match {match.match_number}</TableCell>
                      <TableCell>
                        {match.team1?.short_name || 'TBD'} vs {match.team2?.short_name || 'TBD'}
                      </TableCell>
                      <TableCell>{match.venue}</TableCell>
                      <TableCell>{format(new Date(match.match_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={match.is_completed ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleMatchCompletion(match)}
                        >
                          {match.is_completed ? "Completed" : "Upcoming"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMatch(match)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatchManagement;
