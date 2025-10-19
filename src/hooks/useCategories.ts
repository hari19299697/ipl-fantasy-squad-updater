import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCategories = (tournamentId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });

  const createMutation = useMutation({
    mutationFn: async (newCategory: { tournament_id: string; name: string; description?: string; adder?: number }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tournamentId] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (newCategories: { tournament_id: string; name: string; description?: string; adder?: number }[]) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(newCategories)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tournamentId] });
      toast({
        title: "Success",
        description: "Categories created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    bulkCreateCategories: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  };
};
