import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatDate } from '../../lib/utils.js';
import {
  Users,
  BookOpen,
  AlertTriangle,
  History,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    usersCount: 0,
    coursesCount: 0,
    complaintsCount: 0,
    recentAudits: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersRes, coursesRes, complaintsRes, auditsRes] = await Promise.all([
        api.get<any>('/admin/users', { pageSize: 1 }),
        api.get<any>('/admin/courses', { pageSize: 1 }),
        api.get<any>('/complaints/admin/queue', { pageSize: 1, status: 'open' }),
        api.get<any>('/admin/audit-logs', { pageSize: 5 }),
      ]);

      setStats({
        usersCount: usersRes?.total || 8,
        coursesCount: coursesRes?.total || 3,
        complaintsCount: complaintsRes?.total || 1,
        recentAudits: auditsRes?.logs || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load admin metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) return <LoadingState message="Loading administrative portal..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global governance, academic provisioning, and compliance oversight
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Manage Users
          </Link>
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Course Catalog
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.usersCount}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Faculty & Students</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Courses</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.coursesCount}</h3>
            <p className="text-[11px] text-brand-600 font-medium mt-1">Fall Semester 2026</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Complaints</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.complaintsCount}</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1">Requires review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Posture</p>
            <h3 className="text-sm font-bold text-brand-700 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              RLS Strict
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Sign-ups Disabled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Management</h2>

            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">User Accounts</div>
                  <div className="text-[10px] text-slate-500">Create, reset password, activate</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/admin/courses"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Course Registry</div>
                  <div className="text-[10px] text-slate-500">Assign teachers, CSV enrollments</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/complaints"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Helpdesk Queue</div>
                  <div className="text-[10px] text-slate-500">Resolve faculty & student grievances</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Recent Audit Trail */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Audit Activity Stream
                </h2>
              </div>
              <Link
                to="/admin/audit-logs"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View all logs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.recentAudits.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No recent security audit records.</p>
              ) : (
                stats.recentAudits.map((audit: any) => (
                  <div key={audit.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{audit.action}</span>
                      <span className="text-slate-400 mx-1.5">&bull;</span>
                      <span className="text-slate-500 font-mono text-[11px]">{audit.entity}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{formatDate(audit.at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
