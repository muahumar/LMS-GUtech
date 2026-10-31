import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

export class ChatController {
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const before = req.query.before as string;
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));

      const result = await chatService.getMessages(
        id,
        req.user!.id,
        req.user!.role,
        { before, limit }
      );

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const { body } = req.body;

      const message = await chatService.sendMessage(
        id,
        req.user!.id,
        req.user!.role,
        body
      );

      return sendCreated(res, message);
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // messageId
      const result = await chatService.deleteMessage(
        id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
