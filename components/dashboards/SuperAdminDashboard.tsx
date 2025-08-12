

import React, { useState, useRef, useEffect } from 'react';
import { AppUser, Role, InternetPackage, IspProfile, WhatsAppTemplate, AccountStatus, ActivityLog } from '../../types';
import Modal from '../Modal';
import { supabase } from '../../supabaseClient';
import { DownloadIcon, PencilIcon, TrashIcon, PlusCircleIcon, KeyIcon } from '../icons';

declare var XLSX: any;

interface ManagementDashboardProps {
  user: AppUser;
  activeView?: string;
  users: AppUser[];
  packages: InternetPackage[];
  activityLogs: ActivityLog[];
  addActivityLog: (action: string, user: AppUser) => void;
  ispProfile: IspProfile;
  waTemplates: WhatsAppTemplate[];
  refreshData: () => Promise<void>;
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ 
  user, activeView, users, packages, activityLogs, addActivityLog,
  ispProfile, waTemplates, refreshData
}) => {
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({ name: '', username: '', role: Role.SALES });
  
  const [isPackageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<InternetPackage | null>(null);

  const [profileForm, setProfileForm] = useState(ispProfile);
  useEffect(() => { setProfileForm(ispProfile) }, [ispProfile]);
    
  const [isWaTemplateModalOpen, setWaTemplateModalOpen] = useState(false);
  const [editingWaTemplate, setEditingWaTemplate] = useState<WhatsAppTemplate | null>(null);
  const [waTemplateFormData, setWaTemplateFormData] = useState<Omit<WhatsAppTemplate, 'id'>>({ name: '', template: '' });
  

  const handleToggleUserStatus = async (targetUser: AppUser) => {
    if (user.role === Role.ADMIN && targetUser.role === Role.ADMIN) {
        alert("Aksi tidak diizinkan.");
        return;
    }
    const newStatus = targetUser.status === AccountStatus.ACTIVE ? AccountStatus.FROZEN : AccountStatus.ACTIVE;
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', targetUser.id);
    if(error) {
      alert(`Gagal mengubah status: ${error.message}`);
    } else {
      const actionLog = `${newStatus === AccountStatus.FROZEN ? 'Membekukan' : 'Mengaktifkan'} pengguna: ${targetUser.name}`;
      addActivityLog(actionLog, user);
      await refreshData();
    }
  };

  const openEditUserModal = (userToEdit: AppUser) => {
    setEditingUser(userToEdit);
    setUserFormData(userToEdit);
    setUserModalOpen(true);
  };
  
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.username) {
        alert("Nama dan email wajib diisi.");
        return;
    }
    if (!editingUser) {
        alert("Fungsi ini hanya untuk mengedit pengguna.");
        return;
    }

    setIsSubmitting(true);
    
    if (user.role === Role.ADMIN && editingUser.role === Role.ADMIN) {
      alert("Admin tidak dapat mengedit data Admin lain.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('profiles').update({ name: userFormData.name, username: userFormData.username, role: userFormData.role }).eq('id', editingUser.id);
    if (error) {
        alert(`Gagal memperbarui pengguna: ${error.message}`);
    } else {
        addActivityLog(`Memperbarui pengguna: ${userFormData.name}`, user);
        await refreshData();
        setUserModalOpen(false);
    }
    
    setIsSubmitting(false);
  };

  const exportUsersToExcel = () => {
      let usersToExportQuery = users.filter(u => u.role === Role.ADMIN || u.role === Role.SALES);
      if (user.role === Role.ADMIN) {
        usersToExportQuery = users.filter(u => u.role === Role.SALES);
      }
      const ws = XLSX.utils.json_to_sheet(usersToExportQuery.map(({ name, username, role }) => ({ Nama: name, Username: username, Role: role })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pengguna");
      XLSX.writeFile(wb, "Daftar_Pengguna_ASRO_NET.xlsx");
      addActivityLog('Mengekspor data pengguna ke Excel.', user);
  };

  const handleSavePackage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));

    if (!name || isNaN(price) || price <= 0) {
        alert("Nama dan harga paket valid wajib diisi.");
        return;
    }
    setIsSubmitting(true);

    let error;
    if (editingPackage) {
        const result = await supabase.from('packages').update({ name, price }).eq('id', editingPackage.id);
        error = result.error;
        if (!error) addActivityLog(`Memperbarui paket: ${name}`, user);
    } else {
        const result = await supabase.from('packages').insert({ name, price });
        error = result.error;
        if (!error) addActivityLog(`Menambahkan paket baru: ${name}`, user);
    }

    if (error) {
        alert(`Gagal menyimpan paket: ${error.message}`);
    } else {
        await refreshData();
        setPackageModalOpen(false);
        setEditingPackage(null);
    }
    setIsSubmitting(false);
  };
  
  const handleDeletePackage = async (packageId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus paket ini? Ini tidak bisa dibatalkan.")) {
        const { error } = await supabase.from('packages').delete().eq('id', packageId);
        if (error) {
            alert(`Gagal menghapus paket: ${error.message}`);
        } else {
            addActivityLog(`Menghapus paket ID: ${packageId}`, user);
            await refreshData();
        }
    }
  };
  
  const handleSaveIspProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      const { error } = await supabase.from('isp_profile').update(profileForm).eq('id', ispProfile.id);
      if (error) {
          alert(`Gagal menyimpan profil: ${error.message}`);
      } else {
          addActivityLog('Memperbarui profil ISP', user); 
          await refreshData();
          alert("Profil ISP berhasil disimpan!");
      }
      setIsSubmitting(false);
  };
  
  const handleSaveWaTemplate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!waTemplateFormData.name || !waTemplateFormData.template) {
          alert("Nama dan isi templat wajib diisi.");
          return;
      }
      setIsSubmitting(true);
      let error;
      if (editingWaTemplate) {
          const result = await supabase.from('whatsapp_templates').update({ name: waTemplateFormData.name, template: waTemplateFormData.template }).eq('id', editingWaTemplate.id);
          error = result.error;
          if(!error) addActivityLog(`Memperbarui templat WA: ${waTemplateFormData.name}`, user);
      } else {
          const result = await supabase.from('whatsapp_templates').insert(waTemplateFormData);
          error = result.error;
          if(!error) addActivityLog(`Menambahkan templat WA baru: ${waTemplateFormData.name}`, user);
      }
      
      if (error) {
          alert(`Gagal menyimpan templat: ${error.message}`);
      } else {
          await refreshData();
          setWaTemplateModalOpen(false);
      }
      setIsSubmitting(false);
  };
  
  const handleDeleteWaTemplate = async (templateId: string) => {
      if (window.confirm("Anda yakin ingin menghapus templat ini?")) {
          const templateNameToDelete = waTemplates.find(t => t.id === templateId)?.name;
          const { error } = await supabase.from('whatsapp_templates').delete().eq('id', templateId);
          if (error) {
            alert(`Gagal menghapus templat: ${error.message}`);
          } else {
            addActivityLog(`Menghapus templat WA: ${templateNameToDelete}`, user);
            await refreshData();
          }
      }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        const usersToDisplay = (user.role === Role.SUPER_ADMIN
            ? users.filter(u => u.role === Role.ADMIN || u.role === Role.SALES)
            : users.filter(u => u.role === Role.SALES)
        );
        return (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Kelola Pengguna</h2>
            <p className="text-sm text-slate-400 mb-6">Untuk menambah pengguna baru, gunakan fitur <strong className="text-white">'Invite user'</strong> di dasbor Supabase Anda.</p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={exportUsersToExcel} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 text-sm"><DownloadIcon className="h-4 w-4" /> Export</button>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nama</th><th scope="col" className="px-6 py-3">Email/Username</th><th scope="col" className="px-6 py-3">Role</th><th scope="col" className="px-6 py-3">Status</th><th scope="col" className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {usersToDisplay.map(u => {
                    const canPerformAction = user.role === Role.SUPER_ADMIN || u.role === Role.SALES;
                    return (
                        <tr key={u.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                          <td className="px-6 py-4">{u.username}</td>
                          <td className="px-6 py-4">{u.role}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === AccountStatus.ACTIVE ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{u.status}</span></td>
                          <td className="px-6 py-4 text-right space-x-4">
                            <button onClick={() => openEditUserModal(u)} className={`font-medium text-blue-400 hover:underline ${!canPerformAction && 'opacity-50 cursor-not-allowed'}`} disabled={!canPerformAction}>Edit</button>
                            <button onClick={() => handleToggleUserStatus(u)} className={`font-medium ${u.status === AccountStatus.ACTIVE ? 'text-red-500 hover:underline' : 'text-green-500 hover:underline'} ${!canPerformAction && 'opacity-50 cursor-not-allowed'}`} disabled={!canPerformAction}>{u.status === AccountStatus.ACTIVE ? 'Bekukan' : 'Aktifkan'}</button>
                          </td>
                        </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'packages':
        return (
          <div className="bg-slate-800 rounded-lg p-6">
             <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Kelola Paket Internet</h2><button onClick={() => { setEditingPackage(null); setPackageModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Tambah Paket</button></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-700/50"><tr><th scope="col" className="px-6 py-3">Nama Paket</th><th scope="col" className="px-6 py-3">Harga</th><th scope="col" className="px-6 py-3 text-right">Aksi</th></tr></thead>
                <tbody>
                  {packages.map(p => (<tr key={p.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50"><td className="px-6 py-4 font-medium text-white">{p.name}</td><td className="px-6 py-4">Rp {p.price.toLocaleString('id-ID')}</td><td className="px-6 py-4 text-right space-x-4"><button onClick={() => { setEditingPackage(p); setPackageModalOpen(true); }} className="font-medium text-blue-400 hover:underline">Edit</button><button onClick={() => handleDeletePackage(p.id)} className="font-medium text-red-400 hover:underline">Hapus</button></td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'logs':
        return (
            <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Log Aktivitas Admin & Sales</h2>
                <div className="overflow-x-auto max-h-[60vh]"><table className="w-full text-sm text-left text-slate-300"><thead className="text-xs text-slate-400 uppercase bg-slate-700/50 sticky top-0"><tr><th scope="col" className="px-6 py-3">Waktu</th><th scope="col" className="px-6 py-3">Pengguna</th><th scope="col" className="px-6 py-3">Role</th><th scope="col" className="px-6 py-3">Aksi</th></tr></thead>
                        <tbody>{activityLogs.length > 0 ? activityLogs.map(log => (<tr key={log.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50"><td className="px-6 py-4 whitespace-nowrap text-slate-400">{new Date(log.timestamp).toLocaleString('id-ID')}</td><td className="px-6 py-4 font-medium text-white">{log.userName}</td><td className="px-6 py-4">{log.userRole}</td><td className="px-6 py-4">{log.action}</td></tr>)) : (<tr><td colSpan={4} className="text-center py-8 text-slate-400">Belum ada aktivitas yang tercatat.</td></tr>)}</tbody>
                    </table></div></div>
        );
       case 'settings':
         return (
            <div className="space-y-8">
                <div className="bg-slate-800 rounded-lg p-6"><h2 className="text-2xl font-bold text-white mb-4">Profil Perusahaan</h2>
                    <form className="space-y-4" onSubmit={handleSaveIspProfile}>
                         <label className="block"><span className="text-slate-400">Nama ISP</span><input type="text" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" /></label>
                         <label className="block"><span className="text-slate-400">URL Logo</span><input type="text" value={profileForm.logoUrl} onChange={(e) => setProfileForm({...profileForm, logoUrl: e.target.value})} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" /></label>
                         <label className="block"><span className="text-slate-400">Alamat</span><input type="text" value={profileForm.address} onChange={(e) => setProfileForm({...profileForm, address: e.target.value})} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" /></label>
                         <label className="block"><span className="text-slate-400">Kontak</span><input type="text" value={profileForm.contact} onChange={(e) => setProfileForm({...profileForm, contact: e.target.value})} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" /></label>
                         <div className="pt-2 flex justify-end"><button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">Simpan Profil</button></div>
                    </form></div>
                 <div className="bg-slate-800 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Template WhatsApp</h2><div className="flex justify-between items-center mb-4"><button onClick={() => { setEditingWaTemplate(null); setWaTemplateFormData({name: '', template: ''}); setWaTemplateModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 text-sm"><PlusCircleIcon className="h-5 w-5"/> Tambah Template</button></div>
                    <div className="space-y-4">{waTemplates.map(t => (<div key={t.id} className="p-4 bg-slate-700/50 rounded-lg"><div className="flex justify-between items-start"><div><p className="font-bold text-white">{t.name}</p><p className="text-sm text-slate-300 whitespace-pre-wrap mt-2">{t.template}</p><p className="text-xs text-slate-500 mt-2">Variabel: {'{nama}, {tagihan}, {jatuh_tempo}'}</p></div><div className="flex gap-3 flex-shrink-0 ml-4"><button onClick={() => { setEditingWaTemplate(t); setWaTemplateFormData(t); setWaTemplateModalOpen(true); }} className="text-blue-400 hover:text-white"><PencilIcon className="h-5 w-5"/></button><button onClick={() => handleDeleteWaTemplate(t.id)} className="text-red-400 hover:text-white"><TrashIcon className="h-5 w-5"/></button></div></div></div>))}{waTemplates.length === 0 && <p className="text-slate-400 text-center py-4">Belum ada templat.</p>}</div></div>
            </div>
         );
      default:
        return (
          <div className="bg-slate-800 rounded-lg p-6"><h2 className="text-2xl font-bold text-white mb-4">Ringkasan Sistem</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg"><p className="text-sm text-slate-400">Total Admin</p><p className="text-2xl font-bold text-white">{users.filter(u=>u.role===Role.ADMIN).length}</p></div>
                <div className="p-4 bg-slate-700/50 rounded-lg"><p className="text-sm text-slate-400">Total Sales</p><p className="text-2xl font-bold text-white">{users.filter(u=>u.role===Role.SALES).length}</p></div>
                <div className="p-4 bg-slate-700/50 rounded-lg"><p className="text-sm text-slate-400">Total Paket</p><p className="text-2xl font-bold text-white">{packages.length}</p></div>
            </div></div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
      <Modal isOpen={isUserModalOpen} onClose={() => { setUserModalOpen(false); setEditingUser(null); }} title={editingUser ? 'Edit Pengguna' : 'Edit Pengguna'}>
         <form onSubmit={handleSaveUser} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Nama Lengkap</label><input type="text" value={userFormData.name || ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Email (Username)</label><input type="email" value={userFormData.username || ''} onChange={e => setUserFormData({...userFormData, username: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required /></div>
             <div><label className="block text-sm font-medium text-slate-300 mb-1">Role</label><select value={userFormData.role || ''} onChange={e => setUserFormData({...userFormData, role: e.target.value as Role})} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white">{user.role === Role.SUPER_ADMIN && <option value={Role.ADMIN}>Admin</option>}<option value={Role.SALES}>Sales</option></select></div>
            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setUserModalOpen(false)} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg">Batal</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">Simpan Perubahan</button>
            </div>
        </form>
      </Modal>
      <Modal isOpen={isPackageModalOpen} onClose={() => setPackageModalOpen(false)} title={editingPackage ? "Edit Paket Internet" : "Tambah Paket Baru"}>
         <form onSubmit={handleSavePackage} className="space-y-4">
            <div><label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nama Paket</label><input type="text" name="name" id="name" defaultValue={editingPackage?.name || ''} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required /></div>
            <div><label htmlFor="price" className="block text-sm font-medium text-slate-300 mb-1">Harga (Rp)</label><input type="number" name="price" id="price" defaultValue={editingPackage?.price || ''} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required /></div>
            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setPackageModalOpen(false)} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg">Batal</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">Simpan</button>
            </div>
        </form>
      </Modal>
       <Modal isOpen={isWaTemplateModalOpen} onClose={() => setWaTemplateModalOpen(false)} title={editingWaTemplate ? 'Edit Template WA' : 'Tambah Template WA'}>
          <form onSubmit={handleSaveWaTemplate} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Nama Template</label><input type="text" value={waTemplateFormData.name} onChange={e => setWaTemplateFormData({...waTemplateFormData, name: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Isi Template</label><textarea rows={5} value={waTemplateFormData.template} onChange={e => setWaTemplateFormData({...waTemplateFormData, template: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required ></textarea><p className="text-xs text-slate-500 mt-1">Variabel: {'{nama}, {tagihan}, {jatuh_tempo}'}</p></div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setWaTemplateModalOpen(false)} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg">Batal</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-500">Simpan</button>
            </div>
          </form>
      </Modal>
    </div>
  );
};

export default ManagementDashboard;