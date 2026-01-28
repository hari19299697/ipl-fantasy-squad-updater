import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CloneTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentName: string;
}

const CloneTournamentModal = ({ isOpen, onClose, tournamentId, tournamentName }: CloneTournamentModalProps) => {
  const [newName, setNewName] = useState(`${tournamentName} (Copy)`);
  const [isCloning, setIsCloning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleClone = async () => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the cloned tournament", variant: "destructive" });
      return;
    }

    setIsCloning(true);
    try {
      // 1. Fetch the original tournament
      const { data: originalTournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;

      // 2. Create new tournament
      const { data: newTournament, error: createError } = await supabase
        .from('tournaments')
        .insert({
          name: newName.trim(),
          type: originalTournament.type,
          start_date: originalTournament.start_date,
          end_date: originalTournament.end_date,
          status: 'draft',
          timezone: originalTournament.timezone,
        })
        .select()
        .single();

      if (createError) throw createError;

      const newTournamentId = newTournament.id;

      // 3. Clone real teams
      const { data: realTeams } = await supabase
        .from('real_teams')
        .select('*')
        .eq('tournament_id', tournamentId);

      const realTeamIdMap: Record<string, string> = {};
      if (realTeams && realTeams.length > 0) {
        const { data: newRealTeams, error: realTeamsError } = await supabase
          .from('real_teams')
          .insert(realTeams.map(team => ({
            tournament_id: newTournamentId,
            name: team.name,
            short_name: team.short_name,
            logo_url: team.logo_url,
          })))
          .select();

        if (realTeamsError) throw realTeamsError;
        
        if (newRealTeams) {
          realTeams.forEach((oldTeam, index) => {
            realTeamIdMap[oldTeam.id] = newRealTeams[index].id;
          });
        }
      }

      // 4. Clone team owners
      const { data: teamOwners } = await supabase
        .from('team_owners')
        .select('*')
        .eq('tournament_id', tournamentId);

      const ownerIdMap: Record<string, string> = {};
      if (teamOwners && teamOwners.length > 0) {
        const { data: newOwners, error: ownersError } = await supabase
          .from('team_owners')
          .insert(teamOwners.map(owner => ({
            tournament_id: newTournamentId,
            name: owner.name,
            short_name: owner.short_name,
            color: owner.color,
            budget_remaining: owner.budget_remaining,
            total_points: 0,
          })))
          .select();

        if (ownersError) throw ownersError;
        
        if (newOwners) {
          teamOwners.forEach((oldOwner, index) => {
            ownerIdMap[oldOwner.id] = newOwners[index].id;
          });
        }
      }

      // 5. Clone categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (categories && categories.length > 0) {
        const { error: categoriesError } = await supabase
          .from('categories')
          .insert(categories.map(cat => ({
            tournament_id: newTournamentId,
            name: cat.name,
            description: cat.description,
            adder: cat.adder,
          })));

        if (categoriesError) throw categoriesError;
      }

      // 6. Clone players (without owner assignments for clean slate)
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (players && players.length > 0) {
        const { error: playersError } = await supabase
          .from('players')
          .insert(players.map(player => ({
            tournament_id: newTournamentId,
            name: player.name,
            role: player.role,
            category: player.category,
            base_price: player.base_price,
            auction_price: null,
            owner_id: null,
            real_team_id: player.real_team_id ? realTeamIdMap[player.real_team_id] || null : null,
            total_points: 0,
          })));

        if (playersError) throw playersError;
      }

      // 7. Clone matches
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (matches && matches.length > 0) {
        const { error: matchesError } = await supabase
          .from('matches')
          .insert(matches.map(match => ({
            tournament_id: newTournamentId,
            match_number: match.match_number,
            team1_id: match.team1_id ? realTeamIdMap[match.team1_id] || null : null,
            team2_id: match.team2_id ? realTeamIdMap[match.team2_id] || null : null,
            match_date: match.match_date,
            venue: match.venue,
            is_completed: false,
          })));

        if (matchesError) throw matchesError;
      }

      // 8. Clone tournament auction rules
      const { data: auctionRule } = await supabase
        .from('tournament_auction_rules')
        .select('*')
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (auctionRule) {
        const { error: auctionRuleError } = await supabase
          .from('tournament_auction_rules')
          .insert({
            tournament_id: newTournamentId,
            auction_rule_id: auctionRule.auction_rule_id,
            is_customized: auctionRule.is_customized,
            custom_config: auctionRule.custom_config,
          });

        if (auctionRuleError) throw auctionRuleError;
      }

      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      
      toast({
        title: "Success",
        description: `Tournament "${newName}" cloned successfully!`,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Clone error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clone tournament",
        variant: "destructive",
      });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clone Tournament
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{tournamentName}" with all teams, players, matches, and configurations.
            Player ownership and auction data will be reset for a fresh start.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">New Tournament Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name for cloned tournament"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCloning}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={isCloning}>
            {isCloning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Clone Tournament
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloneTournamentModal;
