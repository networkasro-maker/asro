import React, { useState, useMemo, useEffect } from 'react';
import { User, Customer, InternetPackage, PaymentStatus, IssueReport, ModemLightStatus, CustomerStatus } from '../../types';
import { WifiIcon, ClockIcon, CheckCircleIcon, CameraIcon } from '../icons';
import Modal from '../Modal';
import { supabase } from '../../supabaseClient';


interface CustomerDashboardProps {
  user: User;
  customer: Customer;
  packages: InternetPackage[];
  activeView?: string;
  onDataChange: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, customer, packages, activeView, onDataChange }) => {
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [newReport, setNewReport] = useState<{modemLightStatus: ModemLightStatus, description: string, modemVideo?: File | null}>({
      modemLightStatus: ModemLightStatus.GREEN,
      description: '',
      modemVideo: null
  });

  const userPackage = useMemo(() => packages.find(p => p.id === customer?.packageId), [customer, packages]);
  
  useEffect(() => {
    const fetchReports = async () => {
        if (customer) {
            const { data, error } = await supabase
                .from('issue_reports')
                .select('*')
                .eq('customer_id', customer.id)
                .order('reported_at', { ascending: false });
            if (error) {
                console.error('Error fetching issue reports:', error);
            } else {
                setIssueReports(data as IssueReport[]);
            }
        }
    };
    fetchReports();
  }, [customer]);


  if (!customer || !userPackage) {
    return <div className="text-center p-8 text-white">Data pelanggan tidak ditemukan.</div>;
  }
  
  const handleReportSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newReport.description && !newReport.modemVideo) {
          alert("Keterangan atau video wajib diisi.");
          return;
      }
      
      // Note: Video upload to Supabase Storage is a more complex topic involving secure URLs.
      // For now, we'll just store a placeholder or skip it.
      const report: Omit<IssueReport, 'id'> = {
          customerId: customer.id,
          reportedAt: new Date().toISOString(),
          description: newReport.description,
          modemLightStatus: newReport.modemLightStatus,
          // modemVideo: newReport.modemVideo // This would need storage logic
      };

      const { error } = await supabase.from('issue_reports').insert({ ...report, id: `issue-${Date.now()}` });

      if (error) {
          alert(`Gagal mengirim laporan: ${error.message}`);
      } else {
          onDataChange(); // Refetch all data including reports
          setReportModalOpen(false);
          setNewReport({ modemLightStatus: ModemLightStatus.GREEN, description: '', modemVideo: null });
          alert('Laporan berhasil dikirim!');
      }
  };

  const InfoCard: React.FC<{icon: React.ReactNode, title: string, value: string, colorClass: string}> = ({icon, title, value, colorClass}) => (
    <div className="bg-slate-800 p-4 rounded-lg flex items-center">
        <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'billing':
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Tagihan & Riwayat Pembayaran</h2>
            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {/* Mock data for billing history */}
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-700" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div><CheckCircleIcon className="h-8 w-8 text-green-500 bg-slate-800 rounded-full"/></div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div><p className="text-sm text-slate-400">Pembayaran Tagihan Juli 2024</p></div>
                          <div className="text-right text-sm whitespace-nowrap text-slate-500"><time>15 Jul 2024</time></div>
                        </div>
                      </div>
                    </div>
                  </li>
                   <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div><ClockIcon className="h-8 w-8 text-yellow-500 bg-slate-800 rounded-full"/></div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div><p className="text-sm text-slate-400">Tagihan Agustus 2024</p></div>
                          <div className="text-right text-sm whitespace-nowrap text-slate-300 font-semibold"><p>Jatuh Tempo: {new Date(customer.dueDate).toLocaleDateString('id-ID')}</p></div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 'report-issue':
        return (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Laporan Gangguan</h2>
                    <button onClick={() => setReportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 duration-300">Buat Laporan Baru</button>
                 </div>
                 <div className="bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
                    {issueReports.length > 0 ? issueReports.map(report => (
                        <div key={report.id} className="p-4 bg-slate-700/50 rounded-lg">
                            <p className="font-bold text-white">Status Lampu: {report.modemLightStatus}</p>
                            <p className="text-slate-300 mt-1">{report.description}</p>
                            <p className="text-xs text-slate-500 mt-2">Dilaporkan pada: {new Date(report.reportedAt).toLocaleString('id-ID')}</p>
                        </div>
                    )) : <p className="text-center text-slate-400 py-6">Belum ada laporan gangguan.</p>}
                 </div>
            </div>
        );
      default: // dashboard
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <InfoCard icon={<WifiIcon className="h-6 w-6 text-white"/>} title="Paket Internet" value={userPackage.name} colorClass="bg-blue-500" />
              <InfoCard icon={<ClockIcon className="h-6 w-6 text-white"/>} title="Jatuh Tempo" value={new Date(customer.dueDate).toLocaleDateString('id-ID')} colorClass="bg-yellow-500"/>
              <InfoCard icon={<CheckCircleIcon className="h-6 w-6 text-white"/>} title="Status Langganan" value={customer.status} colorClass={customer.status === CustomerStatus.ACTIVE ? 'bg-green-500' : 'bg-red-500'}/>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Detail Akun</h3>
                <div className="space-y-3">
                    <p><strong className="text-slate-400 w-32 inline-block">ID Pelanggan:</strong> {customer.id.toUpperCase()}</p>
                    <p><strong className="text-slate-400 w-32 inline-block">Nama:</strong> {customer.name}</p>
                    <p><strong className="text-slate-400 w-32 inline-block">Alamat:</strong> {customer.address}</p>
                    <p><strong className="text-slate-400 w-32 inline-block">Tagihan:</strong> Rp {userPackage.price.toLocaleString('id-ID')}</p>
                    <p><strong className="text-slate-400 w-32 inline-block">Status Bayar:</strong> <span className={`font-semibold ${
                        customer.paymentStatus === PaymentStatus.PAID ? 'text-green-400' :
                        customer.paymentStatus === PaymentStatus.UNPAID ? 'text-red-400' : 'text-yellow-400'
                    }`}>{customer.paymentStatus}</span></p>
                </div>
            </div>
          </>
        );
    }
  };


  return (
    <div className="space-y-8">
      <header className="flex items-center space-x-4">
        <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=0284c7&color=fff`} alt="Profile" className="h-20 w-20 rounded-full border-4 border-slate-700" />
        <div>
          <h1 className="text-3xl font-bold text-white">Selamat Datang, {user.name}!</h1>
          <p className="text-slate-400">ID Pelanggan: {customer.id.toUpperCase()}</p>
        </div>
      </header>
      
      {renderContent()}

      <Modal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} title="Buat Laporan Gangguan Baru">
         <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status Lampu Modem</label>
                <select 
                    value={newReport.modemLightStatus}
                    onChange={e => setNewReport({...newReport, modemLightStatus: e.target.value as ModemLightStatus})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {Object.values(ModemLightStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload/Rekam Video Modem (opsional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <CameraIcon className="mx-auto h-12 w-12 text-slate-500"/>
                        <div className="flex text-sm text-slate-500">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none p-1">
                                <span>Upload file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="video/*" capture="environment" onChange={(e) => setNewReport({...newReport, modemVideo: e.target.files?.[0]})} />
                            </label>
                            <p className="pl-1">atau rekam langsung</p>
                        </div>
                        <p className="text-xs text-slate-600">{newReport.modemVideo?.name || 'MP4, MOV, WEBM hingga 10MB'}</p>
                    </div>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Keterangan Tambahan</label>
                <textarea 
                    rows={3} 
                    value={newReport.description}
                    onChange={e => setNewReport({...newReport, description: e.target.value})}
                    placeholder="Jelaskan kendala yang Anda alami..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
            </div>
            <div className="pt-4 flex justify-end">
                <button type="button" onClick={() => setReportModalOpen(false)} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg mr-2">Batal</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Kirim Laporan</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerDashboard;