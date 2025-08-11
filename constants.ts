import { Role, CustomerStatus, PaymentStatus, User, InternetPackage, Customer, IspProfile, WhatsAppTemplate, ModemLightStatus, IssueReport, AccountStatus, ActivityLog } from './types';

export const USERS: User[] = [
  // Super Admin
  { id: 'user-superadmin', username: 'superadmin', password: '22november', role: Role.SUPER_ADMIN, name: 'Super Admin', status: AccountStatus.ACTIVE },

  // Admins
  { id: 'user-admin', username: 'admin', password: '123', role: Role.ADMIN, name: 'Admin Utama', status: AccountStatus.ACTIVE },
  { id: 'user-admin1', username: 'admin1', password: '123', role: Role.ADMIN, name: 'Admin Satu', status: AccountStatus.ACTIVE },
  { id: 'user-admin2', username: 'admin2', password: '123', role: Role.ADMIN, name: 'Admin Dua', status: AccountStatus.ACTIVE },
  
  // Sales
  { id: 'user-sales', username: 'sales', password: '123', role: Role.SALES, name: 'Sales Utama', status: AccountStatus.ACTIVE },
  { id: 'user-sales1', username: 'sales1', password: '123', role: Role.SALES, name: 'Budi Sales', status: AccountStatus.ACTIVE },
  { id: 'user-sales2', username: 'sales2', password: '123', role: Role.SALES, name: 'Cici Sales', status: AccountStatus.ACTIVE },
  { id: 'user-sales3', username: 'sales3', password: '123', role: Role.SALES, name: 'Dodi Sales', status: AccountStatus.ACTIVE },
  { id: 'user-sales4', username: 'sales4', password: '123', role: Role.SALES, name: 'Eka Sales', status: AccountStatus.ACTIVE },
  { id: 'user-sales5', username: 'sales5', password: '123', role: Role.SALES, name: 'Fani Sales', status: AccountStatus.ACTIVE },
];

export const PACKAGES: InternetPackage[] = [
  { id: 'pkg-1', name: 'Home 10 Mbps', price: 150000 },
  { id: 'pkg-2', name: 'Home 20 Mbps', price: 250000 },
  { id: 'pkg-3', name: 'Home 50 Mbps', price: 350000 },
];

export const CUSTOMERS: Customer[] = [
  { id: 'cust-001', name: 'Andi Pelanggan', address: 'Jl. Merdeka No. 1, Bumiayu', phone: '6281234567890', dueDate: '2024-08-20', packageId: 'pkg-1', salesId: 'user-sales1', status: CustomerStatus.ACTIVE, paymentStatus: PaymentStatus.PAID, userId: 'user-cust1', housePhoto: 'https://picsum.photos/seed/house1/400/300' },
  { id: 'cust-002', name: 'Siti Pelanggan', address: 'Jl. Pahlawan No. 10, Brebes', phone: '6281234567891', dueDate: '2024-08-25', packageId: 'pkg-2', salesId: 'user-sales2', status: CustomerStatus.ACTIVE, paymentStatus: PaymentStatus.UNPAID, userId: 'user-cust2', housePhoto: 'https://picsum.photos/seed/house2/400/300' },
  { id: 'cust-003', name: 'Eko Pelanggan', address: 'Jl. Diponegoro No. 5, Bumiayu', phone: '6281234567892', dueDate: '2024-08-15', packageId: 'pkg-3', salesId: 'user-sales3', status: CustomerStatus.ISOLATED, paymentStatus: PaymentStatus.UNPAID, userId: 'user-cust3', housePhoto: 'https://picsum.photos/seed/house3/400/300' },
  { id: 'cust-004', name: 'Dewi Lestari', address: 'Jl. Kartini No. 22, Bumiayu', phone: '6281234567893', dueDate: '2024-08-22', packageId: 'pkg-1', salesId: 'user-sales4', status: CustomerStatus.ACTIVE, paymentStatus: PaymentStatus.VERIFYING, userId: 'user-cust4' },
];

export const ISP_PROFILE: IspProfile = {
    name: 'ASRO.NET',
    logoUrl: 'https://imgur.com/a/6IxRhVs',
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

export const ISSUE_REPORTS: IssueReport[] = [
    {id: 'issue-1', customerId: 'cust-001', modemLightStatus: ModemLightStatus.RED, description: 'Internet mati total, lampu modem merah kedip-kedip.', reportedAt: new Date().toISOString(), modemVideo: null }
];

export const ACTIVITY_LOGS: ActivityLog[] = [];