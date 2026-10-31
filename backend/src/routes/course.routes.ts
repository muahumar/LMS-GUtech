import { Router } from 'express';
import { courseController } from '../controllers/course.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const courseRoutes = Router();

courseRoutes.get('/me/courses', requireAuth, courseController.getMyCourses);
courseRoutes.get('/courses/:id', requireAuth, courseController.getCourseDetails);
