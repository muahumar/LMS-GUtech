import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { Badge } from '../../components/ui/Badge.js';
import {
  GraduationCap,
  BookOpen,
  FolderOpen,
  ClipboardList,
  Award,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeacherCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any[]>('/me/courses');
      setCourses(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teaching schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherCourses();
  }, []);

  if (isLoading) return <LoadingState message="Loading teaching overview..." />;
  if (error) return <ErrorState message={error} onRetry={loadTeacherCourses} />;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-premium border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-brand-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Faculty Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Manage course materials, build auto-graded quizzes, review student assignments, and communicate with enrolled students in real time.
          </p>
        </div>
      </div>

      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">My Classes</h2>
            <p className="text-xs text-slate-500">Subjects under your instruction</p>
          </div>
          <Link
            to="/announcements"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Post Announcement &rarr;
          </Link>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No classes assigned"
            description="You have not been assigned to any courses yet. Please contact an administrator."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 flex flex-col justify-between hover:shadow-premium hover:border-brand-500/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {course.code}
                    </span>
                    <Badge variant="brand" size="sm">Active</Badge>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{course.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {course.description || 'No course overview provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-3 gap-1.5 text-center text-slate-600 text-xs">
                    <Link
                      to={`/courses/${course.id}?tab=resources`}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 hover:text-brand-700 transition-colors flex flex-col items-center gap-1"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium">Files</span>
                    </Link>
                    <Link
                      to={`/courses/${course.id}?tab=assignments`}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 hover:text-brand-700 transition-colors flex flex-col items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium">Grading</span>
                    </Link>
                    <Link
                      to={`/courses/${course.id}?tab=chat`}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 hover:text-brand-700 transition-colors flex flex-col items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium">Chat</span>
                    </Link>
                  </div>

                  <Link
                    to={`/courses/${course.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Open Class Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
