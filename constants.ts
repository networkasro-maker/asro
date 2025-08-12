
import { Role, CustomerStatus, PaymentStatus, User, InternetPackage, Customer, IspProfile, WhatsAppTemplate, ModemLightStatus, IssueReport, AccountStatus, ActivityLog } from './types';

export const PACKAGES: InternetPackage[] = [
  { id: 'pkg-1', name: 'Home 10 Mbps', price: 150000 },
  { id: 'pkg-2', name: 'Home 20 Mbps', price: 250000 },
  { id: 'pkg-3', name: 'Home 50 Mbps', price: 350000 },
];

export const ISP_PROFILE: IspProfile = {
    id: 'isp-profile-main',
    name: 'ASRO.NET',
    logoUrl: 'https://i.imgur.com/R0i1S1y.png',
    address: 'Jl. Raya Bumiayu No. 123, Brebes, Jawa Tengah',
    contact: '0812-3456-7890',
    bankAccounts: [
        { bankName: 'BCA', accountNumber: '1234567890', accountName: 'ASRO.NET Billing' },
        { bankName: 'Mandiri', accountNumber: '0987654321', accountName: 'ASRO.NET Billing' }
    ]
};

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
    { id: 'wa-1', name: 'Tagihan Bulanan', template: 'Halo {nama}, kami ingin mengingatkan tagihan internet ASRO.NET Anda sebesar Rp {tagihan} akan jatuh tempo pada tanggal {jatuh_tempo}. Terima kasih.' },
    { id: 'wa-2', name: 'Konfirmasi Pembayaran', template: 'Terima kasih {nama}! Pembayaran tagihan Anda sebesar Rp {tagihan} telah kami terima. Selamat menikmati layanan internet tanpa batas dari ASRO.NET.' }
];

// This data is used only for the initial database seeding.
// After seeding, users and customers will be managed from within the app.
export const SEED_USERS: Omit<User, 'id' | 'password'>[] = [
    { username: 'superadmin@asro.net', role: Role.SUPER_ADMIN, name: 'Super Admin', status: AccountStatus.ACTIVE },
    { username: 'admin@asro.net', role: Role.ADMIN, name: 'Admin Utama', status: AccountStatus.ACTIVE },
    { username: 'sales1@asro.net', role: Role.SALES, name: 'Budi Sales', status: AccountStatus.ACTIVE },
    { username: 'sales2@asro.net', role: Role.SALES, name: 'Cici Sales', status: AccountStatus.ACTIVE },
];
