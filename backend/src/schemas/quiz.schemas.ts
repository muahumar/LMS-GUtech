import { z } from 'zod';

export const quizQuestionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const quizQuestionInputSchema = z.object({
  prompt: z.string().min(1, 'Question prompt is required'),
  type: z.enum(['mcq_single', 'mcq_multi', 'true_false']),
  marks: z.coerce.number().positive('Marks must be greater than 0'),
  options: z.array(quizQuestionOptionSchema).min(2, 'At least 2 options are required'),
  correctOptionIds: z.array(z.string()).min(1, 'At least one correct option must be specified'),
});

export const createQuizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(200),
  description: z.string().optional().nullable(),
  timeLimitMinutes: z.coerce.number().int().positive('Time limit must be a positive integer in minutes'),
  opensAt: z.string().datetime('Open date must be an ISO timestamp'),
  closesAt: z.string().datetime('Close date must be an ISO timestamp'),
  questions: z.array(quizQuestionInputSchema).min(1, 'Quiz must have at least one question'),
}).refine((data) => new Date(data.closesAt).getTime() > new Date(data.opensAt).getTime(), {
  message: 'Close time must be after open time',
  path: ['closesAt'],
});

export const updateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  timeLimitMinutes: z.coerce.number().int().positive().optional(),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional(),
  isPublished: z.boolean().optional(),
});

export const submitQuizSchema = z.object({
  answers: z.record(z.array(z.string())),
});
