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
      applications: {
        Row: {
          created_at: string
          created_by: string
          decision_notes: string | null
          governance_json: Json | null
          id: string
          linked_business_id: string | null
          linked_property_id: string | null
          payload_json: Json
          status: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          decision_notes?: string | null
          governance_json?: Json | null
          id?: string
          linked_business_id?: string | null
          linked_property_id?: string | null
          payload_json?: Json
          status?: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          decision_notes?: string | null
          governance_json?: Json | null
          id?: string
          linked_business_id?: string | null
          linked_property_id?: string | null
          payload_json?: Json
          status?: Database["public"]["Enums"]["application_status"]
          type?: Database["public"]["Enums"]["application_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_linked_business_id_fkey"
            columns: ["linked_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_linked_property_id_fkey"
            columns: ["linked_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          business_id: string
          created_at: string
          end_at: string | null
          id: string
          property_id: string
          start_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          end_at?: string | null
          id?: string
          property_id: string
          start_at: string
        }
        Update: {
          business_id?: string
          created_at?: string
          end_at?: string | null
          id?: string
          property_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          context_json: Json
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          context_json?: Json
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          context_json?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      business_memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_primary_contact: boolean
          person_id: string
          role: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          person_id: string
          role: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          discord_url: string | null
          employee_db_url: string | null
          governance_json: Json
          id: string
          industry: string | null
          logo_storage_path: string | null
          management_type: Database["public"]["Enums"]["management_type"] | null
          name: string
          purpose: string | null
          status: Database["public"]["Enums"]["business_status"]
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_url?: string | null
          employee_db_url?: string | null
          governance_json?: Json
          id?: string
          industry?: string | null
          logo_storage_path?: string | null
          management_type?:
            | Database["public"]["Enums"]["management_type"]
            | null
          name: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          type: Database["public"]["Enums"]["business_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_url?: string | null
          employee_db_url?: string | null
          governance_json?: Json
          id?: string
          industry?: string | null
          logo_storage_path?: string | null
          management_type?:
            | Database["public"]["Enums"]["management_type"]
            | null
          name?: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          created_at: string
          discord_id: string | null
          discord_username: string | null
          first_name: string | null
          id: string
          last_name: string | null
          roblox_user_id: string | null
          roblox_username: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          roblox_user_id?: string | null
          roblox_username?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          roblox_user_id?: string | null
          roblox_username?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      permits: {
        Row: {
          created_at: string
          effective_at: string | null
          expires_at: string | null
          holder_business_id: string
          id: string
          status: Database["public"]["Enums"]["permit_status"]
          type: Database["public"]["Enums"]["permit_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_at?: string | null
          expires_at?: string | null
          holder_business_id: string
          id?: string
          status?: Database["public"]["Enums"]["permit_status"]
          type: Database["public"]["Enums"]["permit_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_at?: string | null
          expires_at?: string | null
          holder_business_id?: string
          id?: string
          status?: Database["public"]["Enums"]["permit_status"]
          type?: Database["public"]["Enums"]["permit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permits_holder_business_id_fkey"
            columns: ["holder_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          current_business_id: string | null
          id: string
          name: string | null
          notes: string | null
          photo_storage_path: string | null
          status: Database["public"]["Enums"]["property_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          current_business_id?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          photo_storage_path?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          current_business_id?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          photo_storage_path?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_current_business_id_fkey"
            columns: ["current_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      regulations: {
        Row: {
          body_markdown: string
          created_at: string
          effective_at: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["regulation_status"]
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown: string
          created_at?: string
          effective_at?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["regulation_status"]
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          effective_at?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["regulation_status"]
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          bureau: Database["public"]["Enums"]["bureau"]
          created_at: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          bureau: Database["public"]["Enums"]["bureau"]
          created_at?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          bureau?: Database["public"]["Enums"]["bureau"]
          created_at?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      tipline_reports: {
        Row: {
          assigned_to: string | null
          business_name: string | null
          description: string
          evidence_url: string | null
          id: string
          status: Database["public"]["Enums"]["tipline_status"]
          submitted_at: string
          submitted_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_name?: string | null
          description: string
          evidence_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tipline_status"]
          submitted_at?: string
          submitted_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_name?: string | null
          description?: string
          evidence_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tipline_status"]
          submitted_at?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipline_reports_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff_in_bureau: {
        Args: { target: Database["public"]["Enums"]["bureau"] }
        Returns: boolean
      }
    }
    Enums: {
      application_status:
        | "received"
        | "under_review"
        | "need_more_info"
        | "approved"
        | "rejected"
      application_type:
        | "business_new"
        | "property"
        | "permit"
        | "dev_support"
        | "amend_governance"
      bureau: "licensing" | "property" | "compliance"
      business_status: "active" | "suspended" | "closed"
      business_type:
        | "corporation"
        | "llc"
        | "gp"
        | "lp"
        | "llp"
        | "sole_prop"
        | "nonprofit_corp"
      management_type: "member_managed" | "manager_managed" | "board_managed"
      permit_status: "pending" | "issued" | "revoked" | "expired"
      permit_type: "standard" | "event" | "temporary" | "renewal"
      property_status: "available" | "pending" | "occupied"
      regulation_status: "draft" | "published" | "archived"
      staff_role: "staff" | "admin"
      tipline_status: "received" | "triage" | "in_review" | "closed"
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
      application_status: [
        "received",
        "under_review",
        "need_more_info",
        "approved",
        "rejected",
      ],
      application_type: [
        "business_new",
        "property",
        "permit",
        "dev_support",
        "amend_governance",
      ],
      bureau: ["licensing", "property", "compliance"],
      business_status: ["active", "suspended", "closed"],
      business_type: [
        "corporation",
        "llc",
        "gp",
        "lp",
        "llp",
        "sole_prop",
        "nonprofit_corp",
      ],
      management_type: ["member_managed", "manager_managed", "board_managed"],
      permit_status: ["pending", "issued", "revoked", "expired"],
      permit_type: ["standard", "event", "temporary", "renewal"],
      property_status: ["available", "pending", "occupied"],
      regulation_status: ["draft", "published", "archived"],
      staff_role: ["staff", "admin"],
      tipline_status: ["received", "triage", "in_review", "closed"],
    },
  },
} as const
