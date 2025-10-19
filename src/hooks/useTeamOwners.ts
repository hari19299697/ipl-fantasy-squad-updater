import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TeamOwner = Database['public']['Tables']['team_owners']['Row'];
type TeamOwnerInsert = Database['public']['Tables']['team_owners']['Insert'];
type TeamOwnerUpdate = Database['public']['Tables']['team_owners']['Update'];

export const useTeamOwners = (tournamentId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team owners for a tournament
  const { data: teamOwners, isLoading, error } = useQuery({
    queryKey: ['teamOwners', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('team_owners')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name');
      
      if (error) throw error;
      return data as TeamOwner[];
    },
    enabled: !!tournamentId,
  });

  // Create team owner
  const createMutation = useMutation({
    mutationFn: async (owner: TeamOwnerInsert) => {
      const { data, error } = await supabase
        .from('team_owners')
        .insert(owner)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });
      toast({
        title: "Success",
        description: "Team owner added successfully",
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

  // Update team owner
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TeamOwnerUpdate }) => {
      const { data, error } = await supabase
        .from('team_owners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });
      toast({
        title: "Success",
        description: "Team owner updated successfully",
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

  // Delete team owner
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_owners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });
      toast({
        title: "Success",
        description: "Team owner deleted successfully",
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

  // Bulk create team owners
  const bulkCreateMutation = useMutation({
    mutationFn: async (owners: TeamOwnerInsert[]) => {
      const { data, error } = await supabase
        .from('team_owners')
        .insert(owners)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teamOwners', tournamentId] });
      toast({
        title: "Success",
        description: `${data.length} team owners added successfully`,
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
    teamOwners: teamOwners || [],
    isLoading,
    error,
    createTeamOwner: createMutation.mutate,
    updateTeamOwner: updateMutation.mutate,
    deleteTeamOwner: deleteMutation.mutate,
    bulkCreateTeamOwners: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  };
};
