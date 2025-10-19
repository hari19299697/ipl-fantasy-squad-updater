import { useTournamentContext } from "@/contexts/TournamentContext";
import { useTournaments } from "@/hooks/useTournaments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Loader2 } from "lucide-react";

const TournamentSelector = () => {
  const { selectedTournamentId, setSelectedTournamentId } = useTournamentContext();
  const { tournaments, isLoading } = useTournaments();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedTournamentId || undefined}
      onValueChange={setSelectedTournamentId}
    >
      <SelectTrigger className="w-[200px] h-9">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Select tournament" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {tournaments.map((tournament) => (
          <SelectItem key={tournament.id} value={tournament.id}>
            {tournament.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TournamentSelector;
