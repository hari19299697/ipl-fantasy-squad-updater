import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { useTeamOwners } from "@/hooks/useTeamOwners";
import { usePlayers } from "@/hooks/usePlayers";
import { useRealTeams } from "@/hooks/useRealTeams";
import { useCategories } from "@/hooks/useCategories";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface TeamOwnerForm {
  name: string;
  shortName: string;
  color: string;
  budget: number;
}

interface PlayerForm {
  name: string;
  role: string;
  realTeam: string;
  category: string;
  basePrice: number;
}

const TournamentCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createTournament, isCreating } = useTournaments();
  const { bulkCreateTeamOwners } = useTeamOwners(undefined);
  const { bulkCreatePlayers } = usePlayers(undefined);
  const { bulkCreateCategories } = useCategories(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const { categories: masterCategories } = useCategories(tournamentId || undefined);

  // Step 1: Tournament Details
  const [tournamentData, setTournamentData] = useState({
    name: "",
    type: "cricket",
    start_date: "",
    end_date: "",
    status: "draft",
    timezone: "Asia/Kolkata",
  });

  // Step 2: Team Owners
  const [teamOwners, setTeamOwners] = useState<TeamOwnerForm[]>([
    { name: "", shortName: "", color: "#FF5757", budget: 1000000 }
  ]);

  // Step 3: Players
  const [players, setPlayers] = useState<PlayerForm[]>([
    { name: "", role: "batsman", realTeam: "", category: "", basePrice: 100000 }
  ]);

  const [realTeams, setRealTeams] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const handleTournamentChange = (field: string, value: string) => {
    setTournamentData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateTournament = async () => {
    if (!tournamentData.name || !tournamentData.start_date || !tournamentData.end_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTournament(
      {
        ...tournamentData,
        start_date: new Date(tournamentData.start_date).toISOString(),
        end_date: new Date(tournamentData.end_date).toISOString(),
      },
      {
        onSuccess: (data) => {
          setTournamentId(data.id);
          setStep(2);
        },
      }
    );
  };

  const addTeamOwner = () => {
    setTeamOwners([...teamOwners, { name: "", shortName: "", color: "#" + Math.floor(Math.random()*16777215).toString(16), budget: 1000000 }]);
  };

  const removeTeamOwner = (index: number) => {
    setTeamOwners(teamOwners.filter((_, i) => i !== index));
  };

  const updateTeamOwner = (index: number, field: keyof TeamOwnerForm, value: string | number) => {
    const updated = [...teamOwners];
    updated[index] = { ...updated[index], [field]: value };
    setTeamOwners(updated);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: "", role: "batsman", realTeam: "", category: "", basePrice: 100000 }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const importedPlayers: PlayerForm[] = jsonData.map((row) => ({
          name: row['Player Name'] || row['name'] || '',
          role: row['Player Role'] || row['role'] || 'batsman',
          realTeam: row['Real Team'] || row['realTeam'] || '',
          category: row['Category'] || row['category'] || '',
          basePrice: parseInt(row['Base Price'] || row['basePrice'] || '100000'),
        }));

        // Extract unique categories and real teams
        const uniqueCategories = [...new Set(importedPlayers.map(p => p.category).filter(Boolean))];
        const uniqueRealTeams = [...new Set(importedPlayers.map(p => p.realTeam).filter(Boolean))];
        
        setCategories(uniqueCategories);
        setRealTeams(uniqueRealTeams);
        setPlayers(importedPlayers);

        toast({
          title: "Success",
          description: `Imported ${importedPlayers.length} players`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse Excel file",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: keyof PlayerForm, value: string | number) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  const handleSaveTeamOwners = async () => {
    // Validate
    const invalid = teamOwners.some(o => !o.name || !o.shortName);
    if (invalid) {
      toast({
        title: "Error",
        description: "Please fill in all team owner details",
        variant: "destructive",
      });
      return;
    }

    if (!tournamentId) {
      toast({
        title: "Error",
        description: "Tournament ID is missing. Please start over.",
        variant: "destructive",
      });
      return;
    }

    // Save team owners to database
    bulkCreateTeamOwners(
      teamOwners.map(owner => ({
        tournament_id: tournamentId,
        name: owner.name,
        short_name: owner.shortName,
        color: owner.color,
        budget_remaining: owner.budget,
      })),
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: `${teamOwners.length} team owners saved successfully`,
          });
          setStep(3);
        },
        onError: (error: any) => {
          toast({
            title: "Error saving team owners",
            description: error.message || "Failed to save team owners",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSavePlayers = async () => {
    // Validate
    const invalid = players.some(p => !p.name || !p.realTeam);
    if (invalid) {
      toast({
        title: "Error",
        description: "Please fill in all player details",
        variant: "destructive",
      });
      return;
    }

    if (!tournamentId) {
      toast({
        title: "Error",
        description: "Tournament ID is missing. Please start over.",
        variant: "destructive",
      });
      return;
    }

    // First, create categories
    if (categories.length > 0) {
      bulkCreateCategories(
        categories.map(cat => ({
          tournament_id: tournamentId,
          name: cat,
        }))
      );
    }

    // Then save players to database
    bulkCreatePlayers(
      players.map(player => ({
        tournament_id: tournamentId,
        name: player.name,
        role: player.role,
        real_team_id: null, // We'll need to match this later
        category: player.category,
        base_price: player.basePrice,
      })),
      {
        onSuccess: () => {
          toast({
            title: "Success!",
            description: `Tournament setup complete with ${players.length} players`,
          });
          navigate(`/tournaments/${tournamentId}`);
        },
        onError: (error: any) => {
          toast({
            title: "Error saving players",
            description: error.message || "Failed to save players",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => step === 1 ? navigate("/") : setStep(step - 1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}>Tournament Details</span>
            <span className={step >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}>Team Owners</span>
            <span className={step >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}>Players</span>
          </div>
        </div>

        {/* Step 1: Tournament Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
              <CardDescription>Set up your tournament basic information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTournament(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., IPL 2025"
                    value={tournamentData.name}
                    onChange={(e) => handleTournamentChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tournament Type *</Label>
                  <Select value={tournamentData.type} onValueChange={(value) => handleTournamentChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={tournamentData.start_date}
                      onChange={(e) => handleTournamentChange("start_date", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={tournamentData.end_date}
                      onChange={(e) => handleTournamentChange("end_date", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Next: Add Team Owners
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Team Owners */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Owners</CardTitle>
              <CardDescription>Add virtual team owners who will participate in the auction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamOwners.map((owner, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Team Owner #{index + 1}</span>
                      {teamOwners.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeTeamOwner(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Team Owner Name"
                        value={owner.name}
                        onChange={(e) => updateTeamOwner(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Team Name"
                        value={owner.shortName}
                        onChange={(e) => updateTeamOwner(index, 'shortName', e.target.value)}
                        maxLength={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Color:</Label>
                        <Input
                          type="color"
                          value={owner.color}
                          onChange={(e) => updateTeamOwner(index, 'color', e.target.value)}
                          className="w-20 h-10"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Purse Wallet</Label>
                        <Input
                          type="number"
                          placeholder="1000000"
                          value={owner.budget}
                          onChange={(e) => updateTeamOwner(index, 'budget', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={addTeamOwner}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Team Owner
                </Button>

                <Button 
                  className="w-full mt-4"
                  onClick={handleSaveTeamOwners}
                >
                  Next: Add Players
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Players */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Players Database</CardTitle>
              <CardDescription>Add all players who will be available in the auction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import from Excel
                  </Button>
                </div>
                {players.map((player, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Player #{index + 1}</span>
                      {players.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removePlayer(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Player Name"
                        value={player.name}
                        onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                      />
                      <Select 
                        value={player.role} 
                        onValueChange={(value) => updatePlayer(index, 'role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="batsman">Batsman</SelectItem>
                          <SelectItem value="bowler">Bowler</SelectItem>
                          <SelectItem value="all_rounder">All-Rounder</SelectItem>
                          <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Real Team"
                        value={player.realTeam}
                        onChange={(e) => updatePlayer(index, 'realTeam', e.target.value)}
                      />
                      <Select 
                        value={player.category} 
                        onValueChange={(value) => updatePlayer(index, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {masterCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Base Price"
                        value={player.basePrice}
                        onChange={(e) => updatePlayer(index, 'basePrice', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={addPlayer}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Player
                </Button>

                <Button 
                  className="w-full mt-4"
                  onClick={handleSavePlayers}
                >
                  Complete Tournament Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TournamentCreate;
