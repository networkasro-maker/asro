import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Modal from './Modal';
import { LockIcon, EyeIcon, EyeOffIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdatePassword: (userId: string, oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user, onUpdatePassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }
    if (newPassword.length < 3) {
      setError('Password baru minimal harus 3 karakter.');
      return;
    }

    const result = await onUpdatePassword(user.id, currentPassword, newPassword);

    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  const PasswordInput: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    show: boolean;
    onToggle: () => void;
  }> = ({ id, label, value, onChange, show, onToggle }) => (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>
      <div className="relative mt-2">
        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-500 hover:text-slate-300 transition"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubah Password Anda">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          id="currentPassword"
          label="Password Saat Ini"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          show={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
        />
        <PasswordInput
          id="newPassword"
          label="Password Baru"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
        />
        <PasswordInput
          id="confirmPassword"
          label="Konfirmasi Password Baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />
        
        {error && (
            <div className="flex items-center p-3 text-sm text-red-400 bg-red-500/10 rounded-lg">
                <XCircleIcon className="w-5 h-5 mr-2" />
                {error}
            </div>
        )}
        {success && (
            <div className="flex items-center p-3 text-sm text-green-400 bg-green-500/10 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {success}
            </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition">Batal</button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">Simpan Perubahan</button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;