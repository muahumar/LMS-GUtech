import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { formatDate, formatBytes } from '../../lib/utils.js';
import {
  BookOpen,
  FolderOpen,
  ClipboardList,
  HelpCircle,
  MessageSquare,
  Award,
  Upload,
  Download,
  Trash2,
  PlusCircle,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'resources';
  const { user } = useAuth();
  const role = user?.role;

  // Course metadata
  const [course, setCourse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Resources state
  const [resources, setResources] = useState<any[]>([]);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Tab 2: Assignments state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isCreateAssignOpen, setIsCreateAssignOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState(100);
  const [assignDueAt, setAssignDueAt] = useState('');
  const [assignAllowLate, setAssignAllowLate] = useState(false);

  // Assignment submission / grading state
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [gradingMarks, setGradingMarks] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});

  // Tab 3: Quizzes state
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([
    {
      prompt: 'Sample Question 1',
      type: 'mcq_single',
      marks: 5,
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
      ],
      correctOptionIds: ['a'],
    },
  ]);

  // Student Quiz Runner state
  const [activeQuizAttempt, setActiveQuizAttempt] = useState<any | null>(null);
  const [quizRemainingSeconds, setQuizRemainingSeconds] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string[]>>({});
  const [quizScoreResult, setQuizScoreResult] = useState<any | null>(null);

  // Tab 4: Classroom Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Tab 5: Gradebook state
  const [gradebook, setGradebook] = useState<any | null>(null);
  const [studentMarks, setStudentMarks] = useState<any | null>(null);

  // ==========================================
  // LOADERS
  // ==========================================
  const loadCourseData = async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const c = await api.get<any>(`/courses/${courseId}`);
      setCourse(c);
      await loadTabContent(currentTab);
    } catch (err: any) {
      setError(err.message || 'Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTabContent = async (tab: string) => {
    if (!courseId) return;
    try {
      if (tab === 'resources') {
        const res = await api.get<any>(`/courses/${courseId}/resources`);
        setResources(Array.isArray(res) ? res : res.resources || []);
      } else if (tab === 'assignments') {
        const res = await api.get<any[]>(`/courses/${courseId}/assignments`);
        setAssignments(Array.isArray(res) ? res : []);
      } else if (tab === 'quizzes') {
        const res = await api.get<any[]>(`/courses/${courseId}/quizzes`);
        setQuizzes(Array.isArray(res) ? res : []);
      } else if (tab === 'chat') {
        const res = await api.get<any>(`/courses/${courseId}/messages`);
        setChatMessages(res?.messages || []);
      } else if (tab === 'gradebook') {
        if (role === 'student') {
          const marks = await api.get<any[]>('/me/marks', { courseId });
          setStudentMarks(marks[0] || null);
        } else {
          const matrix = await api.get<any>(`/courses/${courseId}/gradebook`);
          setGradebook(matrix);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const switchTab = (tab: string) => {
    setSearchParams({ tab });
    loadTabContent(tab);
  };

  // ==========================================
  // RESOURCE HANDLERS
  // ==========================================
  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceFile || !courseId) return;
    setIsUploadingResource(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', resourceFile);
    formData.append('title', resourceTitle);
    formData.append('description', resourceDesc);

    try {
      setUploadProgress(60);
      await api.upload(`/courses/${courseId}/resources`, formData);
      setUploadProgress(100);
      setResourceTitle('');
      setResourceDesc('');
      setResourceFile(null);
      loadTabContent('resources');
    } catch (err: any) {
      alert(err.message || 'Resource upload failed');
    } finally {
      setIsUploadingResource(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadResource = async (resId: string) => {
    try {
      const res = await api.get<{ downloadUrl: string; fileName: string }>(
        `/resources/${resId}/download`
      );
      // Open / trigger download via signed URL
      window.open(res.downloadUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to generate signed download link');
    }
  };

  const handleDeleteResource = async (resId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.delete(`/resources/${resId}`);
      setResources((prev) => prev.filter((r) => r.id !== resId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource');
    }
  };

  // ==========================================
  // ASSIGNMENT HANDLERS
  // ==========================================
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    try {
      await api.post(`/courses/${courseId}/assignments`, {
        title: assignTitle,
        instructions: assignInstructions,
        maxMarks: Number(assignMaxMarks),
        dueAt: new Date(assignDueAt).toISOString(),
        allowLate: assignAllowLate,
      });
      setIsCreateAssignOpen(false);
      setAssignTitle('');
      setAssignInstructions('');
      loadTabContent('assignments');
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    }
  };

  const openAssignmentSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    try {
      const subs = await api.get<any[]>(`/assignments/${assignment.id}/submissions`);
      setSubmissionsList(subs);
      const marksMap: Record<string, number> = {};
      const feedbackMap: Record<string, string> = {};
      subs.forEach((s) => {
        if (s.marksObtained !== null) marksMap[s.id] = s.marksObtained;
        if (s.feedback) feedbackMap[s.id] = s.feedback;
      });
      setGradingMarks(marksMap);
      setGradingFeedback(feedbackMap);
    } catch (err: any) {
      alert(err.message || 'Failed to load submissions');
    }
  };

  const handleSubmitWork = async (assignmentId: string) => {
    if (!submissionText.trim()) {
      alert('Please enter your submission text or report answer');
      return;
    }
    setIsSubmittingWork(true);
    try {
      await api.put(`/assignments/${assignmentId}/submission`, {
        textAnswer: submissionText,
      });
      alert('Work submitted successfully!');
      setSubmissionText('');
      setSelectedAssignment(null);
      loadTabContent('assignments');
    } catch (err: any) {
      alert(err.message || 'Failed to submit work');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleSaveGrade = async (submissionId: string) => {
    const marks = gradingMarks[submissionId];
    const feedback = gradingFeedback[submissionId] || '';
    if (marks === undefined) {
      alert('Please enter valid marks');
      return;
    }

    try {
      await api.patch(`/submissions/${submissionId}/grade`, {
        marks,
        feedback,
      });
      alert('Grade saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save grade');
    }
  };

  // ==========================================
  // QUIZ RUNNER & BUILDER HANDLERS
  // ==========================================
  const handleStartQuiz = async (quiz: any) => {
    try {
      const res = await api.post<any>(`/quizzes/${quiz.id}/attempt`);
      setActiveQuizAttempt({
        ...quiz,
        ...res,
      });
      const remaining = Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000));
      setQuizRemainingSeconds(remaining);
      setStudentAnswers({});
      setQuizScoreResult(null);
    } catch (err: any) {
      alert(err.message || 'Cannot start quiz attempt');
    }
  };

  // Quiz timer effect
  useEffect(() => {
    if (!activeQuizAttempt || quizRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setQuizRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuizAttempt, quizRemainingSeconds]);

  const handleAutoSubmitQuiz = async () => {
    if (!activeQuizAttempt) return;
    await handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizAttempt) return;
    try {
      const res = await api.post<any>(`/quizzes/${activeQuizAttempt.id}/attempt/submit`, {
        answers: studentAnswers,
      });
      setQuizScoreResult(res);
      setActiveQuizAttempt(null);
      loadTabContent('quizzes');
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    }
  };

  // ==========================================
  // CLASSROOM CHAT HANDLERS
  // ==========================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !courseId) return;
    setIsSendingMessage(true);

    try {
      const newMsg = await api.post<any>(`/courses/${courseId}/messages`, {
        body: chatInput,
      });
      setChatMessages((prev) => [...prev, newMsg]);
      setChatInput('');
    } catch (err: any) {
      alert(err.message || 'Message could not be sent (rate limit is 20 msg/min)');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await api.delete(`/messages/${msgId}`);
      setChatMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, body: '[This message has been deleted]', deletedAt: new Date().toISOString() } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Cannot delete message');
    }
  };

  if (isLoading) return <LoadingState message="Loading course curriculum and classroom..." />;
  if (error || !course) return <ErrorState message={error || 'Course not found'} onRetry={loadCourseData} />;

  return (
    <div className="space-y-6">
      {/* Course Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-premium border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-brand-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
              {course.code}
            </span>
            {course.isArchived ? (
              <Badge variant="warning" size="sm">Archived</Badge>
            ) : (
              <Badge variant="brand" size="sm">Active Course</Badge>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">{course.title}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">{course.description}</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto border-b border-slate-200/80 pb-px scrollbar-none gap-2">
        {[
          { id: 'resources', label: 'Resources', icon: FolderOpen },
          { id: 'assignments', label: 'Assignments', icon: ClipboardList },
          { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
          { id: 'chat', label: 'Classroom Chat', icon: MessageSquare },
          { id: 'gradebook', label: role === 'student' ? 'My Marks' : 'Gradebook', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all rounded-t-xl ${
                isActive
                  ? 'border-brand-600 text-brand-700 bg-brand-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RESOURCES */}
      {/* ========================================================= */}
      {currentTab === 'resources' && (
        <div className="space-y-6">
          {/* Upload card for Teacher / Admin */}
          {(role === 'teacher' || role === 'admin') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Upload Course Material
                </h3>
              </div>

              <form onSubmit={handleUploadResource} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Resource Title"
                    required
                    placeholder="e.g. Lecture 4: SQL Normalization Slides"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                  />
                  <Input
                    label="Description (Optional)"
                    placeholder="e.g. Accompanying diagrams and cheat sheet"
                    value={resourceDesc}
                    onChange={(e) => setResourceDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select File (PDF, DOCX, PPTX, Images, ZIP &bull; Max 25 MB)
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                  />
                </div>

                {isUploadingResource && (
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-600 h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isUploadingResource}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Upload Resource
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Resources List */}
          {resources.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No course resources uploaded"
              description="Instructor slides, syllabus documents, and lab sheets will appear here."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle divide-y divide-slate-100 overflow-hidden">
              {resources.map((res) => (
                <div key={res.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {res.title}
                      </h4>
                      {res.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{res.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                        <span>{formatBytes(res.sizeBytes)}</span>
                        <span>&bull;</span>
                        <span>{formatDate(res.createdAt)}</span>
                        <span>&bull;</span>
                        <span>By {res.uploaderName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadResource(res.id)}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                    {(role === 'admin' || user?.id === res.uploadedBy) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(res.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ASSIGNMENTS */}
      {/* ========================================================= */}
      {currentTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Course Coursework & Deliverables</h3>
              <p className="text-xs text-slate-500">Submit homework and monitor graded evaluations</p>
            </div>

            {(role === 'teacher' || role === 'admin') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateAssignOpen(true)}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Create Assignment
              </Button>
            )}
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments posted"
              description="Check back later for newly assigned coursework and laboratory reports."
            />
          ) : (
            <div className="space-y-4">
              {assignments.map((assign) => (
                <div
                  key={assign.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{assign.title}</h4>
                      <Badge variant="brand" size="sm">{assign.maxMarks} Points</Badge>
                      {assign.allowLate && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Late Allowed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{assign.instructions}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {formatDate(assign.dueAt)}</span>
                    </div>
                  </div>

                  {/* Student View: Status & Submit */}
                  {role === 'student' && (
                    <div className="flex items-center gap-3 shrink-0">
                      <div>
                        {assign.submissionStatus === 'Graded' ? (
                          <Badge variant="success" size="sm">
                            Graded: {assign.mySubmission?.marksObtained} / {assign.maxMarks}
                          </Badge>
                        ) : assign.submissionStatus === 'Submitted' ? (
                          <Badge variant="indigo" size="sm">Submitted</Badge>
                        ) : assign.submissionStatus === 'Late' ? (
                          <Badge variant="warning" size="sm">Late Submission</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">Pending</Badge>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedAssignment(assign)}
                      >
                        {assign.mySubmission ? 'Resubmit Work' : 'Submit Work'}
                      </Button>
                    </div>
                  )}

                  {/* Teacher View: Grading Table */}
                  {(role === 'teacher' || role === 'admin') && (
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignmentSubmissions(assign)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View & Grade Submissions
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Student Submit Modal */}
          <Modal
            isOpen={Boolean(selectedAssignment && role === 'student')}
            onClose={() => setSelectedAssignment(null)}
            title={`Submit: ${selectedAssignment?.title}`}
            description="Submit your report or code. Resubmissions prior to deadline clear prior grades."
          >
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong>Instructions:</strong> {selectedAssignment?.instructions}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Submission Text / Link / Solution
                </label>
                <textarea
                  rows={5}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste your source code, GitHub repository link, or write answers here..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="md" onClick={() => setSelectedAssignment(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isSubmittingWork}
                  onClick={() => handleSubmitWork(selectedAssignment?.id)}
                >
                  Confirm Submission
                </Button>
              </div>
            </div>
          </Modal>

          {/* Teacher Submissions Grading Modal */}
          <Modal
            isOpen={Boolean(selectedAssignment && (role === 'teacher' || role === 'admin'))}
            onClose={() => setSelectedAssignment(null)}
            title={`Grading: ${selectedAssignment?.title}`}
            description={`Max marks: ${selectedAssignment?.maxMarks} points`}
            maxWidth="2xl"
          >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {submissionsList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No student submissions yet.</p>
              ) : (
                submissionsList.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{sub.studentName}</span>
                        <span className="text-[11px] text-slate-500 ml-2 font-mono">({sub.studentRollNo})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Submitted: {formatDate(sub.submittedAt)} {sub.isLate && <Badge variant="warning" size="sm">LATE</Badge>}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800">
                      {sub.textAnswer || 'No text answer (file submission)'}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <Input
                        label="Marks"
                        type="number"
                        min="0"
                        max={selectedAssignment.maxMarks}
                        value={gradingMarks[sub.id] ?? ''}
                        onChange={(e) =>
                          setGradingMarks({ ...gradingMarks, [sub.id]: Number(e.target.value) })
                        }
                        className="py-1.5"
                      />

                      <Input
                        label="Instructor Feedback"
                        placeholder="Feedback comments..."
                        value={gradingFeedback[sub.id] ?? ''}
                        onChange={(e) =>
                          setGradingFeedback({ ...gradingFeedback, [sub.id]: e.target.value })
                        }
                        className="py-1.5"
                      />

                      <div className="pt-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveGrade(sub.id)}
                          className="w-full"
                        >
                          Save Grade
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Modal>

          {/* Create Assignment Modal */}
          <Modal
            isOpen={isCreateAssignOpen}
            onClose={() => setIsCreateAssignOpen(false)}
            title="Create Course Assignment"
            description="Post a graded coursework with deadline and late-submission policy."
          >
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <Input
                label="Assignment Title"
                required
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="e.g. Lab 3: Relational Algebra Queries"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Instructions & Specifications
                </label>
                <textarea
                  rows={4}
                  required
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Provide rubrics, expectations, and deliverables..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Max Points"
                  type="number"
                  required
                  min="1"
                  value={assignMaxMarks}
                  onChange={(e) => setAssignMaxMarks(Number(e.target.value))}
                />

                <Input
                  label="Due Date & Time"
                  type="datetime-local"
                  required
                  value={assignDueAt}
                  onChange={(e) => setAssignDueAt(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={assignAllowLate}
                  onChange={(e) => setAssignAllowLate(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>Allow submissions after deadline (flagged as Late)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="md" onClick={() => setIsCreateAssignOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Publish Assignment
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: QUIZZES */}
      {/* ========================================================= */}
      {currentTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Timed Quizzes & Assessments</h3>
              <p className="text-xs text-slate-500">Auto-graded single/multi-choice and true/false assessments</p>
            </div>

            {(role === 'teacher' || role === 'admin') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateQuizOpen(true)}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                New Timed Quiz
              </Button>
            )}
          </div>

          {/* Score Result Banner */}
          {quizScoreResult && (
            <div className="p-5 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  <h4 className="font-bold text-sm">Quiz Submitted & Evaluated</h4>
                </div>
                <p className="text-xs text-brand-700 mt-1">
                  Your final auto-graded score: <strong>{quizScoreResult.score}</strong> / {quizScoreResult.totalMarks} points.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setQuizScoreResult(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Active Quiz Runner */}
          {activeQuizAttempt && (
            <div className="bg-white p-6 rounded-3xl border-2 border-brand-500 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{activeQuizAttempt.title}</h3>
                  <p className="text-xs text-slate-500">Single attempt mode. Answers are auto-graded.</p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono text-sm font-bold animate-pulse">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>
                    {Math.floor(quizRemainingSeconds / 60)}:
                    {(quizRemainingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {activeQuizAttempt.questions?.map((q: any, idx: number) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Question {idx + 1} of {activeQuizAttempt.questions.length}
                      </span>
                      <Badge variant="brand" size="sm">{q.marks} Pts</Badge>
                    </div>

                    <p className="font-bold text-slate-900 text-sm">{q.prompt}</p>

                    <div className="space-y-2">
                      {q.options?.map((opt: any) => {
                        const selected = studentAnswers[q.id]?.includes(opt.id) || false;
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              selected
                                ? 'bg-brand-50 border-brand-500 text-brand-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type={q.type === 'mcq_multi' ? 'checkbox' : 'radio'}
                              name={`question-${q.id}`}
                              checked={selected}
                              onChange={() => {
                                if (q.type === 'mcq_multi') {
                                  const current = studentAnswers[q.id] || [];
                                  const next = current.includes(opt.id)
                                    ? current.filter((x) => x !== opt.id)
                                    : [...current, opt.id];
                                  setStudentAnswers({ ...studentAnswers, [q.id]: next });
                                } else {
                                  setStudentAnswers({ ...studentAnswers, [q.id]: [opt.id] });
                                }
                              }}
                              className="text-brand-600 focus:ring-brand-500"
                            />
                            <span>{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmitQuiz}
                  className="shadow-glow"
                >
                  Submit & Finish Quiz
                </Button>
              </div>
            </div>
          )}

          {/* Quizzes List */}
          {quizzes.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No quizzes scheduled"
              description="Timed quizzes will be listed here when published by the instructor."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="indigo" size="sm">{quiz.timeLimitMinutes} Minutes</Badge>
                      {quiz.isPublished ? (
                        <Badge variant="success" size="sm">Published</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Draft</Badge>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{quiz.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{quiz.description}</p>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Total Points: {quiz.totalMarks} &bull; Questions: {quiz.questionCount}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {role === 'student' ? (
                      quiz.hasAttempted ? (
                        <Badge variant="slate" size="sm">
                          Completed (Score: {quiz.myAttempt?.score})
                        </Badge>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartQuiz(quiz)}
                        >
                          Start Quiz
                        </Button>
                      )
                    ) : (
                      <span className="text-xs text-slate-500">Instructor mode</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CLASSROOM CHAT */}
      {/* ========================================================= */}
      {currentTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col h-[600px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {course.code} Classroom Discussion
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Rate limit: 20 messages / min</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                No chat messages yet. Start the conversation with your classmates!
              </p>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700">{msg.senderName}</span>
                      <Badge variant={msg.senderRole === 'teacher' ? 'brand' : 'slate'} size="sm">
                        {msg.senderRole}
                      </Badge>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>

                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs relative group ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-900 rounded-tl-none'
                      } ${msg.deletedAt ? 'italic opacity-60' : ''}`}
                    >
                      {msg.body}

                      {/* Delete button (sender within 5m or teacher/admin) */}
                      {!msg.deletedAt && (isMe || role === 'teacher' || role === 'admin') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 p-1 bg-white shadow rounded-full text-slate-400 hover:text-rose-500 transition-opacity"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2">
            <Input
              placeholder="Type your message to the class..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="py-2"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSendingMessage}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: GRADEBOOK & MY MARKS */}
      {/* ========================================================= */}
      {currentTab === 'gradebook' && (
        <div className="space-y-6">
          {role === 'student' ? (
            /* Student View */
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic Marks & Evaluation</h3>
                  <p className="text-xs text-slate-500">Breakdown of submitted assignments and completed quizzes</p>
                </div>
                {studentMarks?.percentage !== null && studentMarks?.percentage !== undefined && (
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Total Score</span>
                    <div className="text-2xl font-black text-brand-600">{studentMarks.percentage}%</div>
                  </div>
                )}
              </div>

              {!studentMarks || studentMarks.items?.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No marks recorded yet"
                  description="Grades will appear here as soon as assignments and quizzes are evaluated."
                />
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                  <table className="min-w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-3.5">Assessment Item</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Score Obtained</th>
                        <th className="px-5 py-3.5">Max Points</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentMarks.items.map((item: any) => (
                        <tr key={item.itemId}>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{item.title}</td>
                          <td className="px-5 py-3.5 uppercase text-slate-500">{item.kind}</td>
                          <td className="px-5 py-3.5 font-bold text-brand-700">
                            {item.obtained !== null ? item.obtained : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{item.max}</td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={item.status === 'Graded' ? 'success' : item.status === 'Pending' ? 'warning' : 'slate'}
                              size="sm"
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Teacher / Admin Gradebook Matrix View */
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Gradebook Matrix</h3>
                  <p className="text-xs text-slate-500">Student performance matrix with auto-calculated aggregates</p>
                </div>
                <a
                  href={`/api/courses/${courseId}/gradebook.csv`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600" />
                  <span>Export CSV (UTF-8 BOM)</span>
                </a>
              </div>

              {!gradebook || gradebook.students?.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No enrolled students"
                  description="Enroll students to begin generating gradebook records."
                />
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="min-w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10">Student</th>
                        {gradebook.items?.map((item: any) => (
                          <th key={item.id} className="px-4 py-3 text-center whitespace-nowrap">
                            <div>{item.title}</div>
                            <span className="text-[10px] text-slate-400 font-normal">({item.maxMarks} pts)</span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right">Total %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gradebook.students.map((st: any) => (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-white">
                            <div>{st.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{st.rollNo}</div>
                          </td>
                          {gradebook.items?.map((item: any) => {
                            const m = st.marks[item.id];
                            return (
                              <td key={item.id} className="px-4 py-3 text-center font-mono">
                                {m && m.status === 'Graded' ? (
                                  <span className="font-bold text-brand-700">{m.obtained}</span>
                                ) : m && m.status === 'Pending' ? (
                                  <span className="text-amber-600 text-[10px]">Pending</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right font-black text-brand-700">
                            {st.percentage !== null ? `${st.percentage}%` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
