import { db } from './inMemoryStore.js';
import { Complaint, ComplaintStatus } from './types.js';
import crypto from 'crypto';

export class ComplaintRepository {
  async findById(id: string): Promise<Complaint | null> {
    const c = db.complaints.find((x) => x.id === id);
    if (!c) return null;
    const user = db.profiles.find((p) => p.id === c.raisedBy);
    const course = c.courseId ? db.courses.find((x) => x.id === c.courseId) : null;
    return {
      ...c,
      raisedByName: user?.fullName || 'User',
      raisedByRole: user?.role,
      courseCode: course?.code || null,
    };
  }

  async listUserComplaints(userId: string): Promise<Complaint[]> {
    return db.complaints
      .filter((c) => c.raisedBy === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => {
        const user = db.profiles.find((p) => p.id === c.raisedBy);
        const course = c.courseId ? db.courses.find((x) => x.id === c.courseId) : null;
        return {
          ...c,
          raisedByName: user?.fullName || 'User',
          raisedByRole: user?.role,
          courseCode: course?.code || null,
        };
      });
  }

  async listAdminQueue(options: {
    status?: ComplaintStatus;
    category?: string;
    page: number;
    pageSize: number;
  }): Promise<{ complaints: Complaint[]; total: number }> {
    const { status, category, page, pageSize } = options;

    let filtered = [...db.complaints];
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (category) {
      filtered = filtered.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const complaints = paged.map((c) => {
      const user = db.profiles.find((p) => p.id === c.raisedBy);
      const course = c.courseId ? db.courses.find((x) => x.id === c.courseId) : null;
      return {
        ...c,
        raisedByName: user?.fullName || 'User',
        raisedByRole: user?.role,
        courseCode: course?.code || null,
      };
    });

    return { complaints, total };
  }

  async createComplaint(input: {
    raisedBy: string;
    courseId?: string | null;
    category: string;
    subject: string;
    description: string;
    attachmentPath?: string | null;
  }): Promise<Complaint> {
    const id = crypto.randomUUID();
    const user = db.profiles.find((p) => p.id === input.raisedBy);
    const course = input.courseId ? db.courses.find((x) => x.id === input.courseId) : null;

    const newComp: Complaint = {
      id,
      raisedBy: input.raisedBy,
      raisedByName: user?.fullName || 'User',
      raisedByRole: user?.role,
      courseId: input.courseId || null,
      courseCode: course?.code || null,
      category: input.category,
      subject: input.subject,
      description: input.description,
      attachmentPath: input.attachmentPath || null,
      status: 'open',
      adminResponse: null,
      resolvedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.complaints.unshift(newComp);
    return { ...newComp };
  }

  async updateComplaint(
    id: string,
    updates: {
      status: ComplaintStatus;
      adminResponse?: string | null;
      resolvedBy: string;
    }
  ): Promise<Complaint | null> {
    const comp = db.complaints.find((c) => c.id === id);
    if (!comp) return null;

    comp.status = updates.status;
    if (updates.adminResponse !== undefined) {
      comp.adminResponse = updates.adminResponse;
    }
    comp.resolvedBy = updates.resolvedBy;
    comp.updatedAt = new Date().toISOString();

    return this.findById(id);
  }
}

export const complaintRepository = new ComplaintRepository();
