import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { formatDate } from '../../lib/utils.js';
import {
  Bell,
  PlusCircle,
  Pin,
  CheckCheck,
  Megaphone,
  Trash2,
} from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create announcement modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [courseIdTarget, setCourseIdTarget] = useState<string>('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [annRes, coursesRes] = await Promise.all([
        api.get<any>('/announcements', {
          courseId: selectedCourseId || undefined,
          pageSize: 50,
        }),
        api.get<any[]>('/me/courses'),
      ]);

      setAnnouncements(annRes?.announcements || []);
      setUnreadCount(annRes?.unreadCount || 0);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [selectedCourseId]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/announcements/read', {});
      setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      alert(err.message || 'Failed to mark as read');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/announcements', {
        title,
        body,
        courseId: courseIdTarget ? courseIdTarget : null,
        isPinned,
      });
      setIsCreateOpen(false);
      setTitle('');
      setBody('');
      setCourseIdTarget('');
      setIsPinned(false);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">University Announcements</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global notices, departmental updates, and course broadcasts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-brand-600" />}
            >
              Mark All Read ({unreadCount})
            </Button>
          )}

          {(role === 'admin' || role === 'teacher') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Post Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Filter Feed:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-brand-500"
          >
            <option value="">All Relevant Announcements</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <LoadingState message="Fetching announcement broadcasts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAnnouncements} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No notices found"
          description="You are completely caught up on all course and campus announcements."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`p-6 rounded-3xl border transition-all ${
                a.isPinned
                  ? 'bg-amber-50/40 border-amber-200/80 shadow-subtle'
                  : !a.isRead
                  ? 'bg-brand-50/20 border-brand-200 shadow-subtle'
                  : 'bg-white border-slate-200/80 shadow-subtle'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        <Pin className="w-3 h-3 text-amber-600" />
                        Pinned Notice
                      </span>
                    )}

                    <span className="text-[11px] font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {a.courseCode ? a.courseCode : 'Global GUtech Notice'}
                    </span>

                    {!a.isRead && (
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full animate-pulse">
                        New
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                </div>

                {(role === 'admin' || user?.id === a.authorId) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {a.body}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>By {a.authorName}</span>
                <span>{formatDate(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Announcement Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Post Announcement Broadcast"
        description="Notify enrolled students and faculty members across the university."
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input
            label="Notice Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midterm Examination Schedule Announcement"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Audience Scope
            </label>
            <select
              value={courseIdTarget}
              onChange={(e) => setCourseIdTarget(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-brand-500"
            >
              {role === 'admin' && <option value="">Global Broadcast (Entire University)</option>}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  Course: {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Body Text
            </label>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full announcement message..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <span>Pin this announcement to top of the feed</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Broadcast Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
