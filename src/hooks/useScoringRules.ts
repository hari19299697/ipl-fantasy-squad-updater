import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ScoringRule = Database['public']['Tables']['scoring_rules']['Row'];
type ScoringRuleInsert = Database['public']['Tables']['scoring_rules']['Insert'];
type ScoringRuleUpdate = Database['public']['Tables']['scoring_rules']['Update'];

export const useScoringRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all scoring rules
  const { data: scoringRules, isLoading, error } = useQuery({
    queryKey: ['scoringRules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoring_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ScoringRule[];
    },
  });

  // Create scoring rule
  const createMutation = useMutation({
    mutationFn: async (rule: ScoringRuleInsert) => {
      const { data, error } = await supabase
        .from('scoring_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoringRules'] });
      toast({
        title: "Success",
        description: "Scoring rule created successfully",
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

  // Update scoring rule
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ScoringRuleUpdate }) => {
      const { data, error } = await supabase
        .from('scoring_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoringRules'] });
      toast({
        title: "Success",
        description: "Scoring rule updated successfully",
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
    scoringRules: scoringRules || [],
    isLoading,
    error,
    createScoringRule: createMutation.mutate,
    updateScoringRule: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};
