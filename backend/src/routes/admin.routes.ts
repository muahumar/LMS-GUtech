import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createUserSchema,
  updateUserSchema,
  createCourseSchema,
  updateCourseSchema,
  setCourseTeachersSchema,
  enrollStudentsSchema,
} from '../schemas/admin.schemas.js';

export const adminRoutes = Router();

// All admin routes require auth and admin role
adminRoutes.use(requireAuth, requireRole('admin'));

// Users
adminRoutes.post('/users', validateBody(createUserSchema), adminController.createUser);
adminRoutes.patch('/users/:id', validateBody(updateUserSchema), adminController.updateUser);
adminRoutes.get('/users', adminController.listUsers);
adminRoutes.post('/users/:id/reset-password', adminController.resetUserPassword);

// Courses
adminRoutes.post('/courses', validateBody(createCourseSchema), adminController.createCourse);
adminRoutes.get('/courses', adminController.listCourses);
adminRoutes.get('/courses/:id', adminController.getCourseDetail);
adminRoutes.patch('/courses/:id', validateBody(updateCourseSchema), adminController.updateCourse);
adminRoutes.put('/courses/:id/teachers', validateBody(setCourseTeachersSchema), adminController.setCourseTeachers);
adminRoutes.post('/courses/:id/enrollments', validateBody(enrollStudentsSchema), adminController.enrollStudents);
adminRoutes.delete('/courses/:id/enrollments/:studentId', adminController.unenrollStudent);

// Audit logs
adminRoutes.get('/audit-logs', adminController.listAuditLogs);
