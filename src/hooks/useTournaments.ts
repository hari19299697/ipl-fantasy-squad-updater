import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type TournamentInsert = Database['public']['Tables']['tournaments']['Insert'];
type TournamentUpdate = Database['public']['Tables']['tournaments']['Update'];

export const useTournaments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all tournaments
  const { data: tournaments, isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Tournament[];
    },
  });

  // Create tournament
  const createMutation = useMutation({
    mutationFn: async (tournament: TournamentInsert) => {
      const { data, error } = await supabase
        .from('tournaments')
        .insert(tournament)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "Success",
        description: "Tournament created successfully",
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

  // Update tournament
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TournamentUpdate }) => {
      const { data, error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "Success",
        description: "Tournament updated successfully",
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

  // Delete tournament
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "Success",
        description: "Tournament deleted successfully",
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
    tournaments: tournaments || [],
    isLoading,
    error,
    createTournament: createMutation.mutate,
    updateTournament: updateMutation.mutate,
    deleteTournament: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// Get single tournament
export const useTournament = (id: string | undefined) => {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Tournament;
    },
    enabled: !!id,
  });
};
