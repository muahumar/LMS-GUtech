import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createQuizSchema,
  updateQuizSchema,
  submitQuizSchema,
} from '../schemas/quiz.schemas.js';

export const quizRoutes = Router();

// Create quiz (Teacher / Admin)
quizRoutes.post(
  '/courses/:id/quizzes',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateBody(createQuizSchema),
  quizController.createQuiz
);

// Edit / publish / unpublish quiz
quizRoutes.patch(
  '/quizzes/:id',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateBody(updateQuizSchema),
  quizController.updateQuiz
);

// List quizzes for course
quizRoutes.get('/courses/:id/quizzes', requireAuth, quizController.listQuizzes);

// Get quiz details (questions without answers for student, with answers for teacher)
quizRoutes.get('/quizzes/:id', requireAuth, quizController.getQuizDetails);

// Start attempt (Student only)
quizRoutes.post(
  '/quizzes/:id/attempt',
  requireAuth,
  requireRole('student'),
  quizController.startAttempt
);

// Submit attempt (Student only)
quizRoutes.post(
  '/quizzes/:id/attempt/submit',
  requireAuth,
  requireRole('student'),
  validateBody(submitQuizSchema),
  quizController.submitAttempt
);

// Results (Teacher / Admin)
quizRoutes.get(
  '/quizzes/:id/results',
  requireAuth,
  requireRole('teacher', 'admin'),
  quizController.listResults
);
