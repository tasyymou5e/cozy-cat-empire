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
      admin_notifications: {
        Row: {
          body: string
          delivery_count: number | null
          id: string
          sent_at: string | null
          sent_by: string | null
          status: string | null
          target: string | null
          target_user_ids: string[] | null
          title: string
        }
        Insert: {
          body: string
          delivery_count?: number | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          target?: string | null
          target_user_ids?: string[] | null
          title: string
        }
        Update: {
          body?: string
          delivery_count?: number | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          target?: string | null
          target_user_ids?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_rate_limits: {
        Row: {
          action_count: number | null
          action_type: string
          admin_user_id: string
          id: string
          window_start: string | null
        }
        Insert: {
          action_count?: number | null
          action_type: string
          admin_user_id: string
          id?: string
          window_start?: string | null
        }
        Update: {
          action_count?: number | null
          action_type?: string
          admin_user_id?: string
          id?: string
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_rate_limits_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_rate_limits_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      application_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          function_name: string | null
          id: string
          label: string | null
          level: Database["public"]["Enums"]["log_level"]
          message: string
          metadata: Json | null
          request_id: string | null
          source: string | null
          stack_trace: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          function_name?: string | null
          id?: string
          label?: string | null
          level?: Database["public"]["Enums"]["log_level"]
          message: string
          metadata?: Json | null
          request_id?: string | null
          source?: string | null
          stack_trace?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          function_name?: string | null
          id?: string
          label?: string | null
          level?: Database["public"]["Enums"]["log_level"]
          message?: string
          metadata?: Json | null
          request_id?: string | null
          source?: string | null
          stack_trace?: string | null
          timestamp?: string
          user_id?: string | null
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
      battle_pass_progress: {
        Row: {
          claimed_rewards: string[] | null
          created_at: string | null
          current_tier: number | null
          current_xp: number | null
          id: string
          is_premium: boolean | null
          purchased_at: string | null
          season_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          claimed_rewards?: string[] | null
          created_at?: string | null
          current_tier?: number | null
          current_xp?: number | null
          id?: string
          is_premium?: boolean | null
          purchased_at?: string | null
          season_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          claimed_rewards?: string[] | null
          created_at?: string | null
          current_tier?: number | null
          current_xp?: number | null
          id?: string
          is_premium?: boolean | null
          purchased_at?: string | null
          season_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      battle_pass_seasons: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean | null
          name: string
          premium_price: number | null
          season_id: string
          starts_at: string
          tiers: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean | null
          name: string
          premium_price?: number | null
          season_id: string
          starts_at: string
          tiers?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          premium_price?: number | null
          season_id?: string
          starts_at?: string
          tiers?: Json
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_seasons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_seasons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      club_challenges: {
        Row: {
          challenge_type: string
          club_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          description: string | null
          emoji: string | null
          ends_at: string
          id: string
          name: string
          reward_badge: string | null
          reward_coins: number
          starts_at: string
          target_value: number
        }
        Insert: {
          challenge_type: string
          club_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          description?: string | null
          emoji?: string | null
          ends_at: string
          id?: string
          name: string
          reward_badge?: string | null
          reward_coins: number
          starts_at: string
          target_value: number
        }
        Update: {
          challenge_type?: string
          club_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          description?: string | null
          emoji?: string | null
          ends_at?: string
          id?: string
          name?: string
          reward_badge?: string | null
          reward_coins?: number
          starts_at?: string
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_challenges_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_invites: {
        Row: {
          club_id: string
          created_at: string | null
          expires_at: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string | null
        }
        Insert: {
          club_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_invites_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
          weekly_contribution: number | null
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
          weekly_contribution?: number | null
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
          weekly_contribution?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          name: string
          owner_id: string
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          name: string
          owner_id: string
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          owner_id?: string
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_challenge_invites: {
        Row: {
          challenge_data: Json
          challenge_template_id: string
          expires_at: string
          id: string
          recipient_id: string
          responded_at: string | null
          sender_id: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          challenge_data: Json
          challenge_template_id: string
          expires_at: string
          id?: string
          recipient_id: string
          responded_at?: string | null
          sender_id: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          challenge_data?: Json
          challenge_template_id?: string
          expires_at?: string
          id?: string
          recipient_id?: string
          responded_at?: string | null
          sender_id?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      coop_challenges: {
        Row: {
          challenge_data: Json
          challenge_template_id: string
          created_at: string | null
          expires_at: string
          id: string
          initiator_id: string
          initiator_progress: number | null
          initiator_reward_claimed: boolean | null
          partner_id: string
          partner_progress: number | null
          partner_reward_claimed: boolean | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          challenge_data: Json
          challenge_template_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          initiator_id: string
          initiator_progress?: number | null
          initiator_reward_claimed?: boolean | null
          partner_id: string
          partner_progress?: number | null
          partner_reward_claimed?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          challenge_data?: Json
          challenge_template_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          initiator_id?: string
          initiator_progress?: number | null
          initiator_reward_claimed?: boolean | null
          partner_id?: string
          partner_progress?: number | null
          partner_reward_claimed?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
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
      daily_objectives_progress: {
        Row: {
          bonus_claimed: boolean | null
          created_at: string | null
          id: string
          last_refreshed: string
          objectives: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_claimed?: boolean | null
          created_at?: string | null
          id?: string
          last_refreshed?: string
          objectives?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_claimed?: boolean | null
          created_at?: string | null
          id?: string
          last_refreshed?: string
          objectives?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      edge_function_rate_limits: {
        Row: {
          function_name: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          function_name: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          function_name?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
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
      game_config: {
        Row: {
          category: string | null
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "game_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "game_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
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
      player_badges: {
        Row: {
          badge_id: string
          created_at: string | null
          id: string
          is_displayed: boolean | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          id?: string
          is_displayed?: boolean | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          id?: string
          is_displayed?: boolean | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_friend"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_portrait_credits: {
        Row: {
          created_at: string | null
          credits_remaining: number
          id: string
          last_purchase_at: string | null
          total_purchased: number
          total_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number
          id?: string
          last_purchase_at?: string | null
          total_purchased?: number
          total_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number
          id?: string
          last_purchase_at?: string | null
          total_purchased?: number
          total_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_portrait_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_portrait_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_progress: {
        Row: {
          best_prize: string | null
          completed_sets: string[] | null
          created_at: string | null
          id: string
          last_spin_date: string | null
          player_title: string | null
          spins_today: number | null
          total_spins: number | null
          unlocked_milestones: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_prize?: string | null
          completed_sets?: string[] | null
          created_at?: string | null
          id?: string
          last_spin_date?: string | null
          player_title?: string | null
          spins_today?: number | null
          total_spins?: number | null
          unlocked_milestones?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_prize?: string | null
          completed_sets?: string[] | null
          created_at?: string | null
          id?: string
          last_spin_date?: string | null
          player_title?: string | null
          spins_today?: number | null
          total_spins?: number | null
          unlocked_milestones?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_emoji: string | null
          created_at: string | null
          display_badges: string[] | null
          display_name: string | null
          email: string | null
          id: string
          profile_frame: string | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_badges?: string[] | null
          display_name?: string | null
          email?: string | null
          id: string
          profile_frame?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_badges?: string[] | null
          display_name?: string | null
          email?: string | null
          id?: string
          profile_frame?: string | null
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
      retired_cats: {
        Row: {
          achievements: string[]
          cat_data: Json
          created_at: string | null
          id: string
          legacy_bonus: number | null
          legacy_trait: string
          retired_at_day: number
          retired_date: string | null
          user_id: string
        }
        Insert: {
          achievements?: string[]
          cat_data: Json
          created_at?: string | null
          id?: string
          legacy_bonus?: number | null
          legacy_trait: string
          retired_at_day: number
          retired_date?: string | null
          user_id: string
        }
        Update: {
          achievements?: string[]
          cat_data?: Json
          created_at?: string | null
          id?: string
          legacy_bonus?: number | null
          legacy_trait?: string
          retired_at_day?: number
          retired_date?: string | null
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
      save_snapshots: {
        Row: {
          cat_count: number
          cat_names: string[]
          created_at: string | null
          day: number
          game_state_hash: string
          id: string
          money: number
          snapshot_type: string
          user_id: string
        }
        Insert: {
          cat_count: number
          cat_names: string[]
          created_at?: string | null
          day: number
          game_state_hash: string
          id?: string
          money: number
          snapshot_type: string
          user_id: string
        }
        Update: {
          cat_count?: number
          cat_names?: string[]
          created_at?: string | null
          day?: number
          game_state_hash?: string
          id?: string
          money?: number
          snapshot_type?: string
          user_id?: string
        }
        Relationships: []
      }
      security_scan_history: {
        Row: {
          created_at: string | null
          errors: number
          id: string
          infos: number
          issues: Json
          scan_duration_ms: number
          scanned_at: string
          scanned_by: string | null
          security_grade: string
          security_score: number
          total_issues: number
          warnings: number
        }
        Insert: {
          created_at?: string | null
          errors?: number
          id?: string
          infos?: number
          issues?: Json
          scan_duration_ms: number
          scanned_at?: string
          scanned_by?: string | null
          security_grade?: string
          security_score?: number
          total_issues?: number
          warnings?: number
        }
        Update: {
          created_at?: string | null
          errors?: number
          id?: string
          infos?: number
          issues?: Json
          scan_duration_ms?: number
          scanned_at?: string
          scanned_by?: string | null
          security_grade?: string
          security_score?: number
          total_issues?: number
          warnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "security_scan_history_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_scan_history_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_health_log: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string
          issue_summary: Json | null
          run_at: string
          saves_checked: number
          saves_with_issues: number
          total_issues: number
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          issue_summary?: Json | null
          run_at?: string
          saves_checked?: number
          saves_with_issues?: number
          total_issues?: number
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          issue_summary?: Json | null
          run_at?: string
          saves_checked?: number
          saves_with_issues?: number
          total_issues?: number
        }
        Relationships: []
      }
      test_reports: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          environment: string | null
          failed: number
          id: string
          passed: number
          results: Json
          run_by: string
          skipped: number
          total_tests: number
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          failed?: number
          id?: string
          passed?: number
          results?: Json
          run_by: string
          skipped?: number
          total_tests?: number
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          failed?: number
          id?: string
          passed?: number
          results?: Json
          run_by?: string
          skipped?: number
          total_tests?: number
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
      tutorial_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          from_step: number | null
          id: string
          metadata: Json | null
          section: string | null
          session_id: string
          step_id: string | null
          step_index: number | null
          time_on_step_ms: number | null
          to_step: number | null
          total_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          from_step?: number | null
          id?: string
          metadata?: Json | null
          section?: string | null
          session_id: string
          step_id?: string | null
          step_index?: number | null
          time_on_step_ms?: number | null
          to_step?: number | null
          total_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          from_step?: number | null
          id?: string
          metadata?: Json | null
          section?: string | null
          session_id?: string
          step_id?: string | null
          step_index?: number | null
          time_on_step_ms?: number | null
          to_step?: number | null
          total_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      public_leaderboard: {
        Row: {
          achievements_unlocked: number | null
          avatar_emoji: string | null
          display_name: string | null
          highest_cat_grade: number | null
          total_cats_owned: number | null
          total_kittens_bred: number | null
          total_money_earned: number | null
          total_show_wins: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_emoji: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: { Args: { _user_id: string }; Returns: boolean }
      get_auth_config_status: { Args: never; Returns: Json }
      get_cron_job_history: {
        Args: { limit_count?: number }
        Returns: {
          end_time: string
          jobid: number
          jobname: string
          return_message: string
          runid: number
          start_time: string
          status: string
        }[]
      }
      get_cron_job_trends: {
        Args: { days_back?: number }
        Returns: {
          avg_duration_ms: number
          date: string
          failed: number
          jobname: string
          successful: number
          total_runs: number
        }[]
      }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          database: string
          jobid: number
          jobname: string
          nodename: string
          schedule: string
        }[]
      }
      get_dangerous_public_policies: {
        Args: never
        Returns: {
          cmd: string
          policyname: string
          tablename: string
        }[]
      }
      get_permissive_policies: {
        Args: never
        Returns: {
          cmd: string
          policyname: string
          tablename: string
        }[]
      }
      get_tables_without_admin_access: {
        Args: never
        Returns: {
          tablename: string
        }[]
      }
      get_tables_without_rls: {
        Args: never
        Returns: {
          tablename: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_auth_attempt_secure: {
        Args: {
          _attempt_type: string
          _email: string
          _error_message?: string
          _metadata?: Json
          _success: boolean
        }
        Returns: undefined
      }
      log_client_error_secure: {
        Args: {
          _component_name?: string
          _error_message: string
          _error_stack?: string
          _error_type: string
          _metadata?: Json
          _route?: string
          _user_agent?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      log_level:
        | "error"
        | "warn"
        | "info"
        | "http"
        | "verbose"
        | "debug"
        | "silly"
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
      log_level: ["error", "warn", "info", "http", "verbose", "debug", "silly"],
    },
  },
} as const
