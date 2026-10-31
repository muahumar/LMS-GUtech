import { assignmentRepository } from '../repositories/assignment.repository.js';
import { courseService } from './course.service.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/appError.js';

export class AssignmentService {
  async createAssignment(
    teacherId: string,
    role: string,
    courseId: string,
    input: {
      title: string;
      instructions: string;
      maxMarks: number;
      dueAt: string;
      allowLate?: boolean;
      attachmentPath?: string | null;
    }
  ) {
    await courseService.verifyCourseAccess(courseId, teacherId, role);

    const assignment = await assignmentRepository.createAssignment({
      courseId,
      createdBy: teacherId,
      title: input.title,
      instructions: input.instructions,
      maxMarks: input.maxMarks,
      dueAt: input.dueAt,
      allowLate: input.allowLate,
      attachmentPath: input.attachmentPath,
    });

    await auditRepository.log('CREATE_ASSIGNMENT', 'assignment', assignment.id, teacherId);
    return assignment;
  }

  async listAssignments(courseId: string, userId: string, role: string) {
    await courseService.verifyCourseAccess(courseId, userId, role);

    const assignments = await assignmentRepository.listByCourse(courseId);

    // If student, attach their submission status
    if (role === 'student') {
      const enriched = await Promise.all(
        assignments.map(async (a) => {
          const submission = await assignmentRepository.getSubmission(a.id, userId);
          let status: 'Pending' | 'Submitted' | 'Late' | 'Graded' = 'Pending';
          if (submission) {
            if (submission.marksObtained !== null) {
              status = 'Graded';
            } else if (submission.isLate) {
              status = 'Late';
            } else {
              status = 'Submitted';
            }
          }
          return {
            ...a,
            mySubmission: submission,
            submissionStatus: status,
          };
        })
      );
      return enriched;
    }

    return assignments;
  }

  async updateAssignment(
    assignmentId: string,
    userId: string,
    role: string,
    updates: any
  ) {
    const a = await assignmentRepository.findById(assignmentId);
    if (!a) {
      throw AppError.notFound('Assignment not found');
    }

    if (role !== 'admin') {
      await courseService.verifyCourseAccess(a.courseId, userId, role);
      if (a.createdBy !== userId) {
        throw AppError.forbidden('Only the creator of this assignment can edit it');
      }
    }

    const updated = await assignmentRepository.updateAssignment(assignmentId, updates);
    await auditRepository.log('UPDATE_ASSIGNMENT', 'assignment', assignmentId, userId);
    return updated;
  }

  async deleteAssignment(assignmentId: string, userId: string, role: string) {
    const a = await assignmentRepository.findById(assignmentId);
    if (!a) {
      throw AppError.notFound('Assignment not found');
    }

    if (role !== 'admin') {
      await courseService.verifyCourseAccess(a.courseId, userId, role);
      if (a.createdBy !== userId) {
        throw AppError.forbidden('Only the creator can delete this assignment');
      }
    }

    await assignmentRepository.deleteAssignment(assignmentId);
    await auditRepository.log('DELETE_ASSIGNMENT', 'assignment', assignmentId, userId);
    return { message: 'Assignment deleted successfully' };
  }

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    input: { textAnswer?: string | null; filePath?: string | null }
  ) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw AppError.notFound('Assignment not found');
    }

    // Verify student is enrolled
    await courseService.verifyCourseAccess(assignment.courseId, studentId, 'student');

    // Rule: Server decides lateness using now() > due_at
    const now = new Date();
    const dueDate = new Date(assignment.dueAt);
    const isLate = now.getTime() > dueDate.getTime();

    // Rule: if allow_late = false after the deadline, reject with 409
    if (isLate && !assignment.allowLate) {
      throw AppError.conflict('Submission deadline has passed and late submissions are not allowed for this assignment');
    }

    const submission = await assignmentRepository.createOrReplaceSubmission({
      assignmentId,
      studentId,
      textAnswer: input.textAnswer,
      filePath: input.filePath,
      isLate,
    });

    await auditRepository.log('SUBMIT_ASSIGNMENT', 'submission', submission.id, studentId);
    return submission;
  }

  async listSubmissions(assignmentId: string, userId: string, role: string) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw AppError.notFound('Assignment not found');
    }

    if (role !== 'admin') {
      await courseService.verifyCourseAccess(assignment.courseId, userId, role);
    }

    return assignmentRepository.listSubmissionsForAssignment(assignmentId);
  }

  async gradeSubmission(
    submissionId: string,
    gradedBy: string,
    role: string,
    marks: number,
    feedback?: string | null
  ) {
    const sub = await assignmentRepository.getSubmissionById(submissionId);
    if (!sub) {
      throw AppError.notFound('Submission not found');
    }

    const assignment = await assignmentRepository.findById(sub.assignmentId);
    if (!assignment) {
      throw AppError.notFound('Assignment not found');
    }

    if (role !== 'admin') {
      await courseService.verifyCourseAccess(assignment.courseId, gradedBy, role);
    }

    // Spec Acceptance Rule: Marks above max_marks rejected (422)
    if (marks > assignment.maxMarks) {
      throw AppError.unprocessable(`Marks (${marks}) cannot exceed maximum allowed marks (${assignment.maxMarks})`);
    }

    if (marks < 0) {
      throw AppError.unprocessable('Marks cannot be negative');
    }

    const graded = await assignmentRepository.gradeSubmission(
      submissionId,
      marks,
      feedback || null,
      gradedBy
    );

    await auditRepository.log('GRADE_SUBMISSION', 'submission', submissionId, gradedBy);
    return graded;
  }
}

export const assignmentService = new AssignmentService();
