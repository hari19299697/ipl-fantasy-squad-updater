import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Player = Database['public']['Tables']['players']['Row'];
type PlayerInsert = Database['public']['Tables']['players']['Insert'];
type PlayerUpdate = Database['public']['Tables']['players']['Update'];

export const usePlayers = (tournamentId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch players for a tournament
  // Use team_owners_public view to ensure all users can read team info
  const { data: players, isLoading, error } = useQuery({
    queryKey: ['players', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('players')
        .select('*, real_teams(*), team_owners:team_owners_public(*)')
        .eq('tournament_id', tournamentId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });

  // Create player
  const createMutation = useMutation({
    mutationFn: async (player: PlayerInsert) => {
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      toast({
        title: "Success",
        description: "Player added successfully",
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

  // Update player
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PlayerUpdate }) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      toast({
        title: "Success",
        description: "Player updated successfully",
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

  // Delete player
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      toast({
        title: "Success",
        description: "Player deleted successfully",
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

  // Bulk create players
  const bulkCreateMutation = useMutation({
    mutationFn: async (players: PlayerInsert[]) => {
      const { data, error } = await supabase
        .from('players')
        .insert(players)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      toast({
        title: "Success",
        description: `${data.length} players added successfully`,
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
    players: players || [],
    isLoading,
    error,
    createPlayer: createMutation.mutate,
    updatePlayer: updateMutation.mutate,
    deletePlayer: deleteMutation.mutate,
    bulkCreatePlayers: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  };
};
