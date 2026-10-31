import { db } from './inMemoryStore.js';
import { Resource } from './types.js';
import crypto from 'crypto';

export class ResourceRepository {
  async findById(id: string): Promise<Resource | null> {
    const r = db.resources.find((x) => x.id === id);
    if (!r) return null;
    const uploader = db.profiles.find((p) => p.id === r.uploadedBy);
    return {
      ...r,
      uploaderName: uploader ? uploader.fullName : 'Instructor',
    };
  }

  async listByCourse(options: {
    courseId: string;
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<{ resources: Resource[]; total: number }> {
    const { courseId, page, pageSize, search } = options;

    let filtered = db.resources.filter((r) => r.courseId === courseId);
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          (r.description && r.description.toLowerCase().includes(term)) ||
          r.fileName.toLowerCase().includes(term)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const resources = paged.map((r) => {
      const uploader = db.profiles.find((p) => p.id === r.uploadedBy);
      return {
        ...r,
        uploaderName: uploader ? uploader.fullName : 'Instructor',
      };
    });

    return { resources, total };
  }

  async createResource(input: {
    courseId: string;
    uploadedBy: string;
    title: string;
    description?: string;
    filePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<Resource> {
    const id = crypto.randomUUID();
    const uploader = db.profiles.find((p) => p.id === input.uploadedBy);

    const newRes: Resource = {
      id,
      courseId: input.courseId,
      uploadedBy: input.uploadedBy,
      title: input.title,
      description: input.description || null,
      filePath: input.filePath,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      createdAt: new Date().toISOString(),
      uploaderName: uploader ? uploader.fullName : 'Instructor',
    };

    db.resources.unshift(newRes);
    return { ...newRes };
  }

  async deleteResource(id: string): Promise<boolean> {
    const before = db.resources.length;
    db.resources = db.resources.filter((r) => r.id !== id);
    return db.resources.length < before;
  }

  generateSignedUrl(filePath: string): string {
    // Generate valid simulated 60-second signed URL for download
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    const signature = crypto.createHmac('sha256', 'mock-secret').update(`${filePath}:${expiresAt}`).digest('hex');
    return `/api/storage/signed-download?path=${encodeURIComponent(filePath)}&expires=${expiresAt}&token=${signature}`;
  }
}

export const resourceRepository = new ResourceRepository();
