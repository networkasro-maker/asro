
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { PACKAGES, ISP_PROFILE, WHATSAPP_TEMPLATES } from '../constants';
import { CheckCircleIcon, KeyIcon, UserIcon } from './icons';

interface InitialSetupProps {
  onSetupComplete: () => void;
}

const InitialSetup: React.FC<InitialSetupProps> = ({ onSetupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // We use upsert to avoid errors if data already exists or if button is clicked twice.
      const { error: pkgError } = await supabase.from('packages').upsert(PACKAGES);
      if (pkgError) throw pkgError;

      // FIX: Wrap the single ISP_PROFILE object in an array for upsert.
      const { error: profileError } = await supabase.from('isp_profile').upsert([ISP_PROFILE]);
      if (profileError) throw profileError;

      const { error: waError } = await supabase.from('whatsapp_templates').upsert(WHATSAPP_TEMPLATES);
      if (waError) throw waError;

      setIsSeeded(true);
    } catch (err: any) {
      console.error("Database seeding failed:", err);
      setError(`Gagal mengisi data: ${err.message}. Coba segarkan halaman dan pastikan koneksi Supabase benar.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const SetupStep: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode}> = ({ icon, title, children }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-600/20 text-blue-400 rounded-full">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <div className="text-slate-400 text-sm mt-1 space-y-1">{children}</div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl shadow-blue-500/10 p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={ISP_PROFILE.logoUrl} alt="Logo" className="h-16 mb-2" />
          <h1 className="text-3xl font-bold text-white tracking-wider">Selamat Datang di ASRO.NET</h1>
          <p className="text-slate-400">Setup Awal Aplikasi Billing Management</p>
        </div>

        {!isSeeded ? (
          <div className="text-center">
            <p className="text-slate-300 mb-6">Database Anda tampaknya masih kosong. Klik tombol di bawah ini untuk mengisi data awal secara otomatis (paket internet, profil perusahaan, dll).</p>
            <button
              onClick={handleSeedDatabase}
              disabled={isLoading}
              className="w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-blue-500/30 disabled:bg-slate-600 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div> : 'Siapkan Aplikasi Sekarang'}
            </button>
            {error && <p className="text-red-400 text-sm text-center mt-4 bg-red-500/10 p-3 rounded-lg">{error}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/10 text-green-400 rounded-lg flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-3"/>
                <p><strong>Sukses!</strong> Data dasar telah berhasil dimasukkan ke database Anda.</p>
            </div>
            
            <p className="text-center text-slate-300">Langkah terakhir, mari buat akun Super Admin Anda agar bisa login.</p>
            
            <SetupStep icon={<UserIcon className="h-6 w-6"/>} title="Langkah 1: Undang Diri Anda">
                <p>Buka Dasbor Supabase Anda, lalu pergi ke menu <strong className="text-white">Authentication</strong>.</p>
                <p>Klik tombol <strong className="text-white">Invite user</strong> dan masukkan email: <strong className="text-yellow-300">superadmin@asro.net</strong></p>
            </SetupStep>
            
            <SetupStep icon={<KeyIcon className="h-6 w-6"/>} title="Langkah 2: Atur Password">
                <p>Buka email yang baru Anda terima dari Supabase, lalu klik link di dalamnya untuk membuat password Anda.</p>
            </SetupStep>

            <SetupStep icon={<CheckCircleIcon className="h-6 w-6"/>} title="Langkah 3: Login ke Aplikasi">
                <p>Setelah password berhasil dibuat, kembali ke halaman ini dan klik tombol di bawah ini untuk melanjutkan ke halaman login.</p>
            </SetupStep>
            
            <div className="text-center pt-4">
                 <button
                  onClick={onSetupComplete}
                  className="w-full max-w-xs mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-green-500/30"
                >
                  Lanjutkan ke Halaman Login
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitialSetup;
