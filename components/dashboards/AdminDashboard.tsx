import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Customer, CustomerStatus, InternetPackage, PaymentStatus, Role, User, IspProfile } from '../../types';
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
  onCustomerUpdate: (customerId: string, updates: Partial<Customer>) => Promise<boolean>;
  onCustomerAdd: (customerData: Pick<Customer, 'name' | 'address' | 'packageId' | 'dueDate'>, salesId: string) => Promise<boolean>;
}> = ({ user, activeView, packages, addActivityLog, customers, users, ispProfile, onCustomerUpdate, onCustomerAdd }) => {
    const [filter, setFilter] = useState<PaymentStatus | CustomerStatus | 'All'>('All');
    const [isAddCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; } | null>(null);
    
    const [invoiceCustomer, setInvoiceCustomer] = useState<Customer | null>(null);
    const [invoiceImageUrl, setInvoiceImageUrl] = useState<string | null>(null);
    const [isInvoiceLoading, setInvoiceLoading] = useState<boolean>(false);
    const invoiceRef = useRef<HTMLDivElement>(null);
    
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        address: '',
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
            setInvoiceLoading(true);
            htmlToImage.toJpeg(invoiceRef.current, { 
                quality: 0.98, 
                backgroundColor: '#ffffff',
                width: 302, // Approx 80mm for thermal printers
            })
            .then((dataUrl: string) => {
                setInvoiceImageUrl(dataUrl);
            })
            .catch((err: any) => {
                console.error('Invoice generation failed:', err);
                alert('Gagal membuat gambar invoice.');
                setInvoiceCustomer(null); // Reset on error
            })
            .finally(() => {
                setInvoiceLoading(false);
            });
        }
    }, [invoiceCustomer]);

    const handleAction = useCallback((actionType: string, customer: Customer) => {
        const actionMap: {[key: string]: () => void} = {
            confirmPayment: () => {
                setConfirmationAction({
                    title: "Konfirmasi Pembayaran",
                    message: <>Apakah Anda yakin ingin mengonfirmasi pembayaran untuk <strong>{customer.name}</strong>? Status akan diubah menjadi <strong>Lunas</strong>.</>,
                    onConfirm: async () => { 
                        const success = await onCustomerUpdate(customer.id, { paymentStatus: PaymentStatus.PAID });
                        if (success) addActivityLog(`Konfirmasi pembayaran untuk ${customer.name}`, user);
                        setConfirmationAction(null);
                    }
                });
            },
            toggleIsolate: () => {
                const isCurrentlyIsolated = customer.status === CustomerStatus.ISOLATED;
                setConfirmationAction({
                    title: isCurrentlyIsolated ? "Aktifkan Kembali Pelanggan" : "Isolir Pelanggan",
                    message: <>Apakah Anda yakin ingin <strong>{isCurrentlyIsolated ? 'mengaktifkan kembali' : 'mengisolir'}</strong> pelanggan <strong>{customer.name}</strong>?</>,
                    onConfirm: async () => {
                        const newStatus = isCurrentlyIsolated ? CustomerStatus.ACTIVE : CustomerStatus.ISOLATED;
                        const success = await onCustomerUpdate(customer.id, { status: newStatus });
                        if (success) addActivityLog(`${isCurrentlyIsolated ? 'Mengaktifkan kembali' : 'Mengisolir'} pelanggan: ${customer.name}`, user);
                        setConfirmationAction(null);
                    }
                });
            },
            markAsVerifying: async () => {
                const success = await onCustomerUpdate(customer.id, { paymentStatus: PaymentStatus.VERIFYING });
                if (success) addActivityLog(`Menandai pembayaran ${customer.name} sebagai 'Verifikasi'`, user);
            },
            cancelVerification: async () => {
                 const success = await onCustomerUpdate(customer.id, { paymentStatus: PaymentStatus.UNPAID });
                 if (success) addActivityLog(`Membatalkan verifikasi pembayaran untuk ${customer.name}`, user);
            },
            cetak: () => {
                setInvoiceCustomer(customer);
            }
        };

        actionMap[actionType]?.();
    }, [onCustomerUpdate, addActivityLog, user]);

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        const salesId = user.role === Role.SALES ? user.id : newCustomerData.salesId;
        if (!newCustomerData.name || !newCustomerData.address || !newCustomerData.packageId || !salesId) {
            alert("Harap lengkapi semua field yang diperlukan.");
            return;
        }

        const success = await onCustomerAdd({
            name: newCustomerData.name,
            address: newCustomerData.address,
            packageId: newCustomerData.packageId,
            dueDate: newCustomerData.dueDate,
        }, salesId);

        if (success) {
            setAddCustomerModalOpen(false);
            setNewCustomerData({
                name: '', address: '', packageId: packages[0]?.id || '', salesId: '',
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
            });
        } else {
            alert("Gagal menambahkan pelanggan. Silakan coba lagi.");
        }
    };
    
    const exportData = () => {
        const dataToExport = filteredCustomers.map(c => {
            const pkg = packages.find(p => p.id === c.packageId);
            const sales = users.find(u => u.id === c.salesId);
            return {
                "ID Pelanggan": c.id,
                "Nama": c.name,
                "Alamat": c.address,
                "No. Telepon": c.phone || '-',
                "Paket": pkg?.name,
                "Harga": pkg?.price,
                "Jatuh Tempo": new Date(c.dueDate).toLocaleDateString('id-ID'),
                "Status Pelanggan": c.status,
                "Status Pembayaran": c.paymentStatus,
                "Sales": sales?.name
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pelanggan");
        XLSX.writeFile(wb, `Data_Pelanggan_ASRO_NET_${new Date().toISOString().split('T')[0]}.xlsx`);
        addActivityLog('Mengekspor data pelanggan ke Excel.', user);
    };

    const getDashboardTitle = () => {
      switch(user.role){
        case Role.SUPER_ADMIN:
        case Role.ADMIN:
          return "Dashboard Pelanggan";
        case Role.SALES:
          return "Dashboard Sales";
        default:
          return "Dashboard";
      }
    };
    
    const renderAddCustomerModal = () => (
         <Modal isOpen={isAddCustomerModalOpen} onClose={() => setAddCustomerModalOpen(false)} title="Tambah Pelanggan Baru">
            <form onSubmit={handleAddCustomer} className="space-y-4">
                 <div><label className="text-slate-300">Nama</label><input type="text" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required /></div>
                 <div><label className="text-slate-300">Alamat</label><textarea value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required /></div>
                 <div><label className="text-slate-300">Paket</label><select value={newCustomerData.packageId} onChange={e => setNewCustomerData({...newCustomerData, packageId: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required><option value="">Pilih Paket</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name} - Rp{p.price.toLocaleString('id-ID')}</option>)}</select></div>
                 {user.role !== Role.SALES && (
                    <div><label className="text-slate-300">Sales</label><select value={newCustomerData.salesId} onChange={e => setNewCustomerData({...newCustomerData, salesId: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required><option value="">Pilih Sales</option>{salesUsers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                 )}
                 <div><label className="text-slate-300">Tanggal Jatuh Tempo Berikutnya</label><input type="date" value={newCustomerData.dueDate} onChange={e => setNewCustomerData({...newCustomerData, dueDate: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required /></div>
                <div className="pt-4 flex justify-end gap-2"><button type="button" onClick={() => setAddCustomerModalOpen(false)} className="bg-slate-600 px-4 py-2 rounded-lg">Batal</button><button type="submit" className="bg-blue-600 px-4 py-2 rounded-lg">Tambah</button></div>
            </form>
        </Modal>
    );

    const renderConfirmationModal = () => confirmationAction && (
        <Modal isOpen={true} onClose={() => setConfirmationAction(null)} title={confirmationAction.title} size="sm">
            <div className="text-slate-300">{confirmationAction.message}</div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setConfirmationAction(null)} className="bg-slate-600 font-semibold px-4 py-2 rounded-lg">Batal</button>
                <button onClick={confirmationAction.onConfirm} className="bg-blue-600 font-semibold px-4 py-2 rounded-lg">Ya, Lanjutkan</button>
            </div>
        </Modal>
    );
    
    const renderInvoiceModal = () => (
         <Modal isOpen={!!invoiceImageUrl} onClose={() => { setInvoiceCustomer(null); setInvoiceImageUrl(null); }} title="Cetak Invoice">
            <div>
                 {invoiceImageUrl ? (
                    <>
                        <img src={invoiceImageUrl} alt="Invoice" className="w-full border border-slate-600 rounded" />
                        <a 
                            href={invoiceImageUrl} 
                            download={`invoice-${invoiceCustomer?.id}.jpeg`}
                            className="w-full block text-center mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            Download Invoice
                        </a>
                    </>
                 ) : (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-slate-300">Membuat gambar invoice...</p>
                    </div>
                 )}
            </div>
        </Modal>
    );


    if (user.role === Role.SALES && (activeView === 'new-install' || activeView === 'dashboard')) {
        return (
             <div className="bg-slate-800 rounded-lg shadow-lg p-6">
                 {renderAddCustomerModal()}
                 <h2 className="text-2xl font-bold text-white mb-4">Request Pemasangan Baru</h2>
                 <form onSubmit={handleAddCustomer} className="space-y-4">
                 <div><label className="text-slate-300">Nama</label><input type="text" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required /></div>
                 <div><label className="text-slate-300">Alamat</label><textarea value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required /></div>
                 <div><label className="text-slate-300">Paket</label><select value={newCustomerData.packageId} onChange={e => setNewCustomerData({...newCustomerData, packageId: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required><option value="">Pilih Paket</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name} - Rp{p.price.toLocaleString('id-ID')}</option>)}</select></div>
                 <div><label className="text-slate-300">Tanggal Jatuh Tempo Berikutnya</label><input type="date" value={newCustomerData.dueDate} onChange={e => setNewCustomerData({...newCustomerData, dueDate: e.target.value})} className="w-full bg-slate-700 p-2 rounded-lg mt-1" required /></div>
                 <div className="pt-4 flex justify-end gap-2"><button type="submit" className="w-full bg-blue-600 px-4 py-3 rounded-lg font-bold">Kirim Request</button></div>
                 </form>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{getDashboardTitle()}</h1>
                    <p className="text-slate-400 mt-1">Kelola data pelanggan, pembayaran, dan status layanan.</p>
                </div>
                <div className="flex items-center gap-2">
                    {user.role !== Role.SALES && <button onClick={() => setAddCustomerModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Tambah Pelanggan</button>}
                    <button onClick={exportData} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg">Export Data</button>
                </div>
            </header>

            <div className="flex flex-wrap space-x-1 bg-slate-800/50 p-1 rounded-lg">
                {(['All', ...Object.values(PaymentStatus), CustomerStatus.ISOLATED] as const).map(s => {
                    const config = statusConfig[s] || { text: s };
                    return (
                        <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filter === s ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-600'}`}>
                            {s === 'All' ? 'Semua' : config.text}
                        </button>
                    )
                })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCustomers.map(customer => (
                    <CustomerCard key={customer.id} customer={customer} packages={packages} users={users} user={user} onAction={handleAction} />
                ))}
            </div>

            {filteredCustomers.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-slate-800 rounded-lg">
                    <UsersIcon className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg font-medium text-white">Tidak Ada Pelanggan</h3>
                    <p className="mt-1 text-sm">Tidak ada pelanggan yang cocok dengan filter yang dipilih.</p>
                </div>
            )}
            
            {/* Hidden div for invoice generation */}
            <div className="fixed -left-[9999px] top-0">
                {invoiceCustomer && <div ref={invoiceRef}>
                    <InvoiceTemplate customer={invoiceCustomer} pkg={packages.find(p => p.id === invoiceCustomer.packageId)!} ispProfile={ispProfile} />
                </div>}
            </div>

            {renderAddCustomerModal()}
            {renderConfirmationModal()}
            {renderInvoiceModal()}
        </div>
    );
};

export default AdminDashboard;
