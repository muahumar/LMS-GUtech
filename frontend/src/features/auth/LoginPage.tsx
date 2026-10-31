import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { ThemeToggle } from '../../components/ui/ThemeToggle.js';
import { Lock, Mail, Eye, EyeOff, Shield, GraduationCap, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

const friendlyError = (err: any): string => {
  if (err instanceof TypeError) {
    console.error('Login request failed:', err);
    return `Cannot reach the server (${err.message}). Make sure the backend is running (npm run dev) and try again.`;
  }
  return err?.message || 'Invalid email or password';
};

const features = [
  'Courses, assignments and quizzes in one place',
  'Marks and announcements, always up to date',
  'Role-based access for students, teachers and admins',
];

export const LoginPage: React.FC = () => {
  const { login, demoSwitchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectFor = (role: string) => {
    const from = (location.state as any)?.from?.pathname;
    if (from) return from as string;
    if (role === 'admin') return '/admin';
    if (role === 'teacher') return '/teacher';
    return '/student';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate(redirectFor(user.role), { replace: true });
    } catch (err: any) {
      setErrorMessage(friendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setIsLoading(true);
    setErrorMessage('');
    try {
      await demoSwitchUser(demoEmail);
      if (demoEmail.includes('admin')) navigate('/admin', { replace: true });
      else if (demoEmail.includes('sarah')) navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    } catch (err: any) {
      setErrorMessage(friendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const demoButtons = [
    { email: 'admin@gutech.edu', label: 'Admin', Icon: Shield, color: 'text-indigo-600 bg-indigo-50' },
    { email: 'dr.sarah@gutech.edu', label: 'Teacher', Icon: GraduationCap, color: 'text-brand-700 bg-brand-50' },
    { email: 'ali.student@gutech.edu', label: 'Student', Icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-white">
      <ThemeToggle className="fixed top-4 right-4 z-50 bg-white/80 border border-slate-200 shadow-subtle" />
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-brand-950 text-white p-12">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-600/30 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-brand-600/30">
            G
          </div>
          <span className="text-lg font-bold tracking-tight">GUtech LMS</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Learn, teach and manage in one portal.
          </h1>
          <p className="mt-4 text-slate-400 leading-relaxed">
            The internal learning platform of Ghazali University of Technology, Karachi.
          </p>
          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-px" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">&copy; Ghazali University of Technology, Karachi</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center font-extrabold text-white shadow-md">
              G
            </div>
            <span className="text-lg font-bold text-slate-900">GUtech LMS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in with your GUtech academic account.</p>

          <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-premium p-6 sm:p-8">
            {errorMessage && (
              <div
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@gutech.edu"
                leftElement={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftElement={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="flex justify-end -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-brand-700 hover:text-brand-800 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full font-semibold" isLoading={isLoading}>
                Sign in
              </Button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">
                Quick demo access
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {demoButtons.map(({ email: e, label, Icon, color }) => (
                  <button
                    key={e}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(e)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50 transition disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            No public sign-up. Accounts are provisioned by GUtech Administration.
          </p>
        </div>
      </main>
    </div>
  );
};
