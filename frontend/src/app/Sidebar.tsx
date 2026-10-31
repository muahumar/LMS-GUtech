import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  Bell,
  MessageSquare,
  AlertTriangle,
  History,
  User,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/courses', label: 'Course Catalog', icon: BookOpen },
    { to: '/announcements', label: 'Announcements', icon: Bell },
    { to: '/complaints', label: 'Complaints Queue', icon: AlertTriangle },
    { to: '/admin/audit-logs', label: 'Security Audit Log', icon: History },
  ];

  const teacherLinks = [
    { to: '/teacher', label: 'Overview', icon: LayoutDashboard },
    { to: '/teacher/courses', label: 'My Classes', icon: BookOpen },
    { to: '/teacher/gradebook', label: 'Gradebook Matrix', icon: Award },
    { to: '/announcements', label: 'Announcements', icon: Bell },
    { to: '/complaints', label: 'Helpdesk & Complaints', icon: AlertTriangle },
  ];

  const studentLinks = [
    { to: '/student', label: 'Overview', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Courses', icon: BookOpen },
    { to: '/marks', label: 'My Marks & GPA', icon: Award },
    { to: '/announcements', label: 'Announcements', icon: Bell },
    { to: '/complaints', label: 'Raise a Complaint', icon: AlertTriangle },
  ];

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  const content = (
    <aside className="w-64 flex flex-col justify-between h-full bg-white border-r border-slate-200/80 p-4">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Navigation
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin' || link.to === '/teacher' || link.to === '/student'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-600/10 border border-brand-200/60 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Preferences
          </div>
          <nav className="space-y-1">
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )
              }
            >
              <User className="w-4 h-4 shrink-0" />
              <span>User Profile</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/30 border border-slate-200/60 text-center">
        <div className="text-[11px] font-bold text-slate-800">Ghazali University of Technology</div>
        <div className="text-[10px] text-slate-500 mt-0.5">Karachi, Pakistan</div>
        <div className="mt-2 text-[10px] font-medium text-brand-700 bg-white/80 py-1 px-2 rounded-lg border border-brand-100">
          GUtech Internal LMS v1.0
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden lg:block h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {content}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
