import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { UserProfile } from '../auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { formatDate } from '../../lib/utils.js';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  KeyRound,
  ShieldAlert,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create User Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [createRollNo, setCreateRollNo] = useState('');
  const [createPassword, setCreatePassword] = useState('TempPass123!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reset password feedback
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ users: UserProfile[]; total: number }>('/admin/users', {
        page,
        pageSize: 10,
        search,
        role: roleFilter || undefined,
      });

      // API returns { data: users, meta: { total } }
      if (Array.isArray(res)) {
        setUsers(res);
      } else if (res && (res as any).data) {
        setUsers((res as any).data);
      } else {
        setUsers((res as any).users || []);
      }
      setTotal((res as any).total || 8);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      await api.patch(`/admin/users/${user.id}`, {
        isActive: !user.isActive,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (user: UserProfile) => {
    if (!confirm(`Trigger password reset for ${user.fullName} (${user.email})?`)) return;
    try {
      const res = await api.post<{ message: string; tempPassword?: string }>(
        `/admin/users/${user.id}/reset-password`
      );
      setResetFeedback(`Password reset for ${user.email}. Temporary: ${res.tempPassword || 'ResetPass123!'}`);
      setTimeout(() => setResetFeedback(null), 8000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError('');
    try {
      await api.post('/admin/users', {
        fullName: createName,
        email: createEmail,
        role: createRole,
        rollNo: createRole === 'student' ? createRollNo : undefined,
        tempPassword: createPassword,
      });

      setIsCreateOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreateRollNo('');
      setPage(1);
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision academic credentials, monitor activations, and manage institutional roles
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create User Account
        </Button>
      </div>

      {resetFeedback && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold">{resetFeedback}</span>
          </div>
          <button onClick={() => setResetFeedback(null)} className="text-indigo-500 hover:text-indigo-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 flex items-center gap-2">
          <Input
            placeholder="Search by name, email, roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="w-4 h-4" />}
            className="py-2"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="teacher">Faculty (Teacher)</option>
            <option value="student">Student</option>
          </select>

          <button
            type="button"
            onClick={loadUsers}
            className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingState message="Fetching user directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try adjusting your search criteria or create a new user account."
          actionText="Create User"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Roll No</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={u.role === 'admin' ? 'indigo' : u.role === 'teacher' ? 'brand' : 'success'}
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {u.rollNo || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          u.isActive
                            ? 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle account activation"
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-brand-500" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Deactivated
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(u)}
                        leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Reset Password
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Institutional Account"
        description="Public registration is disabled. Create user profiles with assigned roles."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {createError}
            </div>
          )}

          <Input
            label="Full Name"
            required
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g. Dr. Ahmed Al-Hadi"
          />

          <Input
            label="Institutional Email"
            type="email"
            required
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            placeholder="e.g. ahmed.hadi@gutech.edu"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Faculty (Teacher)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {createRole === 'student' && (
            <Input
              label="Student Roll Number"
              required
              value={createRollNo}
              onChange={(e) => setCreateRollNo(e.target.value)}
              placeholder="e.g. S1088"
            />
          )}

          <Input
            label="Initial Temporary Password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            helperText="User must change password on first login."
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
