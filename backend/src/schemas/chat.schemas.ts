import { z } from 'zod';

export const createChatMessageSchema = z.object({
  body: z
    .string()
    .min(1, 'Message body cannot be empty')
    .max(2000, 'Message body cannot exceed 2000 characters'),
});
