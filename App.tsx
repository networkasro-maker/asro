

import React, { useState, useEffect } from 'react';
import { AppUser, Role, InternetPackage, ActivityLog, Customer, IspProfile, WhatsAppTemplate, IssueReport, AccountStatus } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ManagementDashboard from './components/dashboards/SuperAdminDashboard';
import WhatsAppNotificationCenter from './components/dashboards/WhatsAppNotificationCenter';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import InitialSetup from './components/InitialSetup';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDbInitialized, setIsDbInitialized] = useState<boolean | null>(null);

  // States for data from Supabase
  const [users, setUsers] = useState<AppUser[]>([]);
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [ispProfile, setIspProfile] = useState<IspProfile | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  
  const [activeView, setActiveView] = useState('dashboard');
  
  const checkDbInitialization = async () => {
    const { data, error } = await supabase.from('isp_profile').select('id').limit(1);
    if (error) {
        console.error("Error checking DB initialization:", error);
        setIsDbInitialized(false);
        return;
    }
    setIsDbInitialized(data && data.length > 0);
  };

  useEffect(() => {
    checkDbInitialization();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    if (isDbInitialized === false) {
      setLoading(false);
      return;
    }
    
    if (session) {
      fetchUserProfileAndData(session.user.id, session.user.email!);
    } else {
      setLoading(false);
      setCurrentUser(null);
    }
  }, [session, isDbInitialized]);

  const fetchUserProfileAndData = async (userId: string, userEmail: string) => {
    setLoading(true);
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (profileError && profileError.code === 'PGRST116') { // PGRST116 means "The result contains 0 rows"
        // This is the "smart login" logic. If the profile doesn't exist, create it.
        console.log("Profile not found for this user. Creating a new one...");
        
        const newProfile = {
            id: userId,
            name: userEmail.split('@')[0], // Default name from email
            username: userEmail,
            role: userEmail === 'superadmin@asro.net' ? Role.SUPER_ADMIN : Role.CUSTOMER,
            status: AccountStatus.ACTIVE
        };

        const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

        if (createError) {
            console.error('Failed to create user profile automatically:', createError);
            await supabase.auth.signOut();
            setCurrentUser(null);
        } else if (createdProfile) {
            console.log("Profile created successfully!");
            const userWithRole: AppUser = { ...session!.user, ...createdProfile };
            setCurrentUser(userWithRole);
            await fetchAllData();
        }

    } else if (profileError) { // Other, unexpected errors
        console.error('Error fetching user profile:', profileError);
        await supabase.auth.signOut();
        setCurrentUser(null);
    } else if (profileData) { // Profile was found successfully
        const userWithRole: AppUser = { ...session!.user, ...profileData };
        setCurrentUser(userWithRole);
        await fetchAllData();
    }
    setLoading(false);
  };
  
  const fetchAllData = async () => {
    const [
        packagesRes,
        customersRes,
        usersRes,
        ispProfileRes,
        waTemplatesRes,
        activityLogsRes,
        issueReportsRes
    ] = await Promise.all([
        supabase.from('packages').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('profiles').select('id, name, role, status, username'),
        supabase.from('isp_profile').select('*').limit(1).single(),
        supabase.from('whatsapp_templates').select('*'),
        supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100),
        supabase.from('issue_reports').select('*').order('reportedAt', { ascending: false }),
    ]);

    if (packagesRes.data) setPackages(packagesRes.data);
    if (customersRes.data) setCustomers(customersRes.data);
    if (usersRes.data) setUsers(usersRes.data as AppUser[]);
    if (ispProfileRes.data) setIspProfile(ispProfileRes.data as IspProfile);
    if (waTemplatesRes.data) setWaTemplates(waTemplatesRes.data);
    if (activityLogsRes.data) setActivityLogs(activityLogsRes.data);
    if (issueReportsRes.data) setIssueReports(issueReportsRes.data);

    [packagesRes, customersRes, usersRes, ispProfileRes, waTemplatesRes, activityLogsRes, issueReportsRes].forEach(res => {
        if (res.error) console.error("Error fetching data:", res.error.message);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUsers([]);
    setPackages([]);
    setCustomers([]);
    setActivityLogs([]);
    setIspProfile(null);
    setWaTemplates([]);
    setIssueReports([]);
    checkDbInitialization();
  };
  
  const addActivityLog = async (action: string, user: AppUser) => {
    if (!user) return;
    const newLog = { userId: user.id, userName: user.name, userRole: user.role, action };
    const { data, error } = await supabase.from('activity_logs').insert(newLog).select();
    if (data) setActivityLogs(prevLogs => [data[0], ...prevLogs]);
    if (error) console.error('Error adding activity log:', error);
  };

  const handlePasswordUpdate = async (userId: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return { success: false, message: 'Gagal memperbarui password: ' + error.message };
    if(currentUser) addActivityLog('Mengubah password.', currentUser);
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
            user={currentUser} users={users} packages={packages} activityLogs={activityLogs} addActivityLog={addActivityLog} ispProfile={ispProfile!}
            waTemplates={waTemplates} activeView={activeView} refreshData={fetchAllData}
        />;
    }
    if ((currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) && activeView === 'whatsapp') {
      return <WhatsAppNotificationCenter user={currentUser} customers={customers} packages={packages} waTemplates={waTemplates} addActivityLog={addActivityLog} />
    }
    switch (currentUser.role) {
      case Role.SUPER_ADMIN:
      case Role.ADMIN:
      case Role.SALES:
        return <AdminDashboard user={currentUser} packages={packages} addActivityLog={addActivityLog} customers={customers} users={users}
                    ispProfile={ispProfile!} activeView={activeView} refreshData={fetchAllData} />;
      case Role.CUSTOMER:
        const customerData = customers.find(c => c.userId === currentUser.id);
        const customerReports = issueReports.filter(r => r.customerId === customerData?.id);
        return <CustomerDashboard user={currentUser} packages={packages} activeView={activeView} customer={customerData}
                    issueReports={customerReports} refreshData={fetchAllData} />;
      default:
        return <div>Anda tidak memiliki akses ke dasbor ini.</div>;
    }
  };
  
  const defaultIspProfile: IspProfile = { id: 'default', name: "ASRO.NET", logoUrl: "https://i.imgur.com/R0i1S1y.png", address: "Memuat...", contact: "", bankAccounts: [] };

  if (loading || isDbInitialized === null) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
            <img src={defaultIspProfile.logoUrl} alt="Logo" className="h-20 animate-pulse" />
            <p className="mt-4 text-xl tracking-wider">Memeriksa Database...</p>
          </div>
      )
  }
  
  if (isDbInitialized === false) {
      return <InitialSetup onSetupComplete={() => {
          setIsDbInitialized(true);
          setLoading(true); // force re-check session etc.
      }} />;
  }

  if (!session) {
    return <Login ispProfile={ispProfile || defaultIspProfile} />;
  }
  
  if (!currentUser) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
            <img src={defaultIspProfile.logoUrl} alt="Logo" className="h-20 animate-pulse" />
            <p className="mt-4 text-xl tracking-wider">Memuat Profil Pengguna...</p>
          </div>
      )
  }
  
  if (!ispProfile) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Profil ISP tidak dapat dimuat. Periksa koneksi dan pengaturan Supabase Anda.</div>;
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