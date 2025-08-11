import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { User, Role, InternetPackage, ActivityLog, Customer, IspProfile, WhatsAppTemplate, CustomerStatus, PaymentStatus, AccountStatus, IssueReport } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ManagementDashboard from './components/dashboards/SuperAdminDashboard';
import WhatsAppNotificationCenter from './components/dashboards/WhatsAppNotificationCenter';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import { supabase } from './lib/supabaseClient';
import { ISP_PROFILE } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Application Data State
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [ispProfile, setIspProfile] = useState<IspProfile>(ISP_PROFILE);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);

  // Fetch functions
  const fetchUsers = useCallback(async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (data) setUsers(data);
      if (error) console.error('Error fetching users:', error.message);
  }, []);

  const fetchPackages = useCallback(async () => {
      const { data, error } = await supabase.from('packages').select('*');
      if (data) setPackages(data);
      if (error) console.error('Error fetching packages:', error.message);
  }, []);
  
  const fetchCustomers = useCallback(async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (data) setCustomers(data);
      if (error) console.error('Error fetching customers:', error.message);
  }, []);

  const fetchActivityLogs = useCallback(async () => {
      const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (data) setActivityLogs(data);
      if (error) console.error('Error fetching activity logs:', error.message);
  }, []);
  
  const fetchIssueReports = useCallback(async (customerId?: string) => {
      let query = supabase.from('issue_reports').select('*').order('reportedAt', { ascending: false });
      if (customerId) {
        query = query.eq('customerId', customerId);
      }
      const { data, error } = await query;
      if (data) setIssueReports(data);
      if (error) console.error('Error fetching issue reports:', error.message);
  }, []);

  const fetchIspProfile = useCallback(async () => {
      const { data, error } = await supabase.from('isp_profile').select('*').eq('id', 1).single();
      if (data) setIspProfile(data);
      else if (error) console.error('Error fetching ISP profile:', error.message);
  }, []);

  const fetchWaTemplates = useCallback(async () => {
      const { data, error } = await supabase.from('whatsapp_templates').select('*');
      if (data) setWaTemplates(data);
      if (error) console.error('Error fetching WA templates:', error.message);
  }, []);

  const fetchAllAdminData = useCallback(async () => {
      await Promise.all([
          fetchUsers(),
          fetchPackages(),
          fetchCustomers(),
          fetchActivityLogs(),
          fetchIspProfile(),
          fetchWaTemplates(),
          fetchIssueReports()
      ]);
  }, [fetchUsers, fetchPackages, fetchCustomers, fetchActivityLogs, fetchIspProfile, fetchWaTemplates, fetchIssueReports]);

  const fetchAllCustomerData = useCallback(async (customerUserId: string) => {
      const { data: customerData, error: customerError } = await supabase.from('customers').select('*').eq('userId', customerUserId).single();
      if (customerError) {
        console.error("Failed to get customer profile", customerError);
        return;
      }
      if (customerData) {
        await Promise.all([
            fetchPackages(),
            fetchIspProfile(),
            fetchIssueReports(customerData.id),
        ]);
        setCustomers([customerData]);
      }
  }, [fetchPackages, fetchIspProfile, fetchIssueReports]);
  
  const fetchCurrentUser = useCallback(async (userId: string) => {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) {
          console.error("Error fetching user profile:", error);
          await handleLogout();
      } else if (data) {
          setCurrentUser(data);
      }
  }, []);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCurrentUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (!currentUser || currentUser.id !== session.user.id) {
            fetchCurrentUser(session.user.id);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCurrentUser, currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === Role.CUSTOMER) {
        fetchAllCustomerData(currentUser.id).finally(() => setLoading(false));
      } else {
        fetchAllAdminData().finally(() => setLoading(false));
      }
    }
  }, [currentUser, fetchAllAdminData, fetchAllCustomerData]);

  const [activeView, setActiveView] = useState('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    setUsers([]);
    setCustomers([]);
    setPackages([]);
  };
  
  const addActivityLog = useCallback(async (action: string, user: User) => {
    const { error } = await supabase.from('activity_logs').insert({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action,
    });
    if (error) console.error("Error adding log:", error);
    else fetchActivityLogs();
  }, [fetchActivityLogs]);

  const handlePasswordUpdate = async (newPass: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return { success: false, message: 'Gagal memperbarui password: ' + error.message };
    
    addActivityLog('Mengubah password.', currentUser!);
    return { success: true, message: 'Password berhasil diperbarui!' };
  };
  
  // --- Mutation Handlers ---
  const handleCustomerUpdate = async (customerId: string, updates: Partial<Customer>) => {
      const { error } = await supabase.from('customers').update(updates).eq('id', customerId);
      if (!error) {
        fetchCustomers();
        return true;
      }
      console.error('Failed to update customer', error);
      return false;
  };
  
  const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
      const { error } = await supabase.from('users').update(updates).eq('id', userId);
      if (!error) {
        fetchUsers();
        return true;
      }
      console.error('Failed to update user', error);
      return false;
  };
  
  const handleUserAdd = async (userData: Omit<User, 'id' | 'status'>) => {
      // This only creates a public profile. Auth user must be created separately in Supabase dashboard.
      const { error } = await supabase.from('users').insert({ ...userData, status: AccountStatus.ACTIVE });
      if (!error) {
        fetchUsers();
        return true;
      }
      console.error('Failed to add user', error);
      return false;
  }
  
  const handleCustomerAdd = async (customerData: Pick<Customer, 'name' | 'address' | 'packageId' | 'dueDate'>, salesId: string) => {
       console.warn("This simplified flow does not create a login for the new customer.");
       const newUserId = `user-${Date.now()}`;
       const newCustomerId = `cust-${Date.now()}`;

       // Step 1: Create a profile for the new customer (they won't be able to log in)
       const { error: userError } = await supabase.from('users').insert({
          id: newUserId,
          name: customerData.name,
          username: `${newCustomerId}@asro.net`, // Dummy email
          role: Role.CUSTOMER,
          status: AccountStatus.ACTIVE,
       });

       if (userError) {
          console.error("Failed to create user profile for customer", userError);
          return false;
       }
       
       // Step 2: Create the customer record
       const { error: customerError } = await supabase.from('customers').insert({
         ...customerData,
         id: newCustomerId,
         userId: newUserId,
         salesId: salesId,
         status: CustomerStatus.ACTIVE,
         paymentStatus: PaymentStatus.UNPAID,
       });

       if (!customerError) {
          await Promise.all([fetchCustomers(), fetchUsers()]);
          addActivityLog(`Menambahkan pelanggan baru: ${customerData.name}`, currentUser!);
          return true;
       } else {
         console.error('Failed to add customer', customerError);
         // TODO: Add logic to delete the created user profile if customer creation fails
         return false;
       }
  };

  const handlePackageAdd = async (packageData: Omit<InternetPackage, 'id'>) => {
    const { error } = await supabase.from('packages').insert(packageData);
    if (!error) { fetchPackages(); return true; }
    console.error('Failed to add package', error); return false;
  };

  const handlePackageUpdate = async (packageId: string, updates: Partial<InternetPackage>) => {
    const { error } = await supabase.from('packages').update(updates).eq('id', packageId);
    if (!error) { fetchPackages(); return true; }
    console.error('Failed to update package', error); return false;
  };

  const handlePackageDelete = async (packageId: string) => {
    const { error } = await supabase.from('packages').delete().eq('id', packageId);
    if (!error) { fetchPackages(); return true; }
    console.error('Failed to delete package', error); return false;
  };

  const handleProfileUpdate = async (profileData: IspProfile) => {
    const { id, ...restOfProfile } = profileData;
    const { error } = await supabase.from('isp_profile').update(restOfProfile).eq('id', 1);
    if (!error) { fetchIspProfile(); return true; }
    console.error('Failed to update ISP profile', error); return false;
  };

  const handleWaTemplateAdd = async (templateData: Omit<WhatsAppTemplate, 'id'>) => {
    const { error } = await supabase.from('whatsapp_templates').insert(templateData);
    if (!error) { fetchWaTemplates(); return true; }
    console.error('Failed to add WA template', error); return false;
  };

  const handleWaTemplateUpdate = async (templateId: string, updates: Partial<WhatsAppTemplate>) => {
    const { error } = await supabase.from('whatsapp_templates').update(updates).eq('id', templateId);
    if (!error) { fetchWaTemplates(); return true; }
    console.error('Failed to update WA template', error); return false;
  };
  
  const handleWaTemplateDelete = async (templateId: string) => {
    const { error } = await supabase.from('whatsapp_templates').delete().eq('id', templateId);
    if (!error) { fetchWaTemplates(); return true; }
    console.error('Failed to delete WA template', error); return false;
  };
  
  const handleIssueReportAdd = async (reportData: Omit<IssueReport, 'id'|'reportedAt'|'customerId'>) => {
    if (!currentUser || !customers.length) return false;
    const customer = customers.find(c => c.userId === currentUser.id);
    if (!customer) return false;

    // TODO: Handle video upload to Supabase Storage
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { modemVideo, ...restOfReport } = reportData;
    
    const { error } = await supabase.from('issue_reports').insert({
      ...restOfReport,
      customerId: customer.id,
      modemVideo: null, // Placeholder for storage URL
    });
    if (!error) { fetchIssueReports(customer.id); return true; }
    console.error('Failed to add issue report', error); return false;
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
            ispProfile={ispProfile}
            waTemplates={waTemplates}
            activeView={activeView}
            onUserAdd={handleUserAdd}
            onUserUpdate={handleUserUpdate}
            onPackageAdd={handlePackageAdd}
            onPackageUpdate={handlePackageUpdate}
            onPackageDelete={handlePackageDelete}
            onProfileUpdate={handleProfileUpdate}
            onWaTemplateAdd={handleWaTemplateAdd}
            onWaTemplateUpdate={handleWaTemplateUpdate}
            onWaTemplateDelete={handleWaTemplateDelete}
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
                    onCustomerUpdate={handleCustomerUpdate}
                    onCustomerAdd={handleCustomerAdd}
                    users={users}
                    ispProfile={ispProfile}
                    activeView={activeView}
                />;
      case Role.CUSTOMER:
        const customerProfile = customers.find(c => c.userId === currentUser.id);
        const userPackage = packages.find(p => p.id === customerProfile?.packageId);
        return <CustomerDashboard 
                    user={currentUser}
                    customer={customerProfile}
                    userPackage={userPackage}
                    issueReports={issueReports}
                    onIssueReport={handleIssueReportAdd}
                    packages={packages} 
                    activeView={activeView}
                />;
      default:
        return <div>Anda tidak memiliki akses ke dasbor ini.</div>;
    }
  };

  if (loading) {
    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
            <p className="mt-4 text-lg">Memuat Aplikasi...</p>
        </div>
    );
  }

  if (!currentUser) {
    return <Login ispProfile={ispProfile} />;
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
