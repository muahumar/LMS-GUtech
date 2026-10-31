import { Router } from 'express';
import { complaintController } from '../controllers/complaint.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { generalUpload } from '../middleware/upload.js';
import { updateComplaintSchema } from '../schemas/complaint.schemas.js';

export const complaintRoutes = Router();

// Raise complaint (Student or Teacher)
complaintRoutes.post(
  '/',
  requireAuth,
  requireRole('student', 'teacher'),
  generalUpload.single('attachment'),
  complaintController.createComplaint
);

// My complaints
complaintRoutes.get(
  '/mine',
  requireAuth,
  requireRole('student', 'teacher'),
  complaintController.getMyComplaints
);

// Admin review queue
complaintRoutes.get(
  '/admin/queue',
  requireAuth,
  requireRole('admin'),
  complaintController.getAdminQueue
);

// Admin update status / response
complaintRoutes.patch(
  '/admin/:id',
  requireAuth,
  requireRole('admin'),
  validateBody(updateComplaintSchema),
  complaintController.updateComplaint
);
