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
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  Send,
  MessageSquare,
} from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [complaints, setComplaints] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Admin
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Raise Complaint Modal
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [category, setCategory] = useState('technical');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Resolve Drawer
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [adminStatus, setAdminStatus] = useState<any>('in_review');
  const [adminResponse, setAdminResponse] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadComplaints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (role === 'admin') {
        const res = await api.get<any>('/complaints/admin/queue', {
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        });
        setComplaints(Array.isArray(res) ? res : res.complaints || []);
      } else {
        const res = await api.get<any[]>('/complaints/mine');
        setComplaints(Array.isArray(res) ? res : []);
      }

      const coursesRes = await api.get<any[]>('/me/courses');
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, categoryFilter]);

  const handleRaiseComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/complaints', {
        category,
        subject,
        description,
        courseId: courseId || null,
      });

      setIsRaiseOpen(false);
      setSubject('');
      setDescription('');
      setCourseId('');
      loadComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to submit grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/complaints/admin/${selectedComplaint.id}`, {
        status: adminStatus,
        adminResponse,
      });
      setSelectedComplaint(null);
      loadComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') return <Badge variant="warning" size="sm">Open</Badge>;
    if (status === 'in_review') return <Badge variant="indigo" size="sm">In Review</Badge>;
    if (status === 'resolved') return <Badge variant="success" size="sm">Resolved</Badge>;
    return <Badge variant="danger" size="sm">Rejected</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {role === 'admin' ? 'Administrative Helpdesk Queue' : 'Helpdesk & Grievances'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'admin'
              ? 'Review and resolve academic, facility, and technical complaints'
              : 'Submit issues to university administration and monitor resolutions'}
          </p>
        </div>

        {role !== 'admin' && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsRaiseOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Raise a Complaint
          </Button>
        )}
      </div>

      {/* Admin Filters */}
      {role === 'admin' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-medium"
            >
              <option value="">All Categories</option>
              <option value="academic">Academic</option>
              <option value="technical">Technical</option>
              <option value="facility">Facility</option>
              <option value="conduct">Conduct</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {/* Complaints List */}
      {isLoading ? (
        <LoadingState message="Loading complaints queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadComplaints} />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No complaints reported"
          description="Everything is running smoothly. Submit a ticket if you encounter any difficulties."
          actionText={role !== 'admin' ? 'Raise a Complaint' : undefined}
          onAction={() => setIsRaiseOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((comp) => (
            <div
              key={comp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {comp.category}
                  </span>
                  {comp.courseCode && (
                    <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {comp.courseCode}
                    </span>
                  )}
                  {getStatusBadge(comp.status)}
                </div>

                <div className="text-[11px] text-slate-400">
                  Raised: {formatDate(comp.createdAt)}
                  {role === 'admin' && <span className="ml-2 font-semibold text-slate-700">by {comp.raisedByName}</span>}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">{comp.subject}</h3>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {comp.description}
                </p>
              </div>

              {/* Admin response block if present */}
              {comp.adminResponse && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-brand-700 font-bold text-[11px] uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Administrative Resolution
                  </div>
                  <p className="text-slate-800">{comp.adminResponse}</p>
                </div>
              )}

              {/* Admin Action */}
              {role === 'admin' && (
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedComplaint(comp);
                      setAdminStatus(comp.status);
                      setAdminResponse(comp.adminResponse || '');
                    }}
                  >
                    Respond & Change Status
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Raise Complaint Modal */}
      <Modal
        isOpen={isRaiseOpen}
        onClose={() => setIsRaiseOpen(false)}
        title="Raise University Grievance / Complaint"
        description="Submit your grievance directly to administrative oversight."
      >
        <form onSubmit={handleRaiseComplaint} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="technical">Technical</option>
                <option value="academic">Academic</option>
                <option value="facility">Campus Facility</option>
                <option value="conduct">Conduct</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Associated Course (Optional)
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="">General (No Course)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Projector audio failure in Engineering Room 204"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details, timing, and impact..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsRaiseOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Submit Complaint
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Review & Response Modal */}
      <Modal
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title="Administrative Grievance Review"
        description="Evaluate grievance, update lifecycle status, and provide an official response."
      >
        <form onSubmit={handleAdminUpdateStatus} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="font-bold text-slate-900">{selectedComplaint?.subject}</div>
            <p className="text-slate-600">{selectedComplaint?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Complaint Status Flow
            </label>
            <select
              value={adminStatus}
              onChange={(e) => setAdminStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Administrative Official Response (Required when resolving/rejecting)
            </label>
            <textarea
              rows={4}
              required={adminStatus === 'resolved' || adminStatus === 'rejected'}
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="State the resolution or reason for rejection..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setSelectedComplaint(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isUpdatingStatus}>
              Save Status & Response
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
