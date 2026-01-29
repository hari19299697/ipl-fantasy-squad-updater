import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MatchResult {
  playerId: string;
  playerName: string;
  points: number;
  matched: boolean;
  apiPlayerName: string;
  isPlayingXI?: boolean;
}

interface FantasyPointsResponse {
  success: boolean;
  data?: Array<{
    name: string;
    shortName: string;
    team: string;
    points: number;
  }>;
  matchResults?: MatchResult[];
  savedCount?: number;
  unmatchedCount?: number;
  message?: string;
  error?: string;
}

interface FetchPointsParams {
  externalMatchId: string;
  matchId?: string;
  tournamentId?: string;
  saveToDb?: boolean;
}

export const useFantasyPoints = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchPointsMutation = useMutation({
    mutationFn: async (params: FetchPointsParams): Promise<FantasyPointsResponse> => {
      const { data, error } = await supabase.functions.invoke('fetch-fantasy-points', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Fantasy points data:', data);
      
      if (variables.saveToDb) {
        toast({
          title: "Points Updated",
          description: `Saved points for ${data.savedCount} players. ${data.unmatchedCount || 0} players could not be matched.`,
        });
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['playerMatchPoints'] });
        queryClient.invalidateQueries({ queryKey: ['players'] });
        queryClient.invalidateQueries({ queryKey: ['teamOwners'] });
      } else {
        toast({
          title: "Success",
          description: "Fantasy points fetched successfully",
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error fetching fantasy points:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch fantasy points",
        variant: "destructive",
      });
    },
  });

  return {
    fetchFantasyPoints: fetchPointsMutation.mutate,
    fetchFantasyPointsAsync: fetchPointsMutation.mutateAsync,
    isLoading: fetchPointsMutation.isPending,
    error: fetchPointsMutation.error,
    data: fetchPointsMutation.data,
  };
};
