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

export interface User {
  id: string;
  username: string;
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
  userId: string;
}

export interface IssueReport {
    id: string;
    customerId: string;
    modemVideo?: File | string | null; // Allow string for URL from Supabase
    modemLightStatus: ModemLightStatus;
    description: string;
    reportedAt: string; // ISO string date
}

export interface IspProfile {
    id?: number;
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