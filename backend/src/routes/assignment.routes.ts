import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from '../schemas/assignment.schemas.js';

export const assignmentRoutes = Router();

// Create assignment (Teacher / Admin)
assignmentRoutes.post(
  '/courses/:id/assignments',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateBody(createAssignmentSchema),
  assignmentController.createAssignment
);

// List assignments for course (with submission status if student)
assignmentRoutes.get(
  '/courses/:id/assignments',
  requireAuth,
  assignmentController.listAssignments
);

// Edit assignment
assignmentRoutes.patch(
  '/assignments/:id',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateBody(updateAssignmentSchema),
  assignmentController.updateAssignment
);

// Delete assignment
assignmentRoutes.delete(
  '/assignments/:id',
  requireAuth,
  requireRole('teacher', 'admin'),
  assignmentController.deleteAssignment
);

// Student submit or resubmit
assignmentRoutes.put(
  '/assignments/:id/submission',
  requireAuth,
  requireRole('student'),
  validateBody(submitAssignmentSchema),
  assignmentController.submitAssignment
);

// Teacher list all submissions
assignmentRoutes.get(
  '/assignments/:id/submissions',
  requireAuth,
  requireRole('teacher', 'admin'),
  assignmentController.listSubmissions
);

// Teacher grade submission
assignmentRoutes.patch(
  '/submissions/:id/grade',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateBody(gradeSubmissionSchema),
  assignmentController.gradeSubmission
);
