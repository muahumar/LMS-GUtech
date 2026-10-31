import { db } from './inMemoryStore.js';
import { Announcement } from './types.js';
import crypto from 'crypto';

export class AnnouncementRepository {
  async findById(id: string): Promise<Announcement | null> {
    const a = db.announcements.find((x) => x.id === id);
    if (!a) return null;
    const author = db.profiles.find((p) => p.id === a.authorId);
    const course = a.courseId ? db.courses.find((c) => c.id === a.courseId) : null;
    return {
      ...a,
      authorName: author?.fullName || 'GUtech Faculty',
      courseCode: course?.code || null,
    };
  }

  async listFeed(options: {
    userId: string;
    role: string;
    page: number;
    pageSize: number;
    courseId?: string;
  }): Promise<{ announcements: Announcement[]; total: number; unreadCount: number }> {
    const { userId, role, page, pageSize, courseId } = options;

    let allowedCourseIds: (string | null)[] = [null]; // All users see global announcements
    if (role === 'admin') {
      allowedCourseIds = [...allowedCourseIds, ...db.courses.map((c) => c.id)];
    } else if (role === 'teacher') {
      const taught = db.courseTeachers
        .filter((ct) => ct.teacherId === userId)
        .map((ct) => ct.courseId);
      allowedCourseIds = [...allowedCourseIds, ...taught];
    } else {
      // student
      const enrolled = db.enrollments
        .filter((e) => e.studentId === userId)
        .map((e) => e.courseId);
      allowedCourseIds = [...allowedCourseIds, ...enrolled];
    }

    let filtered = db.announcements.filter((a) =>
      allowedCourseIds.includes(a.courseId ?? null)
    );

    if (courseId) {
      filtered = filtered.filter((a) => a.courseId === courseId);
    }

    // Pinned first, then created_at desc
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const readIds = new Set(
      db.announcementReads
        .filter((r) => r.userId === userId)
        .map((r) => r.announcementId)
    );

    const total = filtered.length;
    const unreadCount = filtered.filter((a) => !readIds.has(a.id)).length;

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const announcements = paged.map((a) => {
      const author = db.profiles.find((p) => p.id === a.authorId);
      const course = a.courseId ? db.courses.find((c) => c.id === a.courseId) : null;
      return {
        ...a,
        authorName: author?.fullName || 'GUtech Staff',
        courseCode: course?.code || null,
        isRead: readIds.has(a.id),
      };
    });

    return { announcements, total, unreadCount };
  }

  async createAnnouncement(input: {
    courseId?: string | null;
    authorId: string;
    title: string;
    body: string;
    isPinned?: boolean;
  }): Promise<Announcement> {
    const id = crypto.randomUUID();
    const author = db.profiles.find((p) => p.id === input.authorId);
    const course = input.courseId ? db.courses.find((c) => c.id === input.courseId) : null;

    const newAnnouncement: Announcement = {
      id,
      courseId: input.courseId || null,
      authorId: input.authorId,
      authorName: author?.fullName || 'Faculty',
      courseCode: course?.code || null,
      title: input.title,
      body: input.body,
      isPinned: input.isPinned ?? false,
      createdAt: new Date().toISOString(),
      isRead: true, // author has read their own
    };

    db.announcements.unshift(newAnnouncement);
    // Mark as read for author
    db.announcementReads.push({
      userId: input.authorId,
      announcementId: id,
      readAt: new Date().toISOString(),
    });

    return { ...newAnnouncement };
  }

  async updateAnnouncement(
    id: string,
    updates: Partial<{
      title: string;
      body: string;
      isPinned: boolean;
    }>
  ): Promise<Announcement | null> {
    const a = db.announcements.find((x) => x.id === id);
    if (!a) return null;

    if (updates.title !== undefined) a.title = updates.title;
    if (updates.body !== undefined) a.body = updates.body;
    if (updates.isPinned !== undefined) a.isPinned = updates.isPinned;

    return this.findById(id);
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const before = db.announcements.length;
    db.announcements = db.announcements.filter((a) => a.id !== id);
    db.announcementReads = db.announcementReads.filter((ar) => ar.announcementId !== id);
    return db.announcements.length < before;
  }

  async markRead(userId: string, announcementId?: string): Promise<void> {
    if (announcementId) {
      const already = db.announcementReads.some(
        (ar) => ar.userId === userId && ar.announcementId === announcementId
      );
      if (!already) {
        db.announcementReads.push({
          userId,
          announcementId,
          readAt: new Date().toISOString(),
        });
      }
    } else {
      // Mark all accessible announcements as read
      for (const a of db.announcements) {
        const already = db.announcementReads.some(
          (ar) => ar.userId === userId && ar.announcementId === a.id
        );
        if (!already) {
          db.announcementReads.push({
            userId,
            announcementId: a.id,
            readAt: new Date().toISOString(),
          });
        }
      }
    }
  }
}

export const announcementRepository = new AnnouncementRepository();
