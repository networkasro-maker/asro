import { createClient } from '@supabase/supabase-js';
import { User, InternetPackage, Customer, ActivityLog, IssueReport, IspProfile, WhatsAppTemplate, Role, AccountStatus, CustomerStatus, PaymentStatus, ModemLightStatus } from '../types';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      packages: {
        Row: InternetPackage;
        Insert: Omit<InternetPackage, 'id'>;
        Update: Partial<InternetPackage>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer>;
        Update: Partial<Customer>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, 'id' | 'timestamp'>;
        Update: Partial<ActivityLog>;
      };
      issue_reports: {
        Row: IssueReport;
        Insert: Omit<IssueReport, 'id' | 'reportedAt'>;
        Update: Partial<IssueReport>;
      };
      isp_profile: {
        Row: IspProfile;
        Insert: Partial<IspProfile>;
        Update: Partial<IspProfile>;
      };
      whatsapp_templates: {
        Row: WhatsAppTemplate;
        Insert: Omit<WhatsAppTemplate, 'id'>;
        Update: Partial<WhatsAppTemplate>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_status: AccountStatus;
      customer_status: CustomerStatus;
      modem_light_status: ModemLightStatus;
      payment_status: PaymentStatus;
      role: Role;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}


// TODO: Ganti dengan URL dan kunci Anon Supabase Anda.
// Sebaiknya, simpan nilai ini di environment variables.
const supabaseUrl = process.env.SUPABASE_URL || '[MASUKKAN_SUPABASE_URL_ANDA]';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '[MASUKKAN_SUPABASE_ANON_KEY_ANDA]';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('MASUKKAN')) {
    console.error("Supabase URL and Anon Key must be provided in lib/supabaseClient.ts");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
