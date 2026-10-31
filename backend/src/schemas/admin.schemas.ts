import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'teacher', 'student'], {
    errorMap: () => ({ message: "Role must be 'admin', 'teacher', or 'student'" }),
  }),
  rollNo: z.string().optional().nullable(),
  tempPassword: z.string().min(8).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
  rollNo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createCourseSchema = z.object({
  code: z.string().min(2).max(20, 'Course code too long'),
  title: z.string().min(2, 'Course title must be at least 2 characters'),
  description: z.string().optional().nullable(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
});

export const setCourseTeachersSchema = z.object({
  teacherIds: z.array(z.string().uuid('Invalid teacher UUID')),
});

export const enrollStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid('Invalid student UUID')).optional(),
  csvContent: z.string().optional(),
});
