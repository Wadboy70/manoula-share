export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      professional_credentials: {
        Row: {
          created_at: string
          credential_label: string
          credential_type: string
          expires_at: string | null
          id: number
          issuing_body: string | null
          professional_id: number
          registration_number: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          credential_label: string
          credential_type: string
          expires_at?: string | null
          id?: number
          issuing_body?: string | null
          professional_id: number
          registration_number?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          credential_label?: string
          credential_type?: string
          expires_at?: string | null
          id?: number
          issuing_body?: string | null
          professional_id?: number
          registration_number?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_credentials_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_search_cards_enriched"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "professional_credentials_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_search_profiles: {
        Row: {
          country_code: string
          geocoded_at: string | null
          is_active: boolean
          is_approved: boolean
          is_profile_complete: boolean
          is_public_searchable: boolean
          latitude: number | null
          location_label: string | null
          longitude: number | null
          mapbox_id: string | null
          offers_in_home: boolean
          offers_provider_location: boolean
          offers_remote: boolean
          rating_avg: number | null
          rating_count: number
          user_id: number
        }
        Insert: {
          country_code?: string
          geocoded_at?: string | null
          is_active?: boolean
          is_approved?: boolean
          is_profile_complete?: boolean
          is_public_searchable?: boolean
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          mapbox_id?: string | null
          offers_in_home?: boolean
          offers_provider_location?: boolean
          offers_remote?: boolean
          rating_avg?: number | null
          rating_count?: number
          user_id: number
        }
        Update: {
          country_code?: string
          geocoded_at?: string | null
          is_active?: boolean
          is_approved?: boolean
          is_profile_complete?: boolean
          is_public_searchable?: boolean
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          mapbox_id?: string | null
          offers_in_home?: boolean
          offers_provider_location?: boolean
          offers_remote?: boolean
          rating_avg?: number | null
          rating_count?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_search_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "professional_search_cards_enriched"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "professional_search_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_specialties: {
        Row: {
          created_at: string
          professional_id: number
          specialty_id: number
        }
        Insert: {
          created_at?: string
          professional_id: number
          specialty_id: number
        }
        Update: {
          created_at?: string
          professional_id?: number
          specialty_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_search_cards_enriched"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          id: number
          professional_id: number
          rating: number
          review_text: string | null
          reviewer_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          professional_id: number
          rating: number
          review_text?: string | null
          reviewer_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          professional_id?: number
          rating?: number
          review_text?: string | null
          reviewer_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_search_cards_enriched"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "professional_search_cards_enriched"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_area_places: {
        Row: {
          country_code: string
          created_at: string
          geocoded_at: string | null
          id: number
          latitude: number | null
          location_label: string | null
          longitude: number | null
          mapbox_id: string | null
          service_id: number
        }
        Insert: {
          country_code?: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          mapbox_id?: string | null
          service_id: number
        }
        Update: {
          country_code?: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          mapbox_id?: string | null
          service_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_area_places_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_locations: {
        Row: {
          country_code: string
          created_at: string
          geocoded_at: string | null
          id: number
          latitude: number | null
          location_label: string | null
          location_name: string | null
          longitude: number | null
          mapbox_id: string | null
          service_id: number
        }
        Insert: {
          country_code?: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          latitude?: number | null
          location_label?: string | null
          location_name?: string | null
          longitude?: number | null
          mapbox_id?: string | null
          service_id: number
        }
        Update: {
          country_code?: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          latitude?: number | null
          location_label?: string | null
          location_name?: string | null
          longitude?: number | null
          mapbox_id?: string | null
          service_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_locations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          currency_code: string
          delivery_mode: string
          description: string | null
          duration_minutes: number | null
          id: number
          is_active: boolean
          price_cents: number | null
          professional_id: number
          provider_location_name: string | null
          remote_scope: string | null
          service_area_text: string | null
          service_area_type: string | null
          service_radius_km: number | null
          specialty_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          delivery_mode: string
          description?: string | null
          duration_minutes?: number | null
          id?: number
          is_active?: boolean
          price_cents?: number | null
          professional_id: number
          provider_location_name?: string | null
          remote_scope?: string | null
          service_area_text?: string | null
          service_area_type?: string | null
          service_radius_km?: number | null
          specialty_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          delivery_mode?: string
          description?: string | null
          duration_minutes?: number | null
          id?: number
          is_active?: boolean
          price_cents?: number | null
          professional_id?: number
          provider_location_name?: string | null
          remote_scope?: string | null
          service_area_text?: string | null
          service_area_type?: string | null
          service_radius_km?: number | null
          specialty_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_search_cards_enriched"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          id: number
          label: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: number
          label: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: number
          label?: string
          slug?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          bio: string | null
          country_code: string
          created_at: string
          email: string | null
          first_name: string | null
          id: number
          is_professional: boolean | null
          last_name: string | null
          profile_photo_url: string | null
        }
        Insert: {
          auth_user_id?: string | null
          bio?: string | null
          country_code: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: number
          is_professional?: boolean | null
          last_name?: string | null
          profile_photo_url?: string | null
        }
        Update: {
          auth_user_id?: string | null
          bio?: string | null
          country_code?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: number
          is_professional?: boolean | null
          last_name?: string | null
          profile_photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      professional_search_cards_enriched: {
        Row: {
          bio: string | null
          country_code: string | null
          first_name: string | null
          last_name: string | null
          latitude: number | null
          location_label: string | null
          longitude: number | null
          mapbox_id: string | null
          offers_in_home: boolean | null
          offers_provider_location: boolean | null
          offers_remote: boolean | null
          professional_id: number | null
          profile_photo_url: string | null
          rating_avg: number | null
          rating_count: number | null
          services: Json | null
          specialties: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_user_id_for_auth: { Args: never; Returns: number }
      is_professional_publicly_listable: {
        Args: { pro_id: number }
        Returns: boolean
      }
      search_haversine_km: {
        Args: {
          lat1: number
          lon1: number
          lat2: number
          lon2: number
        }
        Returns: number
      }
      search_professional_cards_page: {
        Args: {
          p_return_cap: number
          p_probe_rows: number
          p_after_sort_score: number | null
          p_after_professional_id: number | null
          p_specialty_label: string | null
          p_delivery_mode: string | null
          p_location: Json | null
        }
        Returns: Json
      }
      search_service_matches_location: {
        Args: {
          p_service_id: number
          p_user_mapbox_id: string
          p_user_lat: number
          p_user_lng: number
          p_ancestor_mapbox_ids: string[]
          p_profile_lat: number | null
          p_profile_lng: number | null
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

