import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Match = Database['public']['Tables']['matches']['Row'];
type MatchInsert = Database['public']['Tables']['matches']['Insert'];
type MatchUpdate = Database['public']['Tables']['matches']['Update'];

export const useMatches = (tournamentId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch matches for a tournament
  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          team1:real_teams!matches_team1_id_fkey(id, name, short_name),
          team2:real_teams!matches_team2_id_fkey(id, name, short_name)
        `)
        .eq('tournament_id', tournamentId)
        .order('match_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });

  // Create match
  const createMutation = useMutation({
    mutationFn: async (match: MatchInsert) => {
      const { data, error } = await supabase
        .from('matches')
        .insert(match)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
      toast({
        title: "Success",
        description: "Match created successfully",
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

  // Update match
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MatchUpdate }) => {
      const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
      toast({
        title: "Success",
        description: "Match updated successfully",
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

  // Delete match
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
      toast({
        title: "Success",
        description: "Match deleted successfully",
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

  // Bulk create matches
  const bulkCreateMutation = useMutation({
    mutationFn: async (matches: MatchInsert[]) => {
      const { data, error } = await supabase
        .from('matches')
        .insert(matches)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
      toast({
        title: "Success",
        description: `${data.length} matches created successfully`,
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
    matches: matches || [],
    isLoading,
    error,
    createMatch: createMutation.mutate,
    updateMatch: updateMutation.mutate,
    deleteMatch: deleteMutation.mutate,
    bulkCreateMatches: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  };
};
