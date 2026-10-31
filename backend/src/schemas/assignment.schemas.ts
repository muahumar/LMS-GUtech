import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  instructions: z.string().min(1, 'Instructions are required'),
  maxMarks: z.coerce.number().positive('Max marks must be greater than 0'),
  dueAt: z.string().datetime('Due date must be a valid ISO timestamp'),
  allowLate: z.boolean().optional().default(false),
  attachmentPath: z.string().optional().nullable(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  instructions: z.string().min(1).optional(),
  maxMarks: z.coerce.number().positive().optional(),
  dueAt: z.string().datetime().optional(),
  allowLate: z.boolean().optional(),
  attachmentPath: z.string().optional().nullable(),
});

export const submitAssignmentSchema = z.object({
  textAnswer: z.string().optional().nullable(),
  filePath: z.string().optional().nullable(),
}).refine((data) => data.textAnswer || data.filePath, {
  message: 'Must submit text answer or file attachment',
});

export const gradeSubmissionSchema = z.object({
  marks: z.coerce.number().min(0, 'Marks cannot be negative'),
  feedback: z.string().optional().nullable(),
});
