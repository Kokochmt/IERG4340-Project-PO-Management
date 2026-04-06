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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_person: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      goods_received: {
        Row: {
          created_at: string
          created_by: string | null
          file_url: string | null
          grn_number: string
          id: string
          invoice_id: string | null
          notes: string | null
          po_id: string | null
          quantity_received: number | null
          received_by: string | null
          received_date: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["record_status"] | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          grn_number: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          po_id?: string | null
          quantity_received?: number | null
          received_by?: string | null
          received_date?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          grn_number?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          po_id?: string | null
          quantity_received?: number | null
          received_by?: string | null
          received_date?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_received_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_received_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          file_url: string | null
          id: string
          invoice_date: string | null
          invoice_number: string
          notes: string | null
          po_id: string | null
          quotation_id: string | null
          remarks: string | null
          request_id: string | null
          status: Database["public"]["Enums"]["record_status"] | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number: string
          notes?: string | null
          po_id?: string | null
          quotation_id?: string | null
          remarks?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          notes?: string | null
          po_id?: string | null
          quotation_id?: string | null
          remarks?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
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
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          delivery_location: string | null
          expected_delivery: string | null
          file_url: string | null
          goods_description: string | null
          id: string
          notes: string | null
          order_date: string | null
          po_number: string
          quantity: number | null
          quotation_id: string | null
          remarks: string | null
          request_id: string | null
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["record_status"] | null
          total_amount: number | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_location?: string | null
          expected_delivery?: string | null
          file_url?: string | null
          goods_description?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number: string
          quantity?: number | null
          quotation_id?: string | null
          remarks?: string | null
          request_id?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          total_amount?: number | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_location?: string | null
          expected_delivery?: string | null
          file_url?: string | null
          goods_description?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string
          quantity?: number | null
          quotation_id?: string | null
          remarks?: string | null
          request_id?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          total_amount?: number | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          department: string | null
          description: string | null
          file_url: string | null
          id: string
          priority: string | null
          remarks: string | null
          request_number: string
          requester_name: string
          status: Database["public"]["Enums"]["record_status"] | null
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          department?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          priority?: string | null
          remarks?: string | null
          request_number: string
          requester_name: string
          status?: Database["public"]["Enums"]["record_status"] | null
          title: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          department?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          priority?: string | null
          remarks?: string | null
          request_number?: string
          requester_name?: string
          status?: Database["public"]["Enums"]["record_status"] | null
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          file_url: string | null
          id: string
          notes: string | null
          quotation_number: string
          remarks: string | null
          request_id: string | null
          status: Database["public"]["Enums"]["record_status"] | null
          title: string | null
          total_amount: number | null
          updated_at: string
          valid_until: string | null
          vendor_contact: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          quotation_number: string
          remarks?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          vendor_contact?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          quotation_number?: string
          remarks?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["record_status"] | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          vendor_contact?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "observer" | "casual_buyer" | "admin" | "buying_manager"
      record_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
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
      app_role: ["observer", "casual_buyer", "admin", "buying_manager"],
      record_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
