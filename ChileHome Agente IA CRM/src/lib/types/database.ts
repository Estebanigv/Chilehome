// Generated placeholder — replace with: npx supabase gen types typescript --project-id ncdvsnenxaakxnmiqpab > src/lib/types/database.ts
// once SUPABASE_ACCESS_TOKEN is set.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LeadStatus =
  | "pending"
  | "assigned"
  | "sale"
  | "lost"
  | "pending_followup";

export type LeadTemperature = "hot" | "warm" | "cold";

export type OfferResponse =
  | "pending"
  | "accepted"
  | "rejected"
  | "no_respondio";

export type ExecutiveRole = "admin" | "executive";

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: number;
          client_name: string;
          client_phone: string;
          client_location: string | null;
          kit_type: string | null;
          status: LeadStatus;
          temperature: LeadTemperature | null;
          score: number | null;
          assigned_to: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["leads"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      executives: {
        Row: {
          id: number;
          name: string;
          phone: string;
          email: string | null;
          active: boolean;
          avatar_url: string | null;
          role: ExecutiveRole;
        };
        Insert: Omit<Database["public"]["Tables"]["executives"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["executives"]["Insert"]>;
      };
      lead_offers: {
        Row: {
          id: number;
          lead_id: number;
          executive_id: number;
          response: OfferResponse;
          offered_at: string;
          responded_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_offers"]["Row"], "id">;
        Update: Partial<
          Database["public"]["Tables"]["lead_offers"]["Insert"]
        >;
      };
      n8n_chat_histories: {
        Row: {
          id: number;
          session_id: string;
          message: Json;
        };
        Insert: Omit<
          Database["public"]["Tables"]["n8n_chat_histories"]["Row"],
          "id"
        >;
        Update: Partial<
          Database["public"]["Tables"]["n8n_chat_histories"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
