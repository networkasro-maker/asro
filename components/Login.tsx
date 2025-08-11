import React, { useState } from 'react';
import { User, AccountStatus, IspProfile } from '../types';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from './icons';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  ispProfile: IspProfile;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, ispProfile }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.status === AccountStatus.FROZEN) {
        setError('Akun Anda telah dibekukan. Hubungi administrator.');
        return;
      }
      onLogin(user);
    } else {
      setError('Username atau password salah.');
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
              <label htmlFor="username" className="text-sm font-medium text-slate-300">Username</label>
              <div className="relative mt-2">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-blue-500/30"
            >
              LOGIN
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
