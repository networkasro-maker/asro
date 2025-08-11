import React, { useState, useEffect } from 'react';
import { User, Role, InternetPackage, ActivityLog, Customer, IspProfile, WhatsAppTemplate } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ManagementDashboard from './components/dashboards/SuperAdminDashboard';
import WhatsAppNotificationCenter from './components/dashboards/WhatsAppNotificationCenter';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import { USERS, PACKAGES, ACTIVITY_LOGS, CUSTOMERS, ISP_PROFILE, WHATSAPP_TEMPLATES } from './constants';

// Custom hook to manage state with localStorage. It's a powerful pattern
// for creating persistent state without a backend.
function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // If item exists, parse it. Otherwise, return the initial default value.
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      // If parsing fails, log error and return default value.
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  // This effect runs whenever the `value` changes, saving it to localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}


const App: React.FC = () => {
  // Replace useState with our custom hook to make state persistent.
  const [users, setUsers] = useLocalStorageState<User[]>('asronet_users', USERS);
  const [packages, setPackages] = useLocalStorageState<InternetPackage[]>('asronet_packages', PACKAGES);
  const [customers, setCustomers] = useLocalStorageState<Customer[]>('asronet_customers', CUSTOMERS);
  const [activityLogs, setActivityLogs] = useLocalStorageState<ActivityLog[]>('asronet_activity_logs', ACTIVITY_LOGS);
  const [ispProfile, setIspProfile] = useLocalStorageState<IspProfile>('asronet_isp_profile', ISP_PROFILE);
  const [waTemplates, setWaTemplates] = useLocalStorageState<WhatsAppTemplate[]>('asronet_wa_templates', WHATSAPP_TEMPLATES);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard'); // Reset view on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const addActivityLog = (action: string, user: User) => {
    const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action,
        timestamp: new Date().toISOString()
    };
    setActivityLogs(prevLogs => [...prevLogs, newLog]);
  };

  const handlePasswordUpdate = (userId: string, oldPass: string, newPass: string): { success: boolean; message: string } => {
    const user = users.find(u => u.id === userId);

    if (!user) {
        return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    if (user.password !== oldPass) {
        return { success: false, message: 'Password saat ini salah.' };
    }

    setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, password: newPass } : u)
    );
    
    addActivityLog('Mengubah password.', user);
    
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
            setUsers={setUsers}
            packages={packages}
            setPackages={setPackages}
            activityLogs={activityLogs}
            addActivityLog={addActivityLog}
            ispProfile={ispProfile}
            setIspProfile={setIspProfile}
            waTemplates={waTemplates}
            setWaTemplates={setWaTemplates}
            activeView={activeView}
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
                    setCustomers={setCustomers}
                    users={users}
                    setUsers={setUsers}
                    ispProfile={ispProfile}
                    activeView={activeView}
                />;
      case Role.CUSTOMER:
        return <CustomerDashboard 
                    user={currentUser} 
                    packages={packages} 
                    activeView={activeView}
                />;
      default:
        return <div>Anda tidak memiliki akses ke dasbor ini.</div>;
    }
  };

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
