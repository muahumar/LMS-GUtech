import { Router } from 'express';
import { marksController } from '../controllers/marks.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const marksRoutes = Router();

// Student marks
marksRoutes.get('/me/marks', requireAuth, requireRole('student'), marksController.getMyMarks);

// Teacher / Admin gradebook matrix
marksRoutes.get('/courses/:id/gradebook', requireAuth, requireRole('teacher', 'admin'), marksController.getCourseGradebook);

// Teacher / Admin gradebook CSV
marksRoutes.get('/courses/:id/gradebook.csv', requireAuth, requireRole('teacher', 'admin'), marksController.getCourseGradebookCsv);
