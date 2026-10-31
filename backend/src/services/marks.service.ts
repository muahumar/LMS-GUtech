import { marksRepository } from '../repositories/marks.repository.js';
import { courseService } from './course.service.js';
import { AppError } from '../utils/appError.js';

export class MarksService {
  async getStudentMarks(
    targetStudentId: string,
    requestingUserId: string,
    role: string,
    courseId?: string
  ) {
    // Spec Acceptance Rule: A student can never request another student's marks (403)
    if (role === 'student' && requestingUserId !== targetStudentId) {
      throw AppError.forbidden('Students cannot view other students marks');
    }

    if (courseId) {
      await courseService.verifyCourseAccess(courseId, requestingUserId, role);
    }

    return marksRepository.getStudentMarks(targetStudentId, courseId);
  }

  async getGradebook(courseId: string, userId: string, role: string) {
    if (role !== 'admin') {
      await courseService.verifyCourseAccess(courseId, userId, role);
    }
    return marksRepository.getGradebookMatrix(courseId);
  }

  async getGradebookCsv(courseId: string, userId: string, role: string) {
    if (role !== 'admin') {
      await courseService.verifyCourseAccess(courseId, userId, role);
    }
    return marksRepository.generateGradebookCsv(courseId);
  }
}

export const marksService = new MarksService();
