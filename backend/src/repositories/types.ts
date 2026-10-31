export type UserRole = 'admin' | 'teacher' | 'student';
export type QuestionType = 'mcq_single' | 'mcq_multi' | 'true_false';
export type ComplaintStatus = 'open' | 'in_review' | 'resolved' | 'rejected';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  rollNo?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface Resource {
  id: string;
  courseId: string;
  uploadedBy: string;
  title: string;
  description?: string | null;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploaderName?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  createdBy: string;
  title: string;
  instructions: string;
  maxMarks: number;
  dueAt: string;
  allowLate: boolean;
  attachmentPath?: string | null;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  textAnswer?: string | null;
  filePath?: string | null;
  submittedAt: string;
  isLate: boolean;
  marksObtained?: number | null;
  feedback?: string | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
  studentName?: string;
  studentRollNo?: string | null;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: QuizQuestionOption[];
  marks: number;
}

export interface QuizAnswer {
  questionId: string;
  correctOptionIds: string[];
}

export interface Quiz {
  id: string;
  courseId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  opensAt: string;
  closesAt: string;
  isPublished: boolean;
  createdAt: string;
  totalMarks?: number;
  questionCount?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string | null;
  answers: Record<string, string[]>;
  score?: number | null;
  studentName?: string;
}

export interface Announcement {
  id: string;
  courseId?: string | null;
  authorId: string;
  authorName?: string;
  courseCode?: string | null;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  isRead?: boolean;
}

export interface AnnouncementRead {
  userId: string;
  announcementId: string;
  readAt: string;
}

export interface ChatMessage {
  id: string;
  courseId: string;
  senderId: string;
  senderName?: string;
  senderRole?: UserRole;
  body: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface Complaint {
  id: string;
  raisedBy: string;
  raisedByName?: string;
  raisedByRole?: string;
  courseId?: string | null;
  courseCode?: string | null;
  category: string;
  subject: string;
  description: string;
  attachmentPath?: string | null;
  status: ComplaintStatus;
  adminResponse?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  at: string;
}

export interface StudentMark {
  studentId: string;
  courseId: string;
  kind: 'assignment' | 'quiz';
  itemId: string;
  title: string;
  obtained: number | null;
  max: number;
  gradedAt: string | null;
}
