import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TournamentAuctionRule = Database['public']['Tables']['tournament_auction_rules']['Row'];

export const useTournamentAuctionRules = (tournamentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tournament auction rule with the template details
  const { data: tournamentAuctionRule, isLoading } = useQuery({
    queryKey: ['tournamentAuctionRule', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;
      
      const { data, error } = await supabase
        .from('tournament_auction_rules')
        .select(`
          *,
          auction_rules (*)
        `)
        .eq('tournament_id', tournamentId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });

  // Apply auction template to tournament
  const applyTemplateMutation = useMutation({
    mutationFn: async ({ 
      tournamentId, 
      auctionRuleId,
    }: { 
      tournamentId: string; 
      auctionRuleId: string;
    }) => {
      // First check if a record already exists
      const { data: existing } = await supabase
        .from('tournament_auction_rules')
        .select('id')
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('tournament_auction_rules')
          .update({
            auction_rule_id: auctionRuleId,
            is_customized: false,
          })
          .eq('tournament_id', tournamentId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('tournament_auction_rules')
          .insert([{
            tournament_id: tournamentId,
            auction_rule_id: auctionRuleId,
            is_customized: false,
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournamentAuctionRule', tournamentId] });
      toast({
        title: "Success",
        description: "Auction template applied successfully",
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

  // Remove auction template from tournament
  const removeTemplateMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from('tournament_auction_rules')
        .delete()
        .eq('tournament_id', tournamentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournamentAuctionRule', tournamentId] });
      toast({
        title: "Success",
        description: "Auction template removed",
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
    tournamentAuctionRule,
    isLoading,
    applyTemplate: applyTemplateMutation.mutate,
    removeTemplate: removeTemplateMutation.mutate,
    isApplying: applyTemplateMutation.isPending,
    isRemoving: removeTemplateMutation.isPending,
  };
};
