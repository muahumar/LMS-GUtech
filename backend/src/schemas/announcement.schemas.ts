import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  courseId: z.string().uuid('Invalid course ID').optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body text is required'),
  isPinned: z.boolean().optional().default(false),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
});
