import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatDate } from '../../lib/utils.js';
import {
  BookOpen,
  Award,
  Bell,
  Clock,
  ArrowRight,
  FolderOpen,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [coursesRes, annRes] = await Promise.all([
        api.get<any[]>('/me/courses'),
        api.get<any>('/announcements', { pageSize: 5 }),
      ]);

      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      const annList = Array.isArray(annRes) ? annRes : annRes?.announcements || [];
      setAnnouncements(annList.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load student dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  if (isLoading) return <LoadingState message="Loading your courses and curriculum..." />;
  if (error) return <ErrorState message={error} onRetry={loadStudentData} />;

  return (
    <div className="space-y-8">
      {/* Student Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-premium border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-brand-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Student Portal
              </span>
              {user?.rollNo && (
                <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">
                  {user.rollNo}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Ghazali University of Technology &bull; Fall Semester 2026
            </p>
          </div>

          <Link
            to="/marks"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-sm"
          >
            <Award className="w-4 h-4 text-brand-400" />
            <span>Check My Marks & GPA</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Enrolled Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">My Courses</h2>
              <p className="text-xs text-slate-500">Subjects you are currently enrolled in</p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
              {courses.length} Active Courses
            </span>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No enrolled courses"
              description="You are not enrolled in any active courses. Contact faculty or administration to verify registration."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 hover:shadow-premium hover:border-brand-500/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {course.code}
                      </span>
                      <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded">
                        Enrolled
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {course.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-700 font-semibold">
                    <span>Go to classroom</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Announcements Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Latest Notices
              </h2>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Feed &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle divide-y divide-slate-100 overflow-hidden">
            {announcements.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">No announcements posted yet.</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    {a.isPinned && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Pinned
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-brand-700">
                      {a.courseCode || 'Campus Notice'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{a.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{a.body}</p>
                  <div className="mt-2 text-[10px] text-slate-400">{formatDate(a.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
