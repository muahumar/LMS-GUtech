import { courseRepository } from '../repositories/course.repository.js';
import { AppError } from '../utils/appError.js';
import { Course } from '../repositories/types.js';

export class CourseService {
  async getMyCourses(userId: string, role: string): Promise<Course[]> {
    return courseRepository.getCoursesForUser(userId, role);
  }

  async getCourseDetails(courseId: string, userId: string, role: string) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw AppError.notFound('Course not found');
    }

    // Role check
    if (role === 'student') {
      const isEnrolled = await courseRepository.isEnrolled(courseId, userId);
      if (!isEnrolled || course.isArchived) {
        throw AppError.forbidden('You are not enrolled in this course');
      }
    } else if (role === 'teacher') {
      const teaches = await courseRepository.teaches(courseId, userId);
      if (!teaches) {
        throw AppError.forbidden('You do not teach this course');
      }
    }

    const teachers = await courseRepository.getTeachers(courseId);
    return {
      ...course,
      teachers,
    };
  }

  async verifyCourseAccess(courseId: string, userId: string, role: string): Promise<void> {
    if (role === 'admin') return;

    if (role === 'teacher') {
      const teaches = await courseRepository.teaches(courseId, userId);
      if (!teaches) {
        throw AppError.forbidden('You do not teach this course');
      }
      return;
    }

    if (role === 'student') {
      const isEnrolled = await courseRepository.isEnrolled(courseId, userId);
      if (!isEnrolled) {
        throw AppError.forbidden('You are not enrolled in this course');
      }
      return;
    }

    throw AppError.forbidden('Permission denied');
  }
}

export const courseService = new CourseService();
