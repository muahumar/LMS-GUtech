import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatDate } from '../../lib/utils.js';
import {
  User,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Mail,
  Hash,
  Calendar,
  Lock,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Name edit state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingName(true);
    setNameSuccess('');
    try {
      const updated = await api.patch<{ fullName: string }>('/auth/profile', { fullName });
      updateUser({ fullName: updated.fullName });
      setNameSuccess('Profile name updated successfully.');
      setTimeout(() => setNameSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update name');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 10 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('New password must be at least 10 characters and contain at least one letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password successfully updated. All other sessions have been rotated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-premium border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-400 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user?.fullName}</h1>
              <Badge variant={user?.role === 'admin' ? 'indigo' : user?.role === 'teacher' ? 'brand' : 'success'} size="md">
                {user?.role}
              </Badge>
            </div>
            <p className="text-sm text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </p>
            {user?.rollNo && (
              <p className="text-xs text-brand-300 font-mono flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Student Roll No: {user.rollNo}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-slate-900 text-base">Account Information</h2>
          </div>

          {nameSuccess && (
            <div className="p-3 bg-brand-50 border border-brand-200 text-brand-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{nameSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />

            <Input
              label="Academic Email"
              disabled
              value={user?.email || ''}
              helperText="University email cannot be changed directly."
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  Active Account
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Role
                </span>
                <span className="text-xs font-semibold text-slate-700 uppercase">
                  {user?.role}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUpdatingName}
              className="w-full mt-2"
            >
              Save Profile Changes
            </Button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Key className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-slate-900 text-base">Security & Password</h2>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-brand-50 border border-brand-200 text-brand-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              leftElement={<Lock className="w-4 h-4" />}
            />

            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 10 characters"
              leftElement={<Lock className="w-4 h-4" />}
              helperText="Must have 10+ characters, 1 letter, and 1 number."
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              leftElement={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="outline"
              size="md"
              isLoading={isChangingPassword}
              className="w-full mt-2"
            >
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
