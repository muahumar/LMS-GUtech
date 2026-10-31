import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Strength check
  const hasMinLength = newPassword.length >= 10;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isValidPolicy = hasMinLength && hasLetter && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Missing recovery token. Please request a new reset link.');
      return;
    }

    if (!isValidPolicy) {
      setErrorMessage('Password must be at least 10 characters and contain at least one letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        newPassword,
        token,
      });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'The reset link is expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="text-center mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Create New Password</h1>
          <p className="mt-1 text-xs text-slate-400">
            Set a secure password for your GUtech portal account
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800 text-slate-100">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Password Reset Complete</h3>
              <p className="text-xs text-slate-300">
                Your password has been securely updated. Redirecting you to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div>{errorMessage}</div>
                    <Link to="/forgot-password" className="text-rose-300 underline font-semibold mt-1 inline-block">
                      Request new link &rarr;
                    </Link>
                  </div>
                </div>
              )}

              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 10 characters"
                leftElement={<Lock className="w-4 h-4" />}
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
              />

              {/* Password strength indicators */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Password Requirements:
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={hasMinLength ? 'text-brand-400 font-semibold' : 'text-slate-500'}>
                    {hasMinLength ? '✓' : '•'} At least 10 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={hasLetter ? 'text-brand-400 font-semibold' : 'text-slate-500'}>
                    {hasLetter ? '✓' : '•'} At least one letter
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={hasNumber ? 'text-brand-400 font-semibold' : 'text-slate-500'}>
                    {hasNumber ? '✓' : '•'} At least one number
                  </span>
                </div>
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                leftElement={<Lock className="w-4 h-4" />}
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2 font-semibold"
                isLoading={isLoading}
              >
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
