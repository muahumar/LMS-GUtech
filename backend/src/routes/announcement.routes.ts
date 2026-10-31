import { Router } from 'express';
import { announcementController } from '../controllers/announcement.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../schemas/announcement.schemas.js';

export const announcementRoutes = Router();

// Create announcement (Teacher or Admin)
announcementRoutes.post(
  '/',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateBody(createAnnouncementSchema),
  announcementController.createAnnouncement
);

// Feed: global plus enrolled/taught courses, pinned first, paginated
announcementRoutes.get('/', requireAuth, announcementController.listFeed);

// Edit announcement (Author or Admin)
announcementRoutes.patch(
  '/:id',
  requireAuth,
  validateBody(updateAnnouncementSchema),
  announcementController.updateAnnouncement
);

// Delete announcement (Author or Admin)
announcementRoutes.delete('/:id', requireAuth, announcementController.deleteAnnouncement);

// Mark read up to timestamp / announcementId
announcementRoutes.post('/read', requireAuth, announcementController.markRead);
