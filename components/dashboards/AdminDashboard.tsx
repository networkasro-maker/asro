
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Customer, CustomerStatus, InternetPackage, PaymentStatus, Role, User, AccountStatus, IspProfile } from '../../types';
import { supabase } from '../../supabaseClient';
import { CheckCircleIcon, ClockIcon, XCircleIcon, AlertTriangleIcon, UsersIcon, MapPinIcon, FileTextIcon } from '../icons';
import Modal from '../Modal';
import InvoiceTemplate from '../InvoiceTemplate';

declare var XLSX: any;
declare var htmlToImage: any;

const statusConfig: { [key: string]: { icon: React.FC<any>; color: string; bg: string; text: string; } } = {
    [PaymentStatus.PAID]: { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-500/10', text: 'Lunas' },
    [PaymentStatus.UNPAID]: { icon: XCircleIcon, color: 'text-red-400', bg: 'bg-red-500/10', text: 'Belum Bayar' },
    [PaymentStatus.VERIFYING]: { icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: 'Verifikasi' },
    [CustomerStatus.ISOLATED]: { icon: AlertTriangleIcon, color: 'text-orange-400', bg: 'bg-orange-500/10', text: 'Isolir' },
    [CustomerStatus.ACTIVE]: { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-500/10', text: 'Aktif' },
};

const CustomerCard: React.FC<{ 
    customer: Customer, 
    packages: InternetPackage[], 
    users: User[], 
    user: User, 
    onAction: (actionType: string, customer: Customer) => void 
}> = ({ customer, packages, users, user, onAction }) => {
    const pkg = packages.find(p => p.id === customer.packageId);
    const sales = users.find(u => u.id === customer.salesId);
    const effectiveStatus = customer.status === CustomerStatus.ISOLATED ? CustomerStatus.ISOLATED : customer.paymentStatus;
    const config = statusConfig[effectiveStatus] || statusConfig[CustomerStatus.ACTIVE];

    const ActionButton: React.FC<{onClick: () => void, className: string, icon: React.ReactNode, text: string}> = ({onClick, className, icon, text}) => (
        <button
            onClick={onClick}
            className={`flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${className}`}
        >
            {icon}
            <span>{text}</span>
        </button>
    );

    return (
        <div className={`bg-slate-800 rounded-lg shadow-lg p-4 border-l-4 ${config.color.replace('text', 'border')} flex flex-col justify-between transition-all duration-200 hover:shadow-blue-500/20 hover:scale-[1.02]`}>
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg text-white">{customer.name}</p>
                        <p className="text-sm text-slate-400">ID: {customer.id.toUpperCase()}</p>
                    </div>
                    <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                        <config.icon className="h-4 w-4 mr-1"/>
                        {config.text}
                    </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <p className="text-slate-300"><strong className="text-slate-500 w-24 inline-block">Alamat:</strong> {customer.address}</p>
                    <p className="text-slate-300"><strong className="text-slate-500 w-24 inline-block">Paket:</strong> {pkg?.name || 'N/A'}</p>
                    <p className="text-slate-300"><strong className="text-slate-500 w-24 inline-block">Jatuh Tempo:</strong> {new Date(customer.dueDate).toLocaleDateString('id-ID')}</p>
                    <p className="text-slate-300"><strong className="text-slate-500 w-24 inline-block">Sales:</strong> {sales?.name || 'N/A'}</p>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-2">
                {user.role === Role.ADMIN && customer.paymentStatus === PaymentStatus.VERIFYING && (
                     <ActionButton onClick={() => onAction('confirmPayment', customer)} className="bg-green-600/20 text-green-300 hover:bg-green-500 hover:text-white focus:ring-green-500" icon={<CheckCircleIcon className="h-4 w-4 mr-1.5"/>} text="Konfirmasi" />
                )}
                {user.role === Role.SALES && customer.paymentStatus === PaymentStatus.UNPAID && (
                     <ActionButton onClick={() => onAction('markAsVerifying', customer)} className="bg-yellow-600/20 text-yellow-300 hover:bg-yellow-500 hover:text-white focus:ring-yellow-500" icon={<ClockIcon className="h-4 w-4 mr-1.5"/>} text="Verifikasi" />
                )}
                {user.role === Role.SALES && customer.paymentStatus === PaymentStatus.VERIFYING && (
                     <ActionButton onClick={() => onAction('cancelVerification', customer)} className="bg-red-600/20 text-red-300 hover:bg-red-500 hover:text-white focus:ring-red-500" icon={<XCircleIcon className="h-4 w-4 mr-1.5"/>} text="Batal Verifikasi" />
                )}
                {user.role === Role.ADMIN && (
                    <ActionButton 
                        onClick={() => onAction('toggleIsolate', customer)} 
                        className={` ${customer.status === CustomerStatus.ISOLATED ? 'bg-sky-600/20 text-sky-300 hover:bg-sky-500' : 'bg-red-600/20 text-red-300 hover:bg-red-500'} hover:text-white focus:ring-red-500`}
                        icon={<AlertTriangleIcon className="h-4 w-4 mr-1.5"/>} 
                        text={customer.status === CustomerStatus.ISOLATED ? 'Aktifkan' : 'Isolir'} 
                    />
                )}
                <ActionButton onClick={() => onAction('cetak', customer)} className="bg-slate-600/50 text-slate-300 hover:bg-slate-500 hover:text-white focus:ring-slate-500" icon={<FileTextIcon className="h-4 w-4 mr-1.5"/>} text="Cetak" />
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{
  user: User;
  activeView?: string;
  packages: InternetPackage[];
  addActivityLog: (action: string, user: User) => void;
  customers: Customer[];
  users: User[];
  ispProfile: IspProfile;
  refreshData: () => Promise<void>;
}> = ({ user, activeView, packages, addActivityLog, customers, users, ispProfile, refreshData }) => {
    const [filter, setFilter] = useState<PaymentStatus | CustomerStatus | 'All'>('All');
    const [isAddCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [invoiceCustomer, setInvoiceCustomer] = useState<Customer | null>(null);
    const [invoiceImageUrl, setInvoiceImageUrl] = useState<string | null>(null);
    const [isInvoiceLoading, setInvoiceLoading] = useState<boolean>(false);
    const invoiceRef = useRef<HTMLDivElement>(null);
    
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        address: '',
        phone: '',
        packageId: packages[0]?.id || '',
        salesId: '',
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
    
    const salesUsers = useMemo(() => users.filter(u => u.role === Role.SALES), [users]);

    const filteredCustomers = useMemo(() => {
        let salesCustomers = user.role === Role.SALES ? customers.filter(c => c.salesId === user.id) : customers;
        
        let viewKey = activeView;
        if (user.role === Role.SALES) {
            if (activeView === 'customers' || activeView === 'my-customers') viewKey = 'my-customers';
        } else { // Admin
            if (activeView === 'my-customers') viewKey = 'customers';
        }


        if (viewKey === 'my-customers' || viewKey === 'customers') {
            if (filter === 'All') return salesCustomers;
            if (filter === CustomerStatus.ISOLATED) return salesCustomers.filter(c => c.status === CustomerStatus.ISOLATED);
            return salesCustomers.filter(c => c.paymentStatus === filter && c.status !== CustomerStatus.ISOLATED);
        }
        return salesCustomers;

    }, [filter, customers, user, activeView]);
    
    useEffect(() => {
        if (invoiceCustomer && invoiceRef.current) {
            htmlToImage.toJpeg(invoiceRef.current, { 
                quality: 0.98, 
                backgroundColor: '#ffffff',
                width: 302, 
            })
                .then((dataUrl: string) => {
                    setInvoiceImageUrl(dataUrl);
                    setInvoiceLoading(false);
                })
                .catch((error: any) => {
                    console.error('Gagal membuat gambar faktur!', error);
                    alert('Gagal membuat gambar faktur. Silakan coba lagi.');
                    setInvoiceLoading(false);
                    setInvoiceCustomer(null);
                });
        }
    }, [invoiceCustomer]);

    const performDbAction = async (updateLogic: () => Promise<any>, successLog: string) => {
        setIsSubmitting(true);
        const { error } = await updateLogic();
        if (error) {
            alert(`Operasi gagal: ${error.message}`);
        } else {
            addActivityLog(successLog, user);
            await refreshData();
        }
        setConfirmationAction(null);
        setIsSubmitting(false);
    };

    const handleAction = (actionType: string, customer: Customer) => {
        switch (actionType) {
            case 'cetak':
                setInvoiceImageUrl(null);
                setInvoiceLoading(true);
                setInvoiceCustomer(customer);
                addActivityLog(`Mencetak invoice untuk ${customer.name} (ID: ${customer.id})`, user);
                break;
            case 'confirmPayment':
                setConfirmationAction({
                    title: 'Konfirmasi Pembayaran',
                    message: `Anda yakin ingin mengonfirmasi pembayaran untuk ${customer.name}? Status akan diubah menjadi LUNAS.`,
                    onConfirm: () => performDbAction(
                        () => supabase.from('customers').update({ paymentStatus: PaymentStatus.PAID, status: CustomerStatus.ACTIVE }).eq('id', customer.id),
                        `Konfirmasi pembayaran untuk pelanggan ${customer.name} (ID: ${customer.id})`
                    )
                });
                break;
            case 'markAsVerifying':
                 setConfirmationAction({
                    title: 'Konfirmasi Status',
                    message: `Ubah status pembayaran ${customer.name} menjadi "Menunggu Verifikasi"?`,
                    onConfirm: () => performDbAction(
                        () => supabase.from('customers').update({ paymentStatus: PaymentStatus.VERIFYING }).eq('id', customer.id),
                        `Menandai pembayaran menunggu verifikasi untuk ${customer.name} (ID: ${customer.id})`
                    )
                });
                break;
            case 'cancelVerification':
                setConfirmationAction({
                    title: 'Batalkan Verifikasi',
                    message: `Anda yakin ingin membatalkan permintaan verifikasi untuk ${customer.name}?`,
                    onConfirm: () => performDbAction(
                        () => supabase.from('customers').update({ paymentStatus: PaymentStatus.UNPAID }).eq('id', customer.id),
                        `Membatalkan permintaan verifikasi untuk ${customer.name} (ID: ${customer.id})`
                    )
                });
                break;
            case 'toggleIsolate':
                const isIsolating = customer.status !== CustomerStatus.ISOLATED;
                setConfirmationAction({
                    title: isIsolating ? 'Konfirmasi Isolir' : 'Konfirmasi Aktivasi',
                    message: `Anda yakin ingin ${isIsolating ? 'mengisolir' : 'mengaktifkan kembali'} pelanggan ${customer.name}?`,
                    onConfirm: () => performDbAction(
                        () => supabase.from('customers').update({ status: isIsolating ? CustomerStatus.ISOLATED : CustomerStatus.ACTIVE }).eq('id', customer.id),
                        `${isIsolating ? 'Mengisolir' : 'Mengaktifkan kembali'} pelanggan ${customer.name} (ID: ${customer.id})`
                    )
                });
                break;
        }
    };
    
    const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewCustomerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveNewCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, address, packageId, salesId, dueDate, phone } = newCustomerData;

        if (!name || !address || !packageId || !salesId || !dueDate) {
            alert("Semua field wajib diisi.");
            return;
        }
        setIsSubmitting(true);
        
        // This customer will not have a login account initially.
        // The userId can be linked later if they are given an account.
        const newCustomer: Omit<Customer, 'id' | 'userId'> & { userId: null } = {
            name,
            address,
            phone: phone || undefined,
            dueDate,
            packageId,
            salesId,
            status: CustomerStatus.ACTIVE,
            paymentStatus: PaymentStatus.UNPAID,
            userId: null,
        };
        
        const { data, error } = await supabase.from('customers').insert([newCustomer]).select().single();

        if (error) {
            alert(`Gagal menambah pelanggan: ${error.message}`);
        } else {
            addActivityLog(`Menambahkan pelanggan baru: ${name} (ID: ${data.id})`, user);
            await refreshData();
            setAddCustomerModalOpen(false);
            setNewCustomerData({ name: '', address: '', phone: '', packageId: packages[0]?.id || '', salesId: '', dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] });
            alert("Pelanggan baru berhasil ditambahkan.");
        }
        setIsSubmitting(false);
    };

    const exportToExcel = useCallback(() => {
        try {
            const ws = XLSX.utils.json_to_sheet(filteredCustomers.map(c => ({
                'ID Pelanggan': c.id,
                'Nama': c.name,
                'Paket': packages.find(p => p.id === c.packageId)?.name,
                'Jatuh Tempo': new Date(c.dueDate).toLocaleDateString('id-ID'),
                'Status Pembayaran': c.paymentStatus,
                'Status Pelanggan': c.status,
                'Sales': users.find(u => u.id === c.salesId)?.name
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pelanggan");
            XLSX.writeFile(wb, "Laporan_Pelanggan_ASRO_NET.xlsx");
            addActivityLog(`Mengekspor data pelanggan (${filter}) ke Excel`, user);
        } catch (error) {
            console.error("Failed to export to Excel", error);
            alert("Gagal mengekspor ke Excel. Pastikan Anda terhubung ke internet.");
        }
    }, [filteredCustomers, packages, addActivityLog, user, filter, users]);

    const StatCard: React.FC<{title:string, count: number, icon:React.ReactNode}> = ({title, count, icon}) => (
        <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between">
            <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">{title}</p>
                <p className="text-xl font-bold text-white">{count}</p>
            </div>
            <div className="text-blue-400">{icon}</div>
        </div>
    );
    
    const filters = [
        { label: 'Semua', value: 'All' },
        { label: 'Lunas', value: PaymentStatus.PAID },
        { label: 'Belum Bayar', value: PaymentStatus.UNPAID },
        { label: 'Verifikasi', value: PaymentStatus.VERIFYING },
        { label: 'Isolir', value: CustomerStatus.ISOLATED },
    ];
    
    const customerListForStats = user.role === Role.SALES ? customers.filter(c => c.salesId === user.id) : customers;

    const renderContent = () => {
        switch(activeView) {
            case 'dashboard':
                 return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <StatCard title="Total Pelanggan" count={customerListForStats.length} icon={<UsersIcon className="h-6 w-6"/>} />
                       <StatCard title="Lunas" count={customerListForStats.filter(c => c.paymentStatus === PaymentStatus.PAID && c.status !== CustomerStatus.ISOLATED).length} icon={<CheckCircleIcon className="h-6 w-6"/>} />
                       <StatCard title="Belum Bayar" count={customerListForStats.filter(c => c.paymentStatus === PaymentStatus.UNPAID && c.status !== CustomerStatus.ISOLATED).length} icon={<XCircleIcon className="h-6 w-6"/>} />
                       <StatCard title="Isolir" count={customerListForStats.filter(c => c.status === CustomerStatus.ISOLATED).length} icon={<AlertTriangleIcon className="h-6 w-6"/>} />
                    </div>
                );
            case 'customers':
            case 'my-customers':
                 return (
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                            <div className="flex flex-wrap space-x-1 bg-slate-700/50 p-1 rounded-lg">
                               {filters.map(f => (
                                    <button key={f.value} onClick={() => setFilter(f.value as any)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filter === f.value ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-600'}`}>
                                        {f.label}
                                    </button>
                               ))}
                            </div>
                             <div className="flex items-center gap-2">
                                {user.role === Role.ADMIN && (
                                    <button onClick={() => setAddCustomerModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto whitespace-nowrap">
                                        Tambah Pelanggan
                                    </button>
                                )}
                                <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto">
                                    Export ke Excel
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredCustomers.map(customer => (
                                <CustomerCard key={customer.id} customer={customer} packages={packages} users={users} user={user} onAction={handleAction} />
                            ))}
                        </div>
                         {filteredCustomers.length === 0 && <p className="text-center text-slate-400 py-8">Tidak ada data pelanggan.</p>}
                    </div>
                 );
            case 'reports':
                return <div className="text-white bg-slate-800 p-6 rounded-lg">Halaman Laporan Pembukuan sedang dalam pengembangan.</div>;
            case 'issues':
                return <div className="text-white bg-slate-800 p-6 rounded-lg">Halaman Laporan Gangguan sedang dalam pengembangan.</div>;
            case 'new-install':
                 return <div className="text-white bg-slate-800 p-6 rounded-lg">Halaman Request Pemasangan Baru sedang dalam pengembangan.</div>;
            default:
                return null;
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Dashboard {user.role}</h1>

            {renderContent()}

            {invoiceCustomer && (
                <div ref={invoiceRef} className="fixed left-[-9999px] top-0">
                    <InvoiceTemplate 
                        customer={invoiceCustomer}
                        pkg={packages.find(p => p.id === invoiceCustomer.packageId)!}
                        ispProfile={ispProfile}
                    />
                </div>
            )}
            
            <Modal isOpen={!!confirmationAction} onClose={() => setConfirmationAction(null)} title={confirmationAction?.title || 'Konfirmasi'} size="sm">
                <div className="text-white">
                    <p className="text-slate-300 mb-6">{confirmationAction?.message}</p>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setConfirmationAction(null)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition">Batal</button>
                        <button type="button" onClick={confirmationAction?.onConfirm} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-slate-500 flex items-center">
                          {isSubmitting && <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-white mr-2"></div>}
                          Ya, Lanjutkan
                        </button>
                    </div>
                </div>
            </Modal>
            
            <Modal 
                isOpen={!!invoiceCustomer} 
                onClose={() => setInvoiceCustomer(null)} 
                title={`Invoice untuk ${invoiceCustomer?.name}`}
                size="sm"
            >
                <div className="bg-slate-800 p-4 rounded-lg">
                    {isInvoiceLoading && (
                        <div className="text-center py-10">
                            <p className="text-white">Membuat invoice JPG...</p>
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto mt-4"></div>
                        </div>
                    )}
                    {invoiceImageUrl && (
                        <div className="space-y-4">
                            <img src={invoiceImageUrl} alt={`Invoice for ${invoiceCustomer?.name}`} className="w-full border-2 border-slate-600 rounded-md shadow-lg" />
                            <a
                                href={invoiceImageUrl}
                                download={`invoice-${invoiceCustomer?.id}.jpg`}
                                className="w-full text-center block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105"
                            >
                                Download JPG & Cetak
                            </a>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={isAddCustomerModalOpen} onClose={() => setAddCustomerModalOpen(false)} title="Tambah Pelanggan Baru">
                <form onSubmit={handleSaveNewCustomer} className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Nama Lengkap</label><input type="text" name="name" value={newCustomerData.name} onChange={handleNewCustomerChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Alamat</label><textarea name="address" value={newCustomerData.address} onChange={handleNewCustomerChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required></textarea></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">No. Telepon (WA)</label><input type="tel" name="phone" value={newCustomerData.phone} onChange={handleNewCustomerChange} placeholder="e.g. 6281234567890" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" /></div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Paket Internet</label>
                        <select name="packageId" value={newCustomerData.packageId} onChange={handleNewCustomerChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required>
                            <option value="" disabled>Pilih Paket</option>
                            {packages.map(p => <option key={p.id} value={p.id}>{p.name} - Rp {p.price.toLocaleString('id-ID')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Sales</label>
                        <select name="salesId" value={newCustomerData.salesId} onChange={handleNewCustomerChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required>
                            <option value="" disabled>Pilih Sales</option>
                            {salesUsers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Tanggal Jatuh Tempo Awal</label><input type="date" name="dueDate" value={newCustomerData.dueDate} onChange={handleNewCustomerChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required /></div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setAddCustomerModalOpen(false)} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500 flex items-center">
                            {isSubmitting && <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-white mr-2"></div>}
                            Simpan Pelanggan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
