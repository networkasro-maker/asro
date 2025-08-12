

export enum Role {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Admin',
  SALES = 'Sales',
  CUSTOMER = 'Pelanggan'
}

export enum CustomerStatus {
  ACTIVE = 'Aktif',
  ISOLATED = 'Isolir'
}

export enum PaymentStatus {
  PAID = 'Lunas',
  UNPAID = 'Belum Bayar',
  VERIFYING = 'Verifikasi'
}

export enum AccountStatus {
  ACTIVE = 'Aktif',
  FROZEN = 'Dibekukan',
}

export enum ModemLightStatus {
    RED = 'Lampu Merah (Loss)',
    GREEN = 'Lampu Hijau (Normal)',
    OFF = 'Semua Lampu Mati'
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  role: Role;
  name: string;
  profilePicture?: string;
  status: AccountStatus;
}

export interface InternetPackage {
  id: string;
  name: string;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  dueDate: string; // ISO string date
  packageId: string;
  salesId: string;
  housePhoto?: string;
  location?: { lat: number; lng: number };
  status: CustomerStatus;
  paymentStatus: PaymentStatus;
  userId: string | null;
}

export interface IssueReport {
    id: string;
    customerId: string;
    modemVideo?: File | null;
    modemLightStatus: ModemLightStatus;
    description: string;
    reportedAt: string; // ISO string date
}

export interface IspProfile {
    id: string;
    name: string;
    logoUrl: string;
    address: string;
    contact: string;
    bankAccounts: { bankName: string; accountNumber: string; accountName: string }[];
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    template: string;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userRole: Role;
    action: string;
    timestamp: string; // ISO string date
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          id: number
          timestamp: string
          userId: string
          userName: string
          userRole: Role
        }
        Insert: {
          action: string
          id?: number
          timestamp?: string
          userId: string
          userName: string
          userRole: Role
        }
        Update: {
          action?: string
          id?: number
          timestamp?: string
          userId?: string
          userName?: string
          userRole?: Role
        }
      }
      customers: {
        Row: {
          address: string
          dueDate: string
          housePhoto: string | null
          id: string
          location: Json | null
          name: string
          packageId: string
          paymentStatus: PaymentStatus
          phone: string | null
          salesId: string
          status: CustomerStatus
          userId: string | null
        }
        Insert: {
          address: string
          dueDate: string
          housePhoto?: string | null
          id?: string
          location?: Json | null
          name: string
          packageId: string
          paymentStatus: PaymentStatus
          phone?: string | null
          salesId: string
          status: CustomerStatus
          userId?: string | null
        }
        Update: {
          address?: string
          dueDate?: string
          housePhoto?: string | null
          id?: string
          location?: Json | null
          name?: string
          packageId?: string
          paymentStatus?: PaymentStatus
          phone?: string | null
          salesId?: string
          status?: CustomerStatus
          userId?: string | null
        }
      }
      issue_reports: {
        Row: {
          customerId: string
          description: string
          id: number
          modemLightStatus: ModemLightStatus
          modemVideo: string | null
          reportedAt: string
        }
        Insert: {
          customerId: string
          description: string
          id?: number
          modemLightStatus: ModemLightStatus
          modemVideo?: string | null
          reportedAt?: string
        }
        Update: {
          customerId?: string
          description?: string
          id?: number
          modemLightStatus?: ModemLightStatus
          modemVideo?: string | null
          reportedAt?: string
        }
      }
      isp_profile: {
        Row: {
          address: string
          bankAccounts: Json
          contact: string
          id: string
          logoUrl: string
          name: string
        }
        Insert: {
          address: string
          bankAccounts: Json
          contact: string
          id: string
          logoUrl: string
          name: string
        }
        Update: {
          address?: string
          bankAccounts?: Json
          contact?: string
          id?: string
          logoUrl?: string
          name?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          price: number
        }
        Insert: {
          id?: string
          name: string
          price: number
        }
        Update: {
          id?: string
          name?: string
          price?: number
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          role: Role
          status: AccountStatus
          username: string
          profilePicture: string | null
        }
        Insert: {
          id: string
          name: string
          role: Role
          status: AccountStatus
          username: string
          profilePicture?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: Role
          status?: AccountStatus
          username?: string
          profilePicture?: string | null
        }
      }
      whatsapp_templates: {
        Row: {
          id: string
          name: string
          template: string
        }
        Insert: {
          id?: string
          name: string
          template: string
        }
        Update: {
          id?: string
          name?: string
          template?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}