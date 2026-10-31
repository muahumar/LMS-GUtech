import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import {
  BookOpen,
  PlusCircle,
  Users,
  GraduationCap,
  Archive,
  ArchiveRestore,
  Upload,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const CourseManagementPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected course for detail modal
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);

  // Create course modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enroll modal
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [enrollFeedback, setEnrollFeedback] = useState<any | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/admin/courses', { includeArchived: true, pageSize: 50 });
      setCourses(Array.isArray(res) ? res : res.courses || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllTeachers = async () => {
    try {
      const res = await api.get<any>('/admin/users', { role: 'teacher', pageSize: 100 });
      setAllTeachers(Array.isArray(res) ? res : res.users || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCourses();
    loadAllTeachers();
  }, []);

  const openCourseDetail = async (course: any) => {
    setSelectedCourse(course);
    try {
      const detail = await api.get<any>(`/admin/courses/${course.id}`);
      setSelectedCourse(detail);
      setTeachersList(detail.teachers || []);
      setStudentsList(detail.students || []);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch course details');
    }
  };

  const handleToggleArchive = async (course: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/admin/courses/${course.id}`, {
        isArchived: !course.isArchived,
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isArchived: !c.isArchived } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update course');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/courses', {
        code: newCode,
        title: newTitle,
        description: newDesc,
      });
      setIsCreateOpen(false);
      setNewCode('');
      setNewTitle('');
      setNewDesc('');
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    if (!selectedCourse) return;
    const currentIds = teachersList.map((t) => t.id);
    const newIds = currentIds.includes(teacherId)
      ? currentIds.filter((id) => id !== teacherId)
      : [...currentIds, teacherId];

    try {
      const updated = await api.put<any[]>(`/admin/courses/${selectedCourse.id}/teachers`, {
        teacherIds: newIds,
      });
      setTeachersList(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update teachers');
    }
  };

  const handleEnrollCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setIsSubmitting(true);
    setEnrollFeedback(null);
    try {
      const res = await api.post<any>(`/admin/courses/${selectedCourse.id}/enrollments`, {
        csvContent,
      });
      setEnrollFeedback(res);
      // reload course details
      openCourseDetail(selectedCourse);
    } catch (err: any) {
      alert(err.message || 'Failed to enroll students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnenroll = async (studentId: string) => {
    if (!selectedCourse) return;
    if (!confirm('Unenroll this student from the course?')) return;
    try {
      await api.delete(`/admin/courses/${selectedCourse.id}/enrollments/${studentId}`);
      setStudentsList((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err: any) {
      alert(err.message || 'Failed to unenroll student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Academic subject definitions, faculty assignments, and student rosters
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Add New Course
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading course catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCourses} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses configured"
          description="Create your first academic course offering."
          actionText="Add Course"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => openCourseDetail(course)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-premium hover:border-brand-500/50 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {course.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {course.isArchived && <Badge variant="warning" size="sm">Archived</Badge>}
                    <button
                      type="button"
                      onClick={(e) => handleToggleArchive(course, e)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title={course.isArchived ? 'Restore course' : 'Archive course'}
                    >
                      {course.isArchived ? (
                        <ArchiveRestore className="w-4 h-4 text-brand-600" />
                      ) : (
                        <Archive className="w-4 h-4 text-slate-400 hover:text-amber-600" />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {course.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] font-semibold text-brand-700 group-hover:underline">
                  Manage Teachers & Roster &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Detail Modal (Teachers and Students) */}
      <Modal
        isOpen={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        title={selectedCourse ? `${selectedCourse.code}: ${selectedCourse.title}` : ''}
        description="Course configuration, faculty assignment, and enrolled student roster."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'teachers'
                  ? 'border-brand-600 text-brand-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Faculty Teachers ({teachersList.length})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'students'
                  ? 'border-brand-600 text-brand-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Enrolled Students ({studentsList.length})
            </button>
          </div>

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-500">
                Check faculty members authorized to post content and grade this course:
              </p>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {allTeachers.map((t) => {
                  const isAssigned = teachersList.some((x) => x.id === t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleAssignTeacher(t.id)}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800">{t.fullName}</div>
                          <div className="text-[11px] text-slate-400">{t.email}</div>
                        </div>
                      </div>
                      {isAssigned && <Badge variant="brand" size="sm">Assigned</Badge>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {studentsList.length} enrolled students
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEnrollOpen(true)}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Bulk CSV Import
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {studentsList.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">No students enrolled yet.</p>
                ) : (
                  studentsList.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[11px] text-slate-400">
                          {s.email} &bull; <span className="font-mono">{s.rollNo || 'No Roll No'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnenroll(s.id)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50"
                        title="Unenroll student"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* CSV Enroll Modal */}
      <Modal
        isOpen={isEnrollOpen}
        onClose={() => {
          setIsEnrollOpen(false);
          setEnrollFeedback(null);
        }}
        title="Import Student Enrollments via CSV"
        description="Paste student emails below (one per line or standard CSV format)."
      >
        <form onSubmit={handleEnrollCsv} className="space-y-4">
          {enrollFeedback && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-slate-800">{enrollFeedback.message}</div>
              {enrollFeedback.matched?.length > 0 && (
                <div className="text-brand-700">
                  &bull; Enrolled ({enrollFeedback.matched.length}): {enrollFeedback.matched.join(', ')}
                </div>
              )}
              {enrollFeedback.duplicates?.length > 0 && (
                <div className="text-amber-700">
                  &bull; Already enrolled ({enrollFeedback.duplicates.length}): {enrollFeedback.duplicates.join(', ')}
                </div>
              )}
              {enrollFeedback.unknownEmails?.length > 0 && (
                <div className="text-rose-700">
                  &bull; Unknown / Unmatched ({enrollFeedback.unknownEmails.length}): {enrollFeedback.unknownEmails.join(', ')}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              CSV Content (Emails)
            </label>
            <textarea
              rows={5}
              required
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="email&#10;ali.student@gutech.edu&#10;fatima.student@gutech.edu"
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsEnrollOpen(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Process Enrollments
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Academic Course"
        description="Define a new curriculum subject offering."
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Course Code"
            required
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="e.g. CS302"
          />

          <Input
            label="Course Title"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Distributed Database Engineering"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Course Description
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Overview of curriculum, learning objectives..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

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
              Save Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
