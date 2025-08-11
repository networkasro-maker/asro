import React, { useState } from 'react';
import { AccountStatus, IspProfile } from '../types';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from './icons';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  ispProfile: IspProfile;
}

const Login: React.FC<LoginProps> = ({ ispProfile }) => {
  const [username, setUsername] = useState(''); // This will be treated as email for Supabase Auth
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // First, check if the user's profile is frozen from our public 'profiles' table.
    // Supabase Auth doesn't have a 'frozen' status, so we manage it in our application logic.
    try {
        const { data: profile, error: profileError } = await supabase
            .from('users') // Assumes a public 'users' or 'profiles' table
            .select('status')
            .eq('username', username)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 'exact-one-row-not-found'
             throw new Error("Gagal memeriksa status akun. Coba lagi.");
        }

        if (profile && profile.status === AccountStatus.FROZEN) {
            setError('Akun Anda telah dibekukan. Hubungi administrator.');
            setLoading(false);
            return;
        }

        // If not frozen (or not found, let auth handle it), proceed with login
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });

        if (authError) {
           setError('Username atau password salah.');
        } 
        // On success, the onAuthStateChange listener in App.tsx will handle the rest.

    } catch (err: any) {
         setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl shadow-blue-500/10 p-8">
          <div className="flex flex-col items-center mb-6">
            <img src={ispProfile.logoUrl} alt={`${ispProfile.name} Logo`} className="h-16 mb-2" />
            <h1 className="text-3xl font-bold text-white tracking-wider">{ispProfile.name}</h1>
            <p className="text-slate-400">Billing Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="text-sm font-medium text-slate-300">Username (Email)</label>
              <div className="relative mt-2">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username/email Anda"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative mt-2">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-blue-500/30 disabled:bg-slate-600 disabled:scale-100"
            >
              {loading ? 'MEMPROSES...' : 'LOGIN'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} {ispProfile.name} - {ispProfile.address.split(',')[1] || 'Bumiayu'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;