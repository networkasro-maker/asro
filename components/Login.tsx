import React, { useState } from 'react';
import { AccountStatus, IspProfile } from '../types';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from './icons';
import { supabase } from '../supabaseClient';

interface LoginProps {
  ispProfile: IspProfile;
}

const Login: React.FC<LoginProps> = ({ ispProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // First, try to sign in
    const { data: { user: authUser, session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' ? 'Email atau password salah.' : signInError.message);
      setLoading(false);
      return;
    }

    if (authUser) {
        // After successful sign in, check the user's profile status from 'profiles' table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', authUser.id)
            .single();

        if (profileError) {
            setError("Gagal memuat profil pengguna.");
            await supabase.auth.signOut(); // Log out if profile can't be fetched
        } else if (profile.status === AccountStatus.FROZEN) {
            setError('Akun Anda telah dibekukan. Hubungi administrator.');
            await supabase.auth.signOut(); // Log out frozen user
        }
        // If everything is OK, the onAuthStateChange listener in App.tsx will handle the rest.
    }
    
    setLoading(false);
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
              <label htmlFor="email" className="text-sm font-medium text-slate-300">Email (Username)</label>
              <div className="relative mt-2">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
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
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-blue-500/30 disabled:bg-slate-600 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div> : 'LOGIN'}
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