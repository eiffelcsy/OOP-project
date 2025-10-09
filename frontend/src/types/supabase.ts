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
      admins: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          clinic_id: number | null
          created_at: string | null
          doctor_id: number | null
          id: number
          patient_id: number
          status: string | null
          time_slot_id: number | null
          treatment_summary: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: number | null
          created_at?: string | null
          doctor_id?: number | null
          id?: never
          patient_id: number
          status?: string | null
          time_slot_id?: number | null
          treatment_summary?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number | null
          created_at?: string | null
          doctor_id?: number | null
          id?: never
          patient_id?: number
          status?: string | null
          time_slot_id?: number | null
          treatment_summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          data_json: Json | null
          entity_id: string | null
          entity_type: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          data_json?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          data_json?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      clinics: {
        Row: {
          address_line: string | null
          area: string | null
          clinic_type: string | null
          close_time: string | null
          created_at: string | null
          day_of_week: number | null
          day_type: string | null
          id: number
          name: string
          note: string | null
          open_time: string | null
          region: string | null
          remarks: string | null
          source_ref: string | null
          updated_at: string | null
        }
        Insert: {
          address_line?: string | null
          area?: string | null
          clinic_type?: string | null
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number | null
          day_type?: string | null
          id?: never
          name: string
          note?: string | null
          open_time?: string | null
          region?: string | null
          remarks?: string | null
          source_ref?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line?: string | null
          area?: string | null
          clinic_type?: string | null
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number | null
          day_type?: string | null
          id?: never
          name?: string
          note?: string | null
          open_time?: string | null
          region?: string | null
          remarks?: string | null
          source_ref?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          active: boolean | null
          clinic_id: number
          created_at: string | null
          id: number
          name: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          clinic_id: number
          created_at?: string | null
          id?: never
          name: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          clinic_id?: number
          created_at?: string | null
          id?: never
          name?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string | null
          created_at: string | null
          delivered_at: string | null
          id: number
          payload_json: Json | null
          template_key: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: never
          payload_json?: Json | null
          template_key?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: never
          payload_json?: Json | null
          template_key?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          created_at: string | null
          dob: string | null
          id: number
          nric: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          dob?: string | null
          id?: never
          nric?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          dob?: string | null
          id?: never
          nric?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: number
          email: string | null
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: never
          email?: string | null
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: never
          email?: string | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      queue_tickets: {
        Row: {
          appointment_id: number | null
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          id: number
          no_show_at: string | null
          patient_id: number | null
          priority: number | null
          queue_id: number
          ticket_number: number
          ticket_status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: number | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: never
          no_show_at?: string | null
          patient_id?: number | null
          priority?: number | null
          queue_id: number
          ticket_number: number
          ticket_status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: number | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: never
          no_show_at?: string | null
          patient_id?: number | null
          priority?: number | null
          queue_id?: number
          ticket_number?: number
          ticket_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_tickets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          clinic_id: number
          created_at: string | null
          id: number
          queue_date: string
          queue_status: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          id?: never
          queue_date: string
          queue_status?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          id?: never
          queue_date?: string
          queue_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queues_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      reports_cache: {
        Row: {
          avg_wait_secs: number | null
          clinic_id: number | null
          created_at: string | null
          id: number
          no_show_rate: number | null
          patients_seen: number | null
          report_date: string
          updated_at: string | null
        }
        Insert: {
          avg_wait_secs?: number | null
          clinic_id?: number | null
          created_at?: string | null
          id?: never
          no_show_rate?: number | null
          patients_seen?: number | null
          report_date: string
          updated_at?: string | null
        }
        Update: {
          avg_wait_secs?: number | null
          clinic_id?: number | null
          created_at?: string | null
          id?: never
          no_show_rate?: number | null
          patients_seen?: number | null
          report_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_cache_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          clinic_id: number
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          id?: never
          name: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          id?: never
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          doctor_id: number
          end_time: string
          id: number
          slot_duration_minutes: number
          start_time: string
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          doctor_id: number
          end_time: string
          id?: never
          slot_duration_minutes: number
          start_time: string
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          doctor_id?: number
          end_time?: string
          id?: never
          slot_duration_minutes?: number
          start_time?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          clinic_id: number | null
          created_at: string | null
          id: number
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          clinic_id?: number | null
          created_at?: string | null
          id?: never
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          clinic_id?: number | null
          created_at?: string | null
          id?: never
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          clinic_id: number
          created_at: string | null
          doctor_id: number
          id: number
          slot_end: string
          slot_start: string
          status: string
          updated_at: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          doctor_id: number
          id?: never
          slot_end: string
          slot_start: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          doctor_id?: number
          id?: never
          slot_end?: string
          slot_start?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          display_name: string
          email: string
          enabled: boolean
          id: number
          password: string
          user_type: string
        }
        Insert: {
          display_name: string
          email: string
          enabled: boolean
          id?: number
          password: string
          user_type: string
        }
        Update: {
          display_name?: string
          email?: string
          enabled?: boolean
          id?: number
          password?: string
          user_type?: string
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
