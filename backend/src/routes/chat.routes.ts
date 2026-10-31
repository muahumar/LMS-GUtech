import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { chatRateLimiter } from '../middleware/rateLimit.js';
import { createChatMessageSchema } from '../schemas/chat.schemas.js';

export const chatRoutes = Router();

// Cursor-paginated history for course members
chatRoutes.get('/courses/:id/messages', requireAuth, chatController.getMessages);

// Send message (rate-limited 20/min/user)
chatRoutes.post(
  '/courses/:id/messages',
  requireAuth,
  chatRateLimiter,
  validateBody(createChatMessageSchema),
  chatController.sendMessage
);

// Soft delete
chatRoutes.delete('/messages/:id', requireAuth, chatController.deleteMessage);
