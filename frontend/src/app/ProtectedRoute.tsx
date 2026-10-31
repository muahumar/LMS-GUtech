import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { LoadingState } from '../components/ui/LoadingState.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'teacher' | 'student'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role guard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
