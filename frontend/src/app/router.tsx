import React from 'react';
import { createBrowserRouter, Navigate, Link } from 'react-router-dom';
import { AppLayout } from './AppLayout.js';
import { ProtectedRoute } from './ProtectedRoute.js';
import { useAuth } from '../features/auth/AuthContext.js';

// Auth pages
import { LoginPage } from '../features/auth/LoginPage.js';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage.js';
import { ProfilePage } from '../features/profile/ProfilePage.js';

// Dashboard pages
import { AdminDashboard } from '../features/admin/AdminDashboard.js';
import { UserManagementPage } from '../features/admin/UserManagementPage.js';
import { CourseManagementPage } from '../features/admin/CourseManagementPage.js';
import { AuditLogPage } from '../features/admin/AuditLogPage.js';
import { TeacherDashboard } from '../features/teacher/TeacherDashboard.js';
import { StudentDashboard } from '../features/student/StudentDashboard.js';

// Feature pages
import { CourseDetailPage } from '../features/courses/CourseDetailPage.js';
import { AnnouncementsPage } from '../features/announcements/AnnouncementsPage.js';
import { ComplaintsPage } from '../features/complaints/ComplaintsPage.js';
import { MarksPage } from '../features/marks/MarksPage.js';

const RoleBasedHome: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-sans">
    <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-2xl mb-4 border border-brand-200">
      404
    </div>
    <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
    <p className="text-xs text-slate-500 mt-1 max-w-sm">
      The requested institutional endpoint does not exist. Public registration routes are strictly disabled.
    </p>
    <Link
      to="/"
      className="mt-5 inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
    >
      Return to LMS Portal
    </Link>
  </div>
);

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Authenticated App Shell
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleBasedHome /> },
      { path: 'profile', element: <ProfilePage /> },

      // Admin routes
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/courses',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <CourseManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/audit-logs',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },

      // Teacher routes
      {
        path: 'teacher',
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/courses',
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/gradebook',
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <MarksPage />
          </ProtectedRoute>
        ),
      },

      // Student routes
      {
        path: 'student',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'student/courses',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },

      // Shared feature routes
      { path: 'courses/:id', element: <CourseDetailPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      { path: 'complaints', element: <ComplaintsPage /> },
      { path: 'marks', element: <MarksPage /> },
    ],
  },

  // Catch-all
  { path: '*', element: <NotFoundPage /> },
]);
