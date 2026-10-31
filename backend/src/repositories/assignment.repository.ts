import { db } from './inMemoryStore.js';
import { Assignment, Submission } from './types.js';
import crypto from 'crypto';

export class AssignmentRepository {
  async findById(id: string): Promise<Assignment | null> {
    const a = db.assignments.find((x) => x.id === id);
    return a ? { ...a } : null;
  }

  async listByCourse(courseId: string): Promise<Assignment[]> {
    return db.assignments
      .filter((a) => a.courseId === courseId)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .map((a) => ({ ...a }));
  }

  async createAssignment(input: {
    courseId: string;
    createdBy: string;
    title: string;
    instructions: string;
    maxMarks: number;
    dueAt: string;
    allowLate?: boolean;
    attachmentPath?: string | null;
  }): Promise<Assignment> {
    const id = crypto.randomUUID();
    const newAssignment: Assignment = {
      id,
      courseId: input.courseId,
      createdBy: input.createdBy,
      title: input.title,
      instructions: input.instructions,
      maxMarks: input.maxMarks,
      dueAt: input.dueAt,
      allowLate: input.allowLate ?? false,
      attachmentPath: input.attachmentPath || null,
      createdAt: new Date().toISOString(),
    };
    db.assignments.push(newAssignment);
    return { ...newAssignment };
  }

  async updateAssignment(
    id: string,
    updates: Partial<{
      title: string;
      instructions: string;
      maxMarks: number;
      dueAt: string;
      allowLate: boolean;
      attachmentPath?: string | null;
    }>
  ): Promise<Assignment | null> {
    const a = db.assignments.find((x) => x.id === id);
    if (!a) return null;

    if (updates.title !== undefined) a.title = updates.title;
    if (updates.instructions !== undefined) a.instructions = updates.instructions;
    if (updates.maxMarks !== undefined) a.maxMarks = updates.maxMarks;
    if (updates.dueAt !== undefined) a.dueAt = updates.dueAt;
    if (updates.allowLate !== undefined) a.allowLate = updates.allowLate;
    if (updates.attachmentPath !== undefined) a.attachmentPath = updates.attachmentPath;

    return { ...a };
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const before = db.assignments.length;
    db.assignments = db.assignments.filter((a) => a.id !== id);
    // Also cascade delete submissions
    db.submissions = db.submissions.filter((s) => s.assignmentId !== id);
    return db.assignments.length < before;
  }

  async getSubmission(assignmentId: string, studentId: string): Promise<Submission | null> {
    const s = db.submissions.find(
      (x) => x.assignmentId === assignmentId && x.studentId === studentId
    );
    if (!s) return null;
    const student = db.profiles.find((p) => p.id === s.studentId);
    return {
      ...s,
      studentName: student?.fullName,
      studentRollNo: student?.rollNo,
    };
  }

  async getSubmissionById(id: string): Promise<Submission | null> {
    const s = db.submissions.find((x) => x.id === id);
    if (!s) return null;
    const student = db.profiles.find((p) => p.id === s.studentId);
    return {
      ...s,
      studentName: student?.fullName,
      studentRollNo: student?.rollNo,
    };
  }

  async createOrReplaceSubmission(input: {
    assignmentId: string;
    studentId: string;
    textAnswer?: string | null;
    filePath?: string | null;
    isLate: boolean;
  }): Promise<Submission> {
    const student = db.profiles.find((p) => p.id === input.studentId);
    const existingIndex = db.submissions.findIndex(
      (s) => s.assignmentId === input.assignmentId && s.studentId === input.studentId
    );

    if (existingIndex >= 0) {
      // Resubmission clears prior grade per spec
      const existing = db.submissions[existingIndex];
      existing.textAnswer = input.textAnswer ?? existing.textAnswer;
      existing.filePath = input.filePath ?? existing.filePath;
      existing.submittedAt = new Date().toISOString();
      existing.isLate = input.isLate;
      existing.marksObtained = null;
      existing.feedback = null;
      existing.gradedBy = null;
      existing.gradedAt = null;

      return {
        ...existing,
        studentName: student?.fullName,
        studentRollNo: student?.rollNo,
      };
    }

    const id = crypto.randomUUID();
    const newSub: Submission = {
      id,
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      textAnswer: input.textAnswer || null,
      filePath: input.filePath || null,
      submittedAt: new Date().toISOString(),
      isLate: input.isLate,
      marksObtained: null,
      feedback: null,
      gradedBy: null,
      gradedAt: null,
      studentName: student?.fullName,
      studentRollNo: student?.rollNo,
    };
    db.submissions.push(newSub);
    return { ...newSub };
  }

  async listSubmissionsForAssignment(assignmentId: string): Promise<Submission[]> {
    return db.submissions
      .filter((s) => s.assignmentId === assignmentId)
      .map((s) => {
        const student = db.profiles.find((p) => p.id === s.studentId);
        return {
          ...s,
          studentName: student?.fullName || 'Unknown Student',
          studentRollNo: student?.rollNo || null,
        };
      });
  }

  async gradeSubmission(
    submissionId: string,
    marksObtained: number,
    feedback: string | null,
    gradedBy: string
  ): Promise<Submission | null> {
    const sub = db.submissions.find((s) => s.id === submissionId);
    if (!sub) return null;

    sub.marksObtained = marksObtained;
    sub.feedback = feedback;
    sub.gradedBy = gradedBy;
    sub.gradedAt = new Date().toISOString();

    const student = db.profiles.find((p) => p.id === sub.studentId);
    return {
      ...sub,
      studentName: student?.fullName,
      studentRollNo: student?.rollNo,
    };
  }
}

export const assignmentRepository = new AssignmentRepository();
