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
      b2b_extractions: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          extraction_name: string
          filters: Json | null
          id: string
          location: string | null
          result_count: number | null
          results: Json | null
          search_query: string | null
          source: string
          source_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          extraction_name: string
          filters?: Json | null
          id?: string
          location?: string | null
          result_count?: number | null
          results?: Json | null
          search_query?: string | null
          source: string
          source_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          extraction_name?: string
          filters?: Json | null
          id?: string
          location?: string | null
          result_count?: number | null
          results?: Json | null
          search_query?: string | null
          source?: string
          source_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          anti_spam_settings: Json | null
          campaign_name: string
          completed_at: string | null
          content: string | null
          content_type: string
          created_at: string
          failed_count: number | null
          id: string
          recipients: Json | null
          sent_count: number | null
          started_at: string | null
          status: string
          subject: string
          template_id: string | null
          total_recipients: number | null
          user_id: string
        }
        Insert: {
          anti_spam_settings?: Json | null
          campaign_name: string
          completed_at?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          failed_count?: number | null
          id?: string
          recipients?: Json | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          total_recipients?: number | null
          user_id: string
        }
        Update: {
          anti_spam_settings?: Json | null
          campaign_name?: string
          completed_at?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          failed_count?: number | null
          id?: string
          recipients?: Json | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          total_recipients?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          content_type: string
          created_at: string
          id: string
          subject: string
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          id?: string
          subject: string
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          subject?: string
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_accounts: {
        Row: {
          account_email: string | null
          account_name: string
          cookies: string | null
          created_at: string
          id: string
          proxy_host: string | null
          proxy_password: string | null
          proxy_port: number | null
          proxy_username: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_email?: string | null
          account_name: string
          cookies?: string | null
          created_at?: string
          id?: string
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_email?: string | null
          account_name?: string
          cookies?: string | null
          created_at?: string
          id?: string
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_extractions: {
        Row: {
          completed_at: string | null
          created_at: string
          extraction_type: string
          id: string
          result_count: number | null
          results: Json | null
          source_id: string | null
          source_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          extraction_type: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source_id?: string | null
          source_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          extraction_type?: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source_id?: string | null
          source_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_groups: {
        Row: {
          account_id: string | null
          can_post: boolean | null
          created_at: string
          group_id: string | null
          group_name: string
          group_url: string | null
          has_rules: boolean | null
          id: string
          interests: string[] | null
          joined_at: string | null
          member_count: number | null
          post_restrictions: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          can_post?: boolean | null
          created_at?: string
          group_id?: string | null
          group_name: string
          group_url?: string | null
          has_rules?: boolean | null
          id?: string
          interests?: string[] | null
          joined_at?: string | null
          member_count?: number | null
          post_restrictions?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          can_post?: boolean | null
          created_at?: string
          group_id?: string | null
          group_name?: string
          group_url?: string | null
          has_rules?: boolean | null
          id?: string
          interests?: string[] | null
          joined_at?: string | null
          member_count?: number | null
          post_restrictions?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_groups_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "facebook_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_messages: {
        Row: {
          account_id: string | null
          completed_at: string | null
          content: string | null
          created_at: string
          failed_count: number | null
          id: string
          media_urls: string[] | null
          message_type: string
          recipients: string[] | null
          sent_count: number | null
          started_at: string | null
          status: string
          target_type: string
          total_recipients: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_urls?: string[] | null
          message_type?: string
          recipients?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          target_type?: string
          total_recipients?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_urls?: string[] | null
          message_type?: string
          recipients?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          target_type?: string
          total_recipients?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "facebook_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_publications: {
        Row: {
          account_id: string | null
          content: string | null
          created_at: string
          failure_count: number | null
          id: string
          publication_type: string
          status: string
          success_count: number | null
          target_ids: string[] | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          content?: string | null
          created_at?: string
          failure_count?: number | null
          id?: string
          publication_type: string
          status?: string
          success_count?: number | null
          target_ids?: string[] | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          content?: string | null
          created_at?: string
          failure_count?: number | null
          id?: string
          publication_type?: string
          status?: string
          success_count?: number | null
          target_ids?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_publications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "facebook_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_publications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_social_actions: {
        Row: {
          account_id: string | null
          action_type: string
          content: string | null
          created_at: string
          error_message: string | null
          executed_at: string | null
          id: string
          status: string
          target_id: string | null
          target_name: string | null
          target_url: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action_type: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string
          target_id?: string | null
          target_name?: string | null
          target_url?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          action_type?: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string
          target_id?: string | null
          target_name?: string | null
          target_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_social_actions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "facebook_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_social_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_accounts: {
        Row: {
          account_name: string | null
          created_at: string
          daily_dm_count: number | null
          daily_follow_count: number | null
          daily_unfollow_count: number | null
          followers_count: number | null
          following_count: number | null
          id: string
          last_action_at: string | null
          proxy_host: string | null
          proxy_password: string | null
          proxy_port: number | null
          proxy_username: string | null
          session_data: string | null
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          account_name?: string | null
          created_at?: string
          daily_dm_count?: number | null
          daily_follow_count?: number | null
          daily_unfollow_count?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          last_action_at?: string | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          account_name?: string | null
          created_at?: string
          daily_dm_count?: number | null
          daily_follow_count?: number | null
          daily_unfollow_count?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          last_action_at?: string | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_campaigns: {
        Row: {
          account_id: string | null
          campaign_name: string
          campaign_type: string
          completed_at: string | null
          content: string | null
          created_at: string
          failed_count: number | null
          id: string
          media_url: string | null
          message_type: string
          recipients: string[] | null
          sent_count: number | null
          started_at: string | null
          status: string
          total_recipients: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_name: string
          campaign_type: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_name?: string
          campaign_type?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_extractions: {
        Row: {
          completed_at: string | null
          created_at: string
          extraction_type: string
          id: string
          result_count: number | null
          results: Json | null
          source: string | null
          source_username: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          extraction_type: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_username?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          extraction_type?: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_username?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_follows: {
        Row: {
          account_id: string | null
          action_type: string
          created_at: string
          executed_at: string | null
          id: string
          status: string
          target_username: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action_type: string
          created_at?: string
          executed_at?: string | null
          id?: string
          status?: string
          target_username: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          action_type?: string
          created_at?: string
          executed_at?: string | null
          id?: string
          status?: string
          target_username?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_follows_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          created_at: string
          device_fingerprint: string | null
          expires_at: string | null
          id: string
          license_key: string
          status: Database["public"]["Enums"]["license_status"]
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string | null
          id?: string
          license_key: string
          status?: Database["public"]["Enums"]["license_status"]
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string | null
          id?: string
          license_key?: string
          status?: Database["public"]["Enums"]["license_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_accounts: {
        Row: {
          account_name: string | null
          connections_sent_today: number | null
          created_at: string
          email: string
          id: string
          last_action_at: string | null
          messages_sent_today: number | null
          proxy_host: string | null
          proxy_password: string | null
          proxy_port: number | null
          proxy_username: string | null
          session_data: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          connections_sent_today?: number | null
          created_at?: string
          email: string
          id?: string
          last_action_at?: string | null
          messages_sent_today?: number | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          connections_sent_today?: number | null
          created_at?: string
          email?: string
          id?: string
          last_action_at?: string | null
          messages_sent_today?: number | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_campaigns: {
        Row: {
          account_id: string | null
          campaign_name: string
          campaign_type: string
          completed_at: string | null
          content: string | null
          created_at: string
          failed_count: number | null
          id: string
          recipients: string[] | null
          sending_mode: string
          sent_count: number | null
          started_at: string | null
          status: string
          total_recipients: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_name: string
          campaign_type?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          recipients?: string[] | null
          sending_mode?: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_name?: string
          campaign_type?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          recipients?: string[] | null
          sending_mode?: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "linkedin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_connections: {
        Row: {
          account_id: string | null
          created_at: string
          id: string
          note: string | null
          sent_at: string | null
          status: string
          target_name: string | null
          target_profile_url: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          sent_at?: string | null
          status?: string
          target_name?: string | null
          target_profile_url: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          sent_at?: string | null
          status?: string
          target_name?: string | null
          target_profile_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_connections_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "linkedin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_extractions: {
        Row: {
          completed_at: string | null
          created_at: string
          extraction_type: string
          filters: Json | null
          id: string
          result_count: number | null
          results: Json | null
          source: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          extraction_type: string
          filters?: Json | null
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          extraction_type?: string
          filters?: Json | null
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_accounts: {
        Row: {
          account_name: string | null
          api_hash: string | null
          api_id: string | null
          created_at: string
          groups_joined_today: number | null
          id: string
          last_action_at: string | null
          messages_sent_today: number | null
          phone_number: string
          proxy_host: string | null
          proxy_password: string | null
          proxy_port: number | null
          proxy_username: string | null
          session_data: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          api_hash?: string | null
          api_id?: string | null
          created_at?: string
          groups_joined_today?: number | null
          id?: string
          last_action_at?: string | null
          messages_sent_today?: number | null
          phone_number: string
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          api_hash?: string | null
          api_id?: string | null
          created_at?: string
          groups_joined_today?: number | null
          id?: string
          last_action_at?: string | null
          messages_sent_today?: number | null
          phone_number?: string
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_campaigns: {
        Row: {
          account_id: string | null
          campaign_name: string
          completed_at: string | null
          content: string | null
          created_at: string
          failed_count: number | null
          id: string
          media_url: string | null
          message_type: string
          recipients: string[] | null
          sending_mode: string
          sent_count: number | null
          started_at: string | null
          status: string
          target_type: string
          total_recipients: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_name: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          sending_mode?: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          target_type?: string
          total_recipients?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_name?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          sending_mode?: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          target_type?: string
          total_recipients?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "telegram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_extractions: {
        Row: {
          completed_at: string | null
          created_at: string
          extraction_type: string
          id: string
          result_count: number | null
          results: Json | null
          source: string | null
          source_group_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          extraction_type: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_group_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          extraction_type?: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_group_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_groups: {
        Row: {
          account_id: string | null
          created_at: string
          group_id: string | null
          group_name: string
          group_type: string | null
          id: string
          invite_link: string | null
          is_public: boolean | null
          joined_at: string | null
          member_count: number | null
          status: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          group_id?: string | null
          group_name: string
          group_type?: string | null
          id?: string
          invite_link?: string | null
          is_public?: boolean | null
          joined_at?: string | null
          member_count?: number | null
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          group_id?: string | null
          group_name?: string
          group_type?: string | null
          id?: string
          invite_link?: string | null
          is_public?: boolean | null
          joined_at?: string | null
          member_count?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_groups_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "telegram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_accounts: {
        Row: {
          account_name: string | null
          created_at: string
          daily_dm_count: number | null
          daily_follow_count: number | null
          daily_unfollow_count: number | null
          followers_count: number | null
          following_count: number | null
          id: string
          last_action_at: string | null
          likes_count: number | null
          proxy_host: string | null
          proxy_password: string | null
          proxy_port: number | null
          proxy_username: string | null
          session_data: string | null
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          account_name?: string | null
          created_at?: string
          daily_dm_count?: number | null
          daily_follow_count?: number | null
          daily_unfollow_count?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          last_action_at?: string | null
          likes_count?: number | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          account_name?: string | null
          created_at?: string
          daily_dm_count?: number | null
          daily_follow_count?: number | null
          daily_unfollow_count?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          last_action_at?: string | null
          likes_count?: number | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_campaigns: {
        Row: {
          account_id: string | null
          campaign_name: string
          campaign_type: string
          completed_at: string | null
          content: string | null
          created_at: string
          failed_count: number | null
          id: string
          media_url: string | null
          message_type: string
          recipients: string[] | null
          sent_count: number | null
          started_at: string | null
          status: string
          total_recipients: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_name: string
          campaign_type: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_name?: string
          campaign_type?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "tiktok_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiktok_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_extractions: {
        Row: {
          completed_at: string | null
          country_code: string | null
          created_at: string
          extraction_type: string
          hashtag: string | null
          id: string
          result_count: number | null
          results: Json | null
          source: string | null
          source_username: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          country_code?: string | null
          created_at?: string
          extraction_type: string
          hashtag?: string | null
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_username?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          country_code?: string | null
          created_at?: string
          extraction_type?: string
          hashtag?: string | null
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_username?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_follows: {
        Row: {
          account_id: string | null
          action_type: string
          created_at: string
          executed_at: string | null
          id: string
          status: string
          target_username: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action_type: string
          created_at?: string
          executed_at?: string | null
          id?: string
          status?: string
          target_username: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          action_type?: string
          created_at?: string
          executed_at?: string | null
          id?: string
          status?: string
          target_username?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_follows_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "tiktok_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiktok_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_accounts: {
        Row: {
          account_name: string | null
          created_at: string
          id: string
          last_message_at: string | null
          messages_sent_today: number | null
          phone_number: string
          proxy_host: string | null
          proxy_password: string | null
          proxy_port: number | null
          proxy_username: string | null
          session_data: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          messages_sent_today?: number | null
          phone_number: string
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          messages_sent_today?: number | null
          phone_number?: string
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          session_data?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_auto_replies: {
        Row: {
          account_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          response_content: string
          response_media_url: string | null
          trigger_count: number | null
          trigger_keywords: string[] | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          response_content: string
          response_media_url?: string | null
          trigger_count?: number | null
          trigger_keywords?: string[] | null
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          response_content?: string
          response_media_url?: string | null
          trigger_count?: number | null
          trigger_keywords?: string[] | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_auto_replies_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_auto_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          account_id: string | null
          campaign_name: string
          completed_at: string | null
          content: string | null
          created_at: string
          failed_count: number | null
          id: string
          media_url: string | null
          message_type: string
          recipients: string[] | null
          sending_mode: string
          sent_count: number | null
          started_at: string | null
          status: string
          total_recipients: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_name: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type: string
          recipients?: string[] | null
          sending_mode?: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_name?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          sending_mode?: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          created_at: string
          id: string
          last_messaged_at: string | null
          message_count: number | null
          name: string | null
          notes: string | null
          phone_number: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_messaged_at?: string | null
          message_count?: number | null
          name?: string | null
          notes?: string | null
          phone_number: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_messaged_at?: string | null
          message_count?: number | null
          name?: string | null
          notes?: string | null
          phone_number?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_discovered_groups: {
        Row: {
          category: string | null
          description: string | null
          discovered_at: string
          group_name: string | null
          id: string
          invite_link: string
          joined_at: string | null
          member_estimate: number | null
          source_platform: string
          source_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          discovered_at?: string
          group_name?: string | null
          id?: string
          invite_link: string
          joined_at?: string | null
          member_estimate?: number | null
          source_platform: string
          source_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          category?: string | null
          description?: string | null
          discovered_at?: string
          group_name?: string | null
          id?: string
          invite_link?: string
          joined_at?: string | null
          member_estimate?: number | null
          source_platform?: string
          source_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_discovered_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_extractions: {
        Row: {
          completed_at: string | null
          created_at: string
          extraction_type: string
          id: string
          result_count: number | null
          results: Json | null
          source: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          extraction_type: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          extraction_type?: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          account_id: string | null
          created_at: string
          group_id: string | null
          group_name: string
          id: string
          invite_link: string | null
          member_count: number | null
          status: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          group_id?: string | null
          group_name: string
          id?: string
          invite_link?: string | null
          member_count?: number | null
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          group_id?: string | null
          group_name?: string
          id?: string
          invite_link?: string | null
          member_count?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_groups_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_scheduled: {
        Row: {
          account_id: string | null
          campaign_name: string
          content: string | null
          created_at: string
          executed_at: string | null
          failed_count: number | null
          id: string
          media_url: string | null
          message_type: string
          recipients: string[] | null
          scheduled_at: string
          sending_mode: string
          sent_count: number | null
          status: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_name: string
          content?: string | null
          created_at?: string
          executed_at?: string | null
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          scheduled_at: string
          sending_mode?: string
          sent_count?: number | null
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_name?: string
          content?: string | null
          created_at?: string
          executed_at?: string | null
          failed_count?: number | null
          id?: string
          media_url?: string | null
          message_type?: string
          recipients?: string[] | null
          scheduled_at?: string
          sending_mode?: string
          sent_count?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_scheduled_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_scheduled_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      x_accounts: {
        Row: {
          access_token: string | null
          access_token_secret: string | null
          account_name: string | null
          api_key: string | null
          api_secret: string | null
          created_at: string
          daily_follow_count: number | null
          daily_like_count: number | null
          daily_tweet_count: number | null
          followers_count: number | null
          following_count: number | null
          id: string
          last_action_at: string | null
          proxy_host: string | null
          proxy_password: string | null
          proxy_port: number | null
          proxy_username: string | null
          status: string
          tweets_count: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          access_token?: string | null
          access_token_secret?: string | null
          account_name?: string | null
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          daily_follow_count?: number | null
          daily_like_count?: number | null
          daily_tweet_count?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          last_action_at?: string | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          status?: string
          tweets_count?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          access_token?: string | null
          access_token_secret?: string | null
          account_name?: string | null
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          daily_follow_count?: number | null
          daily_like_count?: number | null
          daily_tweet_count?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          last_action_at?: string | null
          proxy_host?: string | null
          proxy_password?: string | null
          proxy_port?: number | null
          proxy_username?: string | null
          status?: string
          tweets_count?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "x_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      x_extractions: {
        Row: {
          completed_at: string | null
          country_code: string | null
          created_at: string
          extraction_type: string
          id: string
          result_count: number | null
          results: Json | null
          source: string | null
          source_username: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          country_code?: string | null
          created_at?: string
          extraction_type: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_username?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          country_code?: string | null
          created_at?: string
          extraction_type?: string
          id?: string
          result_count?: number | null
          results?: Json | null
          source?: string | null
          source_username?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "x_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      x_interactions: {
        Row: {
          account_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          interaction_type: string
          status: string
          target_id: string | null
          target_tweet_id: string | null
          target_username: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          interaction_type: string
          status?: string
          target_id?: string | null
          target_tweet_id?: string | null
          target_username?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          interaction_type?: string
          status?: string
          target_id?: string | null
          target_tweet_id?: string | null
          target_username?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "x_interactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "x_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "x_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      x_trends: {
        Row: {
          country_code: string
          fetched_at: string
          id: string
          trends: Json | null
          user_id: string
        }
        Insert: {
          country_code: string
          fetched_at?: string
          id?: string
          trends?: Json | null
          user_id: string
        }
        Update: {
          country_code?: string
          fetched_at?: string
          id?: string
          trends?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "x_trends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      x_tweets: {
        Row: {
          account_id: string | null
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          tweet_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tweet_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tweet_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "x_tweets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "x_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "x_tweets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      license_status: "active" | "inactive" | "expired" | "revoked"
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
      license_status: ["active", "inactive", "expired", "revoked"],
    },
  },
} as const
