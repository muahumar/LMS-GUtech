import { Router } from 'express';
import { resourceController } from '../controllers/resource.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { resourceUpload } from '../middleware/upload.js';

export const resourceRoutes = Router();

// Upload resource: Teacher of course or Admin
resourceRoutes.post(
  '/courses/:id/resources',
  requireAuth,
  requireRole('teacher', 'admin'),
  resourceUpload.single('file'),
  resourceController.uploadResource
);

// List resources: Enrolled students or teachers
resourceRoutes.get('/courses/:id/resources', requireAuth, resourceController.listResources);

// Download signed URL: Enrolled or teaches
resourceRoutes.get('/resources/:id/download', requireAuth, resourceController.getDownloadUrl);

// Delete resource: Uploader or admin
resourceRoutes.delete('/resources/:id', requireAuth, resourceController.deleteResource);
