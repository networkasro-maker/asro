import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, InternetPackage, ActivityLog, Customer, IspProfile, WhatsAppTemplate } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ManagementDashboard from './components/dashboards/SuperAdminDashboard';
import WhatsAppNotificationCenter from './components/dashboards/WhatsAppNotificationCenter';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [ispProfile, setIspProfile] = useState<IspProfile | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        usersRes,
        packagesRes,
        customersRes,
        logsRes,
        profileRes,
        templatesRes
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('packages').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('activity_logs').select('*'),
        supabase.from('isp_profile').select('*').limit(1).single(),
        supabase.from('whatsapp_templates').select('*')
      ]);

      const checkError = (res: { data: any, error: PostgrestError | null }, name: string) => {
        if (res.error) throw new Error(`Failed to fetch ${name}: ${res.error.message}`);
        return res.data;
      };

      setUsers(checkError(usersRes, 'users'));
      setPackages(checkError(packagesRes, 'packages'));
      setCustomers(checkError(customersRes, 'customers'));
      setActivityLogs(checkError(logsRes, 'activity logs'));
      setIspProfile(checkError(profileRes, 'ISP profile'));
      setWaTemplates(checkError(templatesRes, 'WA templates'));

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const addActivityLog = async (action: string, user: User) => {
    const newLog: Omit<ActivityLog, 'id'> = {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action,
        timestamp: new Date().toISOString()
    };
    const { data, error } = await supabase.from('activity_logs').insert({...newLog, id: `log-${Date.now()}`}).select();
    if (error) {
      console.error("Failed to add activity log:", error);
    } else if (data) {
      setActivityLogs(prevLogs => [...prevLogs, data[0]]);
    }
  };

  const handlePasswordUpdate = async (userId: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Pengguna tidak ditemukan.' };
    if (user.password !== oldPass) return { success: false, message: 'Password saat ini salah.' };

    const { error } = await supabase.from('users').update({ password: newPass }).eq('id', userId);
    if (error) {
        return { success: false, message: `Gagal memperbarui: ${error.message}` };
    }
    
    await addActivityLog('Mengubah password.', user);
    await fetchData(); // Refresh data
    return { success: true, message: 'Password berhasil diperbarui!' };
  };

  const renderContent = () => {
    if (!currentUser) return null;

    const managementViews = ['users', 'packages', 'logs', 'settings'];

    if ((currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) && managementViews.includes(activeView)) {
      if (currentUser.role === Role.ADMIN && activeView === 'settings') {
        return <div className="text-white p-6 bg-slate-800 rounded-lg">Akses ditolak. Hanya Super Admin yang dapat mengakses halaman ini.</div>;
      }
      return <ManagementDashboard
          user={currentUser}
          users={users}
          packages={packages}
          activityLogs={activityLogs}
          addActivityLog={addActivityLog}
          ispProfile={ispProfile!}
          waTemplates={waTemplates}
          activeView={activeView}
          onDataChange={fetchData} // Pass the refetch function
      />;
    }
    
    if ((currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) && activeView === 'whatsapp') {
      return <WhatsAppNotificationCenter 
        user={currentUser} 
        customers={customers} 
        packages={packages}
        waTemplates={waTemplates}
        addActivityLog={addActivityLog}
      />
    }

    switch (currentUser.role) {
      case Role.SUPER_ADMIN:
      case Role.ADMIN:
      case Role.SALES:
        return <AdminDashboard 
          user={currentUser} 
          packages={packages} 
          addActivityLog={addActivityLog}
          customers={customers}
          users={users}
          ispProfile={ispProfile!}
          activeView={activeView}
          onDataChange={fetchData}
        />;
      case Role.CUSTOMER:
        const customerUser = users.find(u => u.id === currentUser.id);
        const customerData = customers.find(c => c.userId === currentUser.id);
        if (!customerUser || !customerData) {
            return <div>Data Pelanggan tidak ditemukan.</div>
        }
        return <CustomerDashboard 
            user={currentUser} 
            customer={customerData}
            packages={packages} 
            activeView={activeView}
            onDataChange={fetchData}
        />;
      default:
        return <div>Anda tidak memiliki akses ke dasbor ini.</div>;
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
            <p className="mt-4 text-lg">Memuat data dari server...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl text-red-500 font-bold">Terjadi Kesalahan</h2>
            <p className="mt-2 text-slate-400 text-center">Gagal terhubung ke database. Pastikan konfigurasi Supabase Anda benar.</p>
            <pre className="mt-4 p-4 bg-slate-800 text-red-300 rounded-lg text-xs w-full max-w-lg overflow-x-auto">{error}</pre>
        </div>
    );
  }
  
  if (!ispProfile) {
     return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Gagal memuat profil ISP.</div>
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} ispProfile={ispProfile} />;
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      onPasswordUpdate={handlePasswordUpdate} 
      ispProfile={ispProfile}
      activeView={activeView}
      setActiveView={setActiveView}
    >
        {renderContent()}
    </Layout>
  );
};

export default App;