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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action_description: string
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          target_record_id: string | null
          target_table: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          function_name: string
          id: string
          metadata: Json | null
          model: string
          status: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          function_name: string
          id?: string
          metadata?: Json | null
          model: string
          status: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string
          id?: string
          metadata?: Json | null
          model?: string
          status?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      auth_attempts_log: {
        Row: {
          attempt_type: string
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cat_gifts: {
        Row: {
          cat_data: Json
          created_at: string | null
          id: string
          message: string | null
          recipient_id: string
          sender_id: string
          status: string | null
        }
        Insert: {
          cat_data: Json
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id: string
          sender_id: string
          status?: string | null
        }
        Update: {
          cat_data?: Json
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string | null
        }
        Relationships: []
      }
      daily_login_rewards: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_claimed_date: string | null
          last_login_date: string
          longest_streak: number | null
          total_logins: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_claimed_date?: string | null
          last_login_date: string
          longest_streak?: number | null
          total_logins?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_claimed_date?: string | null
          last_login_date?: string
          longest_streak?: number | null
          total_logins?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component_name: string | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          route: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          background_id: string
          cat_id: string
          cat_name: string
          created_at: string | null
          frame_id: string
          id: string
          image_path: string
          is_favorite: boolean | null
          pose_id: string
          sticker_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          background_id: string
          cat_id: string
          cat_name: string
          created_at?: string | null
          frame_id: string
          id?: string
          image_path: string
          is_favorite?: boolean | null
          pose_id: string
          sticker_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          background_id?: string
          cat_id?: string
          cat_name?: string
          created_at?: string | null
          frame_id?: string
          id?: string
          image_path?: string
          is_favorite?: boolean | null
          pose_id?: string
          sticker_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_saves: {
        Row: {
          created_at: string | null
          game_state: Json
          id: string
          kittens_bred: number | null
          last_played_at: string | null
          relationships: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_state: Json
          id?: string
          kittens_bred?: number | null
          last_played_at?: string | null
          relationships?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_state?: Json
          id?: string
          kittens_bred?: number | null
          last_played_at?: string | null
          relationships?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_rewards: {
        Row: {
          category: string
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          id: string
          period_end: string
          period_type: string
          rank: number
          reward_badge: string | null
          reward_coins: number
          user_id: string
        }
        Insert: {
          category: string
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          period_end: string
          period_type: string
          rank: number
          reward_badge?: string | null
          reward_coins: number
          user_id: string
        }
        Update: {
          category?: string
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_type?: string
          rank?: number
          reward_badge?: string | null
          reward_coins?: number
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          achievements_unlocked: number | null
          created_at: string | null
          id: string
          period_start: string
          period_type: string
          total_cats_owned: number | null
          total_kittens_bred: number | null
          total_money_earned: number | null
          total_show_wins: number | null
          user_id: string
        }
        Insert: {
          achievements_unlocked?: number | null
          created_at?: string | null
          id?: string
          period_start: string
          period_type: string
          total_cats_owned?: number | null
          total_kittens_bred?: number | null
          total_money_earned?: number | null
          total_show_wins?: number | null
          user_id: string
        }
        Update: {
          achievements_unlocked?: number | null
          created_at?: string | null
          id?: string
          period_start?: string
          period_type?: string
          total_cats_owned?: number | null
          total_kittens_bred?: number | null
          total_money_earned?: number | null
          total_show_wins?: number | null
          user_id?: string
        }
        Relationships: []
      }
      player_activity_log: {
        Row: {
          activity_description: string
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_description: string
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_description?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      player_challenge_progress: {
        Row: {
          challenge_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          id: string
          reward_claimed: boolean | null
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          reward_claimed?: boolean | null
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          reward_claimed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      player_challenge_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_week_completed: string | null
          longest_streak: number | null
          total_challenges_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_week_completed?: string | null
          longest_streak?: number | null
          total_challenges_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_week_completed?: string | null
          longest_streak?: number | null
          total_challenges_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_friend"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          achievements_unlocked: number | null
          avatar_emoji: string | null
          display_name: string | null
          highest_cat_grade: number | null
          id: string
          last_updated: string | null
          total_cats_owned: number | null
          total_kittens_bred: number | null
          total_money_earned: number | null
          total_show_wins: number | null
          user_id: string
        }
        Insert: {
          achievements_unlocked?: number | null
          avatar_emoji?: string | null
          display_name?: string | null
          highest_cat_grade?: number | null
          id?: string
          last_updated?: string | null
          total_cats_owned?: number | null
          total_kittens_bred?: number | null
          total_money_earned?: number | null
          total_show_wins?: number | null
          user_id: string
        }
        Update: {
          achievements_unlocked?: number | null
          avatar_emoji?: string | null
          display_name?: string | null
          highest_cat_grade?: number | null
          id?: string
          last_updated?: string | null
          total_cats_owned?: number | null
          total_kittens_bred?: number | null
          total_money_earned?: number | null
          total_show_wins?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_emoji: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          notification_preferences: Json | null
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          notification_preferences?: Json | null
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          notification_preferences?: Json | null
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      rank_history: {
        Row: {
          category: string
          id: string
          rank: number
          recorded_at: string | null
          score: number
          user_id: string
        }
        Insert: {
          category: string
          id?: string
          rank: number
          recorded_at?: string | null
          score: number
          user_id: string
        }
        Update: {
          category?: string
          id?: string
          rank?: number
          recorded_at?: string | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      rewards_processing_log: {
        Row: {
          id: string
          period_end: string
          period_type: string
          processed_at: string | null
          rewards_created: number | null
        }
        Insert: {
          id?: string
          period_end: string
          period_type: string
          processed_at?: string | null
          rewards_created?: number | null
        }
        Update: {
          id?: string
          period_end?: string
          period_type?: string
          processed_at?: string | null
          rewards_created?: number | null
        }
        Relationships: []
      }
      trade_offers: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          offered_cats: Json | null
          offered_money: number | null
          offered_resources: Json | null
          recipient_id: string
          requested_cats: Json | null
          requested_money: number | null
          requested_resources: Json | null
          sender_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          offered_cats?: Json | null
          offered_money?: number | null
          offered_resources?: Json | null
          recipient_id: string
          requested_cats?: Json | null
          requested_money?: number | null
          requested_resources?: Json | null
          sender_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          offered_cats?: Json | null
          offered_money?: number | null
          offered_resources?: Json | null
          recipient_id?: string
          requested_cats?: Json | null
          requested_money?: number | null
          requested_resources?: Json | null
          sender_id?: string
          status?: string | null
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
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string
          difficulty: string | null
          emoji: string
          ends_at: string
          id: string
          is_active: boolean | null
          name: string
          reward_badge: string | null
          reward_coins: number
          starts_at: string
          target_value: number
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          emoji: string
          ends_at: string
          id?: string
          is_active?: boolean | null
          name: string
          reward_badge?: string | null
          reward_coins: number
          starts_at: string
          target_value: number
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          emoji?: string
          ends_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          reward_badge?: string | null
          reward_coins?: number
          starts_at?: string
          target_value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
