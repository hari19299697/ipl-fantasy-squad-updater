import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PlayerMatchPoints = Database['public']['Tables']['player_match_points']['Row'];
type PlayerMatchPointsInsert = Database['public']['Tables']['player_match_points']['Insert'];
type PlayerMatchPointsUpdate = Database['public']['Tables']['player_match_points']['Update'];

export const usePlayerMatchPoints = (matchId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch player match points for a specific match
  const { data: playerMatchPoints, isLoading, error } = useQuery({
    queryKey: ['playerMatchPoints', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      
      const { data, error } = await supabase
        .from('player_match_points')
        .select('*, players(*)')
        .eq('match_id', matchId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  // Upsert player match points (insert or update)
  const upsertMutation = useMutation({
    mutationFn: async (pointsData: PlayerMatchPointsInsert) => {
      const { data, error } = await supabase
        .from('player_match_points')
        .upsert(pointsData, {
          onConflict: 'player_id,match_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerMatchPoints', matchId] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Success",
        description: "Points updated successfully",
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

  // Bulk upsert player match points
  const bulkUpsertMutation = useMutation({
    mutationFn: async (pointsData: PlayerMatchPointsInsert[]) => {
      const { data, error } = await supabase
        .from('player_match_points')
        .upsert(pointsData, {
          onConflict: 'player_id,match_id',
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playerMatchPoints', matchId] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Success",
        description: `Points updated for ${data.length} players`,
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
    playerMatchPoints: playerMatchPoints || [],
    isLoading,
    error,
    upsertPoints: upsertMutation.mutate,
    bulkUpsertPoints: bulkUpsertMutation.mutate,
    isUpserting: upsertMutation.isPending,
    isBulkUpserting: bulkUpsertMutation.isPending,
  };
};

// Get all match points for a player
export const usePlayerPoints = (playerId: string | undefined) => {
  return useQuery({
    queryKey: ['playerPoints', playerId],
    queryFn: async () => {
      if (!playerId) return [];
      
      const { data, error } = await supabase
        .from('player_match_points')
        .select('*, matches(*)')
        .eq('player_id', playerId)
        .order('matches(match_number)');
      
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });
};
