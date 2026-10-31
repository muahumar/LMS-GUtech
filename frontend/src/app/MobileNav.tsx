import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { LayoutDashboard, BookOpen, Award, Bell, User } from 'lucide-react';
import { cn } from '../lib/utils.js';

interface MobileNavProps {
  unreadCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ unreadCount = 0 }) => {
  const { user } = useAuth();
  const role = user?.role;

  const homeRoute = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';
  const coursesRoute = role === 'admin' ? '/admin/courses' : role === 'teacher' ? '/teacher/courses' : '/student/courses';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around h-14">
        <NavLink
          to={homeRoute}
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to={coursesRoute}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )
          }
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Courses</span>
        </NavLink>

        <NavLink
          to="/marks"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )
          }
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span>Marks</span>
        </NavLink>

        <NavLink
          to="/announcements"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors relative',
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )
          }
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-600 rounded-full animate-ping" />
            )}
          </div>
          <span>Notices</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};
