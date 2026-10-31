import { z } from 'zod';

export const createComplaintSchema = z.object({
  category: z.enum(['academic', 'technical', 'facility', 'conduct', 'other'], {
    errorMap: () => ({ message: 'Category must be academic, technical, facility, conduct, or other' }),
  }),
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().min(1, 'Description is required'),
  courseId: z.string().uuid().optional().nullable(),
});

export const updateComplaintSchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'rejected']),
  adminResponse: z.string().optional().nullable(),
}).refine((data) => {
  if ((data.status === 'resolved' || data.status === 'rejected') && (!data.adminResponse || data.adminResponse.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'A response is required when resolving or rejecting a complaint',
  path: ['adminResponse'],
});
