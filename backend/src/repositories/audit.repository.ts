import { db } from './inMemoryStore.js';
import { AuditLog } from './types.js';

export class AuditRepository {
  private currentId = 1;

  async log(action: string, entity: string, entityId?: string | null, actorId?: string | null): Promise<AuditLog> {
    const entry: AuditLog = {
      id: this.currentId++,
      actorId: actorId || null,
      action,
      entity,
      entityId: entityId || null,
      at: new Date().toISOString(),
    };
    db.auditLogs.unshift(entry);
    return entry;
  }

  async list(options: { page: number; pageSize: number }): Promise<{ logs: AuditLog[]; total: number }> {
    const { page, pageSize } = options;
    const total = db.auditLogs.length;
    const start = (page - 1) * pageSize;
    const paged = db.auditLogs.slice(start, start + pageSize);
    return { logs: paged.map((l) => ({ ...l })), total };
  }
}

export const auditRepository = new AuditRepository();
