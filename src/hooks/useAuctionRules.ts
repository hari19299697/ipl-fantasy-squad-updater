import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AuctionRule = Database['public']['Tables']['auction_rules']['Row'];
type AuctionRuleInsert = Database['public']['Tables']['auction_rules']['Insert'];
type AuctionRuleUpdate = Database['public']['Tables']['auction_rules']['Update'];

export const useAuctionRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all auction rules
  const { data: auctionRules, isLoading, error } = useQuery({
    queryKey: ['auctionRules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AuctionRule[];
    },
  });

  // Create auction rule
  const createMutation = useMutation({
    mutationFn: async (rule: AuctionRuleInsert) => {
      const { data, error } = await supabase
        .from('auction_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctionRules'] });
      toast({
        title: "Success",
        description: "Auction rule created successfully",
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

  // Update auction rule
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AuctionRuleUpdate }) => {
      const { data, error } = await supabase
        .from('auction_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctionRules'] });
      toast({
        title: "Success",
        description: "Auction rule updated successfully",
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
    auctionRules: auctionRules || [],
    isLoading,
    error,
    createAuctionRule: createMutation.mutate,
    updateAuctionRule: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};
