import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post<{ message: string; token?: string }>('/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.token) {
        setResetToken(res.token);
      }
    } catch {
      // Per spec rule: never reveal whether an email exists; always show neutral confirmation
      setSubmitted(true);
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
          <h1 className="text-2xl font-extrabold text-white">Reset Account Password</h1>
          <p className="mt-1 text-xs text-slate-400">
            Enter your university email to receive recovery instructions
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800 text-slate-100">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Request Processed</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If the email <strong className="text-white">{email}</strong> is registered, password reset instructions have been dispatched.
              </p>

              {resetToken && (
                <div className="mt-4 p-3 bg-slate-800 rounded-xl border border-slate-700 text-left">
                  <p className="text-[10px] uppercase font-bold text-amber-400 mb-1">
                    Direct Reset Link (Dev environment simulation)
                  </p>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="text-xs text-brand-400 hover:underline break-all font-mono"
                  >
                    Click here to set new password &rarr;
                  </Link>
                </div>
              )}

              <Link to="/login" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="University Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gutech.edu"
                leftElement={<Mail className="w-4 h-4" />}
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2 font-semibold"
                isLoading={isLoading}
              >
                Send Instructions
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
