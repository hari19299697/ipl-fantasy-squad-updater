import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type RealTeam = Database['public']['Tables']['real_teams']['Row'];
type RealTeamInsert = Database['public']['Tables']['real_teams']['Insert'];

export const useRealTeams = (tournamentId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real teams for a tournament
  const { data: realTeams, isLoading, error } = useQuery({
    queryKey: ['realTeams', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('real_teams')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name');
      
      if (error) throw error;
      return data as RealTeam[];
    },
    enabled: !!tournamentId,
  });

  // Bulk create real teams
  const bulkCreateMutation = useMutation({
    mutationFn: async (teams: RealTeamInsert[]) => {
      const { data, error } = await supabase
        .from('real_teams')
        .insert(teams)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['realTeams', tournamentId] });
      toast({
        title: "Success",
        description: `${data.length} teams created successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    realTeams: realTeams || [],
    isLoading,
    error,
    bulkCreateRealTeams: bulkCreateMutation.mutate,
    isBulkCreating: bulkCreateMutation.isPending,
  };
};
