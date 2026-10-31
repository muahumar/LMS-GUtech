import { userRepository } from '../repositories/user.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/appError.js';
import { UserRole } from '../repositories/types.js';

export class AdminService {
  async createUser(adminId: string, input: {
    fullName: string;
    email: string;
    role: UserRole;
    rollNo?: string | null;
    tempPassword?: string;
  }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('A user with this email address already exists');
    }

    const user = await userRepository.createUser({
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      rollNo: input.rollNo,
      password: input.tempPassword || 'TempPass123!',
      mustChangePassword: true,
    });

    await auditRepository.log('CREATE_USER', 'user', user.id, adminId);
    return user;
  }

  async updateUser(
    adminId: string,
    id: string,
    updates: Partial<{
      fullName: string;
      role: UserRole;
      rollNo?: string | null;
      isActive: boolean;
    }>
  ) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const updated = await userRepository.updateUser(id, updates);
    await auditRepository.log('UPDATE_USER', 'user', id, adminId);
    return updated;
  }

  async listUsers(options: {
    page: number;
    pageSize: number;
    role?: UserRole;
    search?: string;
  }) {
    return userRepository.listUsers(options);
  }

  async triggerPasswordReset(adminId: string, targetId: string) {
    const user = await userRepository.findById(targetId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const tempPassword = 'ResetPass' + Math.floor(1000 + Math.random() * 9000) + '!';
    await userRepository.updatePassword(user.email, tempPassword);
    await userRepository.updateUser(targetId, { mustChangePassword: true });
    await auditRepository.log('RESET_USER_PASSWORD', 'user', targetId, adminId);

    return {
      message: `Password reset initiated for ${user.email}. Temporary credentials set.`,
      tempPassword,
    };
  }

  // Course management
  async createCourse(adminId: string, input: { code: string; title: string; description?: string }) {
    const existing = await courseRepository.findByCode(input.code);
    if (existing) {
      throw AppError.conflict(`Course with code ${input.code} already exists`);
    }

    const course = await courseRepository.createCourse(input);
    await auditRepository.log('CREATE_COURSE', 'course', course.id, adminId);
    return course;
  }

  async updateCourse(
    adminId: string,
    courseId: string,
    updates: Partial<{ title: string; description?: string; isArchived: boolean }>
  ) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw AppError.notFound('Course not found');
    }

    const updated = await courseRepository.updateCourse(courseId, updates);
    await auditRepository.log('UPDATE_COURSE', 'course', courseId, adminId);
    return updated;
  }

  async listCourses(options: { page: number; pageSize: number; search?: string; includeArchived?: boolean }) {
    return courseRepository.listCourses(options);
  }

  async getCourseDetail(courseId: string) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw AppError.notFound('Course not found');
    }

    const teachers = await courseRepository.getTeachers(courseId);
    const students = await courseRepository.getEnrolledStudents(courseId);

    return {
      ...course,
      teachers,
      students,
    };
  }

  async setCourseTeachers(adminId: string, courseId: string, teacherIds: string[]) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw AppError.notFound('Course not found');
    }

    // Verify all IDs are teachers
    for (const tId of teacherIds) {
      const teacher = await userRepository.findById(tId);
      if (!teacher || teacher.role !== 'teacher') {
        throw AppError.badRequest(`User ${tId} is not a valid teacher`);
      }
    }

    const updatedTeachers = await courseRepository.replaceTeachers(courseId, teacherIds);
    await auditRepository.log('ASSIGN_TEACHERS', 'course', courseId, adminId);
    return updatedTeachers;
  }

  async enrollStudents(
    adminId: string,
    courseId: string,
    input: { studentIds?: string[]; csvContent?: string }
  ) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw AppError.notFound('Course not found');
    }

    const targetStudentIds: string[] = [];
    const matched: string[] = [];
    const unknownEmails: string[] = [];
    const duplicates: string[] = [];

    if (input.studentIds && input.studentIds.length > 0) {
      for (const sId of input.studentIds) {
        const student = await userRepository.findById(sId);
        if (student && student.role === 'student') {
          targetStudentIds.push(student.id);
          matched.push(student.email);
        }
      }
    }

    if (input.csvContent) {
      const lines = input.csvContent
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.toLowerCase().startsWith('email'));

      for (const line of lines) {
        const email = line.split(',')[0].trim().toLowerCase();
        if (!email) continue;

        const student = await userRepository.findByEmail(email);
        if (!student) {
          unknownEmails.push(email);
        } else if (student.role !== 'student') {
          unknownEmails.push(`${email} (not a student)`);
        } else {
          if (targetStudentIds.includes(student.id)) {
            duplicates.push(email);
          } else {
            targetStudentIds.push(student.id);
            matched.push(email);
          }
        }
      }
    }

    const result = await courseRepository.enrollStudents(courseId, targetStudentIds);
    await auditRepository.log('ENROLL_STUDENTS', 'course', courseId, adminId);

    return {
      message: `Enrolled ${result.enrolled} students`,
      enrolledCount: result.enrolled,
      duplicateCount: result.duplicates + duplicates.length,
      matched,
      duplicates,
      unknownEmails,
    };
  }

  async unenrollStudent(adminId: string, courseId: string, studentId: string) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw AppError.notFound('Course not found');
    }

    const unenrolled = await courseRepository.unenrollStudent(courseId, studentId);
    if (!unenrolled) {
      throw AppError.notFound('Student was not enrolled in this course');
    }

    await auditRepository.log('UNENROLL_STUDENT', 'course', courseId, adminId);
    return { message: 'Student successfully unenrolled' };
  }
}

export const adminService = new AdminService();
