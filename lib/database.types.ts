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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      calendar_connections: {
        Row: {
          access_token_ciphertext: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_synced_at: string | null
          provider: string
          provider_account_id: string | null
          refresh_token_ciphertext: string | null
          scopes: string[]
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_ciphertext?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          provider_account_id?: string | null
          refresh_token_ciphertext?: string | null
          scopes?: string[]
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_ciphertext?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          provider_account_id?: string | null
          refresh_token_ciphertext?: string | null
          scopes?: string[]
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: Json
          created_at: string
          description: string | null
          ends_at: string | null
          hidden_at: string | null
          id: string
          location: string | null
          meeting_url: string | null
          provider: string
          provider_event_id: string
          raw_payload: Json | null
          starts_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: Json
          created_at?: string
          description?: string | null
          ends_at?: string | null
          hidden_at?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          provider?: string
          provider_event_id: string
          raw_payload?: Json | null
          starts_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: Json
          created_at?: string
          description?: string | null
          ends_at?: string | null
          hidden_at?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          provider?: string
          provider_event_id?: string
          raw_payload?: Json | null
          starts_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      note_chunks: {
        Row: {
          content: string
          content_tsv: unknown
          created_at: string
          embedding: string | null
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          content: string
          content_tsv?: unknown
          created_at?: string
          embedding?: string | null
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          content?: string
          content_tsv?: unknown
          created_at?: string
          embedding?: string | null
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_chunks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_entities: {
        Row: {
          created_at: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          normalized_value: string | null
          note_id: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          normalized_value?: string | null
          note_id: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          normalized_value?: string | null
          note_id?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_entities_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          audio_deleted_at: string | null
          audio_storage_path: string | null
          calendar_event_id: string | null
          cleaned_note: string | null
          cleaned_text: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["note_kind"]
          note_type: Database["public"]["Enums"]["note_kind"]
          processed_at: string | null
          processing_error: string | null
          processing_status: Database["public"]["Enums"]["processing_status"]
          raw_transcript: string | null
          summary: string | null
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_deleted_at?: string | null
          audio_storage_path?: string | null
          calendar_event_id?: string | null
          cleaned_note?: string | null
          cleaned_text?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["note_kind"]
          note_type?: Database["public"]["Enums"]["note_kind"]
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          raw_transcript?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_deleted_at?: string | null
          audio_storage_path?: string | null
          calendar_event_id?: string | null
          cleaned_note?: string | null
          cleaned_text?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["note_kind"]
          note_type?: Database["public"]["Enums"]["note_kind"]
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          raw_transcript?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      open_loops: {
        Row: {
          assignee: string | null
          created_at: string
          description: string
          due_hint: string | null
          id: string
          note_id: string | null
          source_note_id: string
          status: Database["public"]["Enums"]["open_loop_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          description: string
          due_hint?: string | null
          id?: string
          note_id?: string | null
          source_note_id: string
          status?: Database["public"]["Enums"]["open_loop_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          description?: string
          due_hint?: string | null
          id?: string
          note_id?: string | null
          source_note_id?: string
          status?: Database["public"]["Enums"]["open_loop_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_loops_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_loops_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          id: string
          job_type: string
          note_id: string | null
          run_after: string
          status: Database["public"]["Enums"]["processing_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          job_type: string
          note_id?: string | null
          run_after?: string
          status?: Database["public"]["Enums"]["processing_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          job_type?: string
          note_id?: string | null
          run_after?: string
          status?: Database["public"]["Enums"]["processing_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          keep_raw_audio: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          keep_raw_audio?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          keep_raw_audio?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      entity_type: "person" | "company" | "project" | "topic"
      note_kind: "meeting_note" | "meeting_prep" | "free_note"
      open_loop_status: "open" | "done" | "dismissed"
      processing_status: "pending" | "processing" | "processed" | "failed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      entity_type: ["person", "company", "project", "topic"],
      note_kind: ["meeting_note", "meeting_prep", "free_note"],
      open_loop_status: ["open", "done", "dismissed"],
      processing_status: ["pending", "processing", "processed", "failed"],
    },
  },
} as const
