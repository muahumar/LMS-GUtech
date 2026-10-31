import { announcementRepository } from '../repositories/announcement.repository.js';
import { courseService } from './course.service.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/appError.js';

export class AnnouncementService {
  async createAnnouncement(
    authorId: string,
    role: string,
    input: {
      courseId?: string | null;
      title: string;
      body: string;
      isPinned?: boolean;
    }
  ) {
    // Spec Rule: null courseId is admin-only
    if (!input.courseId) {
      if (role !== 'admin') {
        throw AppError.forbidden('Only administrators can post global announcements');
      }
    } else {
      // Teacher or admin
      await courseService.verifyCourseAccess(input.courseId, authorId, role);
    }

    const announcement = await announcementRepository.createAnnouncement({
      authorId,
      courseId: input.courseId || null,
      title: input.title,
      body: input.body,
      isPinned: input.isPinned,
    });

    await auditRepository.log('CREATE_ANNOUNCEMENT', 'announcement', announcement.id, authorId);
    return announcement;
  }

  async listFeed(
    userId: string,
    role: string,
    options: { page: number; pageSize: number; courseId?: string }
  ) {
    return announcementRepository.listFeed({
      userId,
      role,
      ...options,
    });
  }

  async updateAnnouncement(
    announcementId: string,
    userId: string,
    role: string,
    updates: any
  ) {
    const a = await announcementRepository.findById(announcementId);
    if (!a) {
      throw AppError.notFound('Announcement not found');
    }

    if (role !== 'admin' && a.authorId !== userId) {
      throw AppError.forbidden('Only the author or an admin can edit this announcement');
    }

    const updated = await announcementRepository.updateAnnouncement(announcementId, updates);
    await auditRepository.log('UPDATE_ANNOUNCEMENT', 'announcement', announcementId, userId);
    return updated;
  }

  async deleteAnnouncement(announcementId: string, userId: string, role: string) {
    const a = await announcementRepository.findById(announcementId);
    if (!a) {
      throw AppError.notFound('Announcement not found');
    }

    if (role !== 'admin' && a.authorId !== userId) {
      throw AppError.forbidden('Only the author or an admin can delete this announcement');
    }

    await announcementRepository.deleteAnnouncement(announcementId);
    await auditRepository.log('DELETE_ANNOUNCEMENT', 'announcement', announcementId, userId);
    return { message: 'Announcement deleted successfully' };
  }

  async markRead(userId: string, announcementId?: string) {
    await announcementRepository.markRead(userId, announcementId);
    return { message: 'Marked as read' };
  }
}

export const announcementService = new AnnouncementService();
