export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      auction_logs: {
        Row: {
          action: string
          bid_amount: number
          bidder_id: string | null
          id: string
          player_id: string | null
          revoked: boolean | null
          timestamp: string | null
          tournament_id: string
        }
        Insert: {
          action: string
          bid_amount: number
          bidder_id?: string | null
          id?: string
          player_id?: string | null
          revoked?: boolean | null
          timestamp?: string | null
          tournament_id: string
        }
        Update: {
          action?: string
          bid_amount?: number
          bidder_id?: string | null
          id?: string
          player_id?: string | null
          revoked?: boolean | null
          timestamp?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_logs_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "team_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_logs_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_rules: {
        Row: {
          auto_assignment_rule: string
          bid_increment_type: string
          created_at: string | null
          created_by: string | null
          currency: string
          id: string
          increment_value: number
          initial_budget: number
          is_master_template: boolean | null
          max_players_per_team: number
          min_bid: number
          name: string
          reserve_price_field: string
          role_constraints: Json
          rounds: number
          type: string
        }
        Insert: {
          auto_assignment_rule?: string
          bid_increment_type: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          increment_value: number
          initial_budget: number
          is_master_template?: boolean | null
          max_players_per_team: number
          min_bid: number
          name: string
          reserve_price_field?: string
          role_constraints?: Json
          rounds?: number
          type: string
        }
        Update: {
          auto_assignment_rule?: string
          bid_increment_type?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          increment_value?: number
          initial_budget?: number
          is_master_template?: boolean | null
          max_players_per_team?: number
          min_bid?: number
          name?: string
          reserve_price_field?: string
          role_constraints?: Json
          rounds?: number
          type?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          match_date: string
          match_number: number
          team1_id: string | null
          team2_id: string | null
          tournament_id: string
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          match_date: string
          match_number: number
          team1_id?: string | null
          team2_id?: string | null
          tournament_id: string
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          match_date?: string
          match_number?: number
          team1_id?: string | null
          team2_id?: string | null
          tournament_id?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "real_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "real_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_points: {
        Row: {
          details: Json | null
          id: string
          match_id: string
          player_id: string
          points: number
          updated_at: string | null
        }
        Insert: {
          details?: Json | null
          id?: string
          match_id: string
          player_id: string
          points?: number
          updated_at?: string | null
        }
        Update: {
          details?: Json | null
          id?: string
          match_id?: string
          player_id?: string
          points?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_match_points_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_points_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          auction_price: number | null
          base_price: number | null
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
          real_team_id: string | null
          role: string
          total_points: number | null
          tournament_id: string
        }
        Insert: {
          auction_price?: number | null
          base_price?: number | null
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
          real_team_id?: string | null
          role: string
          total_points?: number | null
          tournament_id: string
        }
        Update: {
          auction_price?: number | null
          base_price?: number | null
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          real_team_id?: string | null
          role?: string
          total_points?: number | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "team_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_real_team_id_fkey"
            columns: ["real_team_id"]
            isOneToOne: false
            referencedRelation: "real_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      real_teams: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          short_name: string
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          short_name: string
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_rules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_master_template: boolean | null
          name: string
          rules: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_master_template?: boolean | null
          name: string
          rules?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_master_template?: boolean | null
          name?: string
          rules?: Json
        }
        Relationships: []
      }
      team_owners: {
        Row: {
          budget_remaining: number
          color: string
          created_at: string | null
          id: string
          name: string
          short_name: string
          total_points: number | null
          tournament_id: string
          user_id: string | null
        }
        Insert: {
          budget_remaining: number
          color?: string
          created_at?: string | null
          id?: string
          name: string
          short_name: string
          total_points?: number | null
          tournament_id: string
          user_id?: string | null
        }
        Update: {
          budget_remaining?: number
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          short_name?: string
          total_points?: number | null
          tournament_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_owners_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_auction_rules: {
        Row: {
          auction_rule_id: string | null
          created_at: string | null
          custom_config: Json | null
          id: string
          is_customized: boolean | null
          tournament_id: string
        }
        Insert: {
          auction_rule_id?: string | null
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_customized?: boolean | null
          tournament_id: string
        }
        Update: {
          auction_rule_id?: string | null
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_customized?: boolean | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_auction_rules_auction_rule_id_fkey"
            columns: ["auction_rule_id"]
            isOneToOne: false
            referencedRelation: "auction_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_auction_rules_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_permissions: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_permissions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_scoring_rules: {
        Row: {
          created_at: string | null
          custom_config: Json | null
          id: string
          is_customized: boolean | null
          scoring_rule_id: string | null
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_customized?: boolean | null
          scoring_rule_id?: string | null
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_customized?: boolean | null
          scoring_rule_id?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_scoring_rules_scoring_rule_id_fkey"
            columns: ["scoring_rule_id"]
            isOneToOne: false
            referencedRelation: "scoring_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_scoring_rules_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          timezone: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          timezone?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          timezone?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tournament_permission: {
        Args: {
          _required_role: string
          _tournament_id: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "tournament_admin" | "team_owner" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "tournament_admin", "team_owner", "viewer"],
    },
  },
} as const
