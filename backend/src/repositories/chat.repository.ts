import { db } from './inMemoryStore.js';
import { ChatMessage } from './types.js';
import crypto from 'crypto';

export class ChatRepository {
  async listMessages(options: {
    courseId: string;
    before?: string;
    limit?: number;
  }): Promise<{ messages: ChatMessage[]; nextCursor?: string }> {
    const { courseId, before, limit = 50 } = options;

    let filtered = db.chatMessages.filter((m) => m.courseId === courseId);

    if (before) {
      const beforeTime = new Date(before).getTime();
      filtered = filtered.filter((m) => new Date(m.createdAt).getTime() < beforeTime);
    }

    // Sort ascending for chat flow
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const slice = filtered.slice(-limit);
    const nextCursor = slice.length > 0 ? slice[0].createdAt : undefined;

    const messages = slice.map((m) => {
      const sender = db.profiles.find((p) => p.id === m.senderId);
      return {
        ...m,
        senderName: sender?.fullName || 'User',
        senderRole: sender?.role,
        // If deleted, body is replaced with deleted message placeholder
        body: m.deletedAt ? '[This message has been deleted]' : m.body,
      };
    });

    return { messages, nextCursor };
  }

  async createMessage(courseId: string, senderId: string, body: string): Promise<ChatMessage> {
    const id = crypto.randomUUID();
    const sender = db.profiles.find((p) => p.id === senderId);

    const newMsg: ChatMessage = {
      id,
      courseId,
      senderId,
      senderName: sender?.fullName || 'User',
      senderRole: sender?.role,
      body,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    db.chatMessages.push(newMsg);
    return { ...newMsg };
  }

  async getById(id: string): Promise<ChatMessage | null> {
    const m = db.chatMessages.find((x) => x.id === id);
    if (!m) return null;
    const sender = db.profiles.find((p) => p.id === m.senderId);
    return {
      ...m,
      senderName: sender?.fullName || 'User',
      senderRole: sender?.role,
    };
  }

  async softDeleteMessage(id: string): Promise<boolean> {
    const m = db.chatMessages.find((x) => x.id === id);
    if (!m) return false;
    m.deletedAt = new Date().toISOString();
    return true;
  }
}

export const chatRepository = new ChatRepository();
