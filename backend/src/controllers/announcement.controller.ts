import { Request, Response, NextFunction } from 'express';
import { announcementService } from '../services/announcement.service.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

export class AnnouncementController {
  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await announcementService.createAnnouncement(
        req.user!.id,
        req.user!.role,
        req.body
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
      const courseId = req.query.courseId as string;

      const { announcements, total, unreadCount } = await announcementService.listFeed(
        req.user!.id,
        req.user!.role,
        { page, pageSize, courseId }
      );

      return sendSuccess(res, { announcements, unreadCount }, { page, pageSize, total });
    } catch (error) {
      next(error);
    }
  }

  async updateAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await announcementService.updateAnnouncement(
        id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await announcementService.deleteAnnouncement(
        id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { announcementId } = req.body;
      const result = await announcementService.markRead(req.user!.id, announcementId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const announcementController = new AnnouncementController();
