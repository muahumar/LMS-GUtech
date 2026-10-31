import { chatRepository } from '../repositories/chat.repository.js';
import { courseService } from './course.service.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/appError.js';

export class ChatService {
  async getMessages(
    courseId: string,
    userId: string,
    role: string,
    options: { before?: string; limit?: number }
  ) {
    await courseService.verifyCourseAccess(courseId, userId, role);
    return chatRepository.listMessages({
      courseId,
      ...options,
    });
  }

  async sendMessage(
    courseId: string,
    senderId: string,
    role: string,
    body: string
  ) {
    await courseService.verifyCourseAccess(courseId, senderId, role);

    const trimmed = body.trim();
    if (!trimmed) {
      throw AppError.badRequest('Message body cannot be empty');
    }

    const message = await chatRepository.createMessage(courseId, senderId, trimmed);
    return message;
  }

  async deleteMessage(messageId: string, userId: string, role: string) {
    const msg = await chatRepository.getById(messageId);
    if (!msg) {
      throw AppError.notFound('Message not found');
    }

    if (role === 'admin') {
      await chatRepository.softDeleteMessage(messageId);
      await auditRepository.log('DELETE_CHAT_MESSAGE', 'chat_message', messageId, userId);
      return { message: 'Message deleted' };
    }

    if (role === 'teacher') {
      await courseService.verifyCourseAccess(msg.courseId, userId, role);
      await chatRepository.softDeleteMessage(messageId);
      await auditRepository.log('DELETE_CHAT_MESSAGE', 'chat_message', messageId, userId);
      return { message: 'Message deleted' };
    }

    // Student sender: only within 5 minutes per spec
    if (msg.senderId !== userId) {
      throw AppError.forbidden('You can only delete your own messages');
    }

    const messageAgeMs = Date.now() - new Date(msg.createdAt).getTime();
    if (messageAgeMs > 5 * 60 * 1000) {
      throw AppError.forbidden('Messages can only be deleted within 5 minutes of sending');
    }

    await chatRepository.softDeleteMessage(messageId);
    await auditRepository.log('DELETE_CHAT_MESSAGE', 'chat_message', messageId, userId);
    return { message: 'Message deleted' };
  }
}

export const chatService = new ChatService();
