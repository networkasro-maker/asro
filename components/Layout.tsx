import React, { useState } from 'react';
import { Role, User, IspProfile } from '../types';
import { HomeIcon, UsersIcon, PackageIcon, SettingsIcon, LogoutIcon, BarChartIcon, FileTextIcon, MenuIcon, XIcon, AlertTriangleIcon, ClipboardListIcon, MessageSquareIcon, KeyIcon } from './icons';
import ChangePasswordModal from './ChangePasswordModal';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onPasswordUpdate: (userId: string, oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  ispProfile: IspProfile;
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick?.(); }}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </a>
);

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, onPasswordUpdate, ispProfile, activeView, setActiveView }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  const renderNavLinks = () => {
    const commonLinks = [
        { key: 'dashboard', icon: <HomeIcon className="h-5 w-5" />, label: 'Dashboard' },
    ];
    
    const customerManagementLinks = [
        { key: 'customers', icon: <UsersIcon className="h-5 w-5" />, label: 'Data Pelanggan' },
        { key: 'whatsapp', icon: <MessageSquareIcon className="h-5 w-5" />, label: 'Notifikasi WA' },
        { key: 'reports', icon: <BarChartIcon className="h-5 w-5" />, label: 'Pembukuan' },
        { key: 'issues', icon: <AlertTriangleIcon className="h-5 w-5" />, label: 'Laporan Gangguan' },
    ];
    
    const userManagementLinks = [
        { key: 'users', icon: <UsersIcon className="h-5 w-5" />, label: 'Kelola Pengguna' },
        { key: 'packages', icon: <PackageIcon className="h-5 w-5" />, label: 'Kelola Paket' },
        { key: 'logs', icon: <ClipboardListIcon className="h-5 w-5" />, label: 'Log Aktivitas' },
    ]

    const customerNavLinks = [
        { key: 'dashboard', icon: <HomeIcon className="h-5 w-5" />, label: 'Dashboard' },
        { key: 'billing', icon: <FileTextIcon className="h-5 w-5" />, label: 'Tagihan & Riwayat' },
        { key: 'report-issue', icon: <AlertTriangleIcon className="h-5 w-5" />, label: 'Lapor Gangguan' },
    ];

    switch (user.role) {
      case Role.SUPER_ADMIN:
        return [
          ...commonLinks,
          ...customerManagementLinks,
          ...userManagementLinks,
          { key: 'settings', icon: <SettingsIcon className="h-5 w-5" />, label: 'Pengaturan Sistem' },
        ];
      case Role.ADMIN:
        return [
          ...commonLinks,
          ...customerManagementLinks,
          ...userManagementLinks,
        ];
      case Role.SALES:
        return [
          ...commonLinks,
          { key: 'my-customers', icon: <UsersIcon className="h-5 w-5" />, label: 'Pelanggan Saya' },
          { key: 'new-install', icon: <PackageIcon className="h-5 w-5" />, label: 'Request Pemasangan' },
        ];
      case Role.CUSTOMER:
        return customerNavLinks;
      default:
        return commonLinks;
    }
  };
  
  const SidebarContent = () => (
     <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-20 border-b border-slate-700 px-4">
          <img src={ispProfile.logoUrl} alt="Logo" className="h-10" />
          <span className="text-white text-xl font-bold ml-2 truncate">{ispProfile.name}</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {renderNavLinks().map(link => (
                <NavLink 
                    key={link.key} 
                    icon={link.icon} 
                    label={link.label}
                    active={activeView === link.key}
                    onClick={() => {
                        setActiveView(link.key)
                        if(sidebarOpen) setSidebarOpen(false);
                    }} 
                />
            ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700 space-y-2">
          <NavLink icon={<KeyIcon className="h-5 w-5" />} label="Ubah Password" onClick={() => {
              setChangePasswordModalOpen(true);
              if (sidebarOpen) setSidebarOpen(false);
          }} />
          <NavLink icon={<LogoutIcon className="h-5 w-5" />} label="Logout" onClick={onLogout} />
        </div>
      </div>
  );


  return (
    <>
      <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`} role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-900/80" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-800 border-r border-slate-700">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XIcon className="h-6 w-6 text-white"/>
                  </button>
              </div>
              <SidebarContent />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 bg-slate-800 border-r border-slate-700">
            <SidebarContent />
          </div>
        </div>

        <div className="flex-1 flex flex-col md:pl-64">
          <header className="sticky top-0 z-10 md:hidden h-16 flex items-center justify-between bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 px-4">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="h-6 w-6"/>
            </button>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-white">{user.name}</span>
              <img className="h-8 w-8 rounded-full" src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=0284c7&color=fff`} alt="User"/>
            </div>
          </header>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        user={user}
        onUpdatePassword={onPasswordUpdate}
      />
    </>
  );
};

export default Layout;