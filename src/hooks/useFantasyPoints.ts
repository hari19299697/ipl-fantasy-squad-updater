import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FantasyPointsResponse {
  success: boolean;
  data: unknown;
  error?: string;
}

export const useFantasyPoints = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchPointsMutation = useMutation({
    mutationFn: async (matchId: string): Promise<FantasyPointsResponse> => {
      const { data, error } = await supabase.functions.invoke('fetch-fantasy-points', {
        body: { matchId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Fantasy points data:', data);
      toast({
        title: "Success",
        description: "Fantasy points fetched successfully",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['playerMatchPoints'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
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
  };
};
