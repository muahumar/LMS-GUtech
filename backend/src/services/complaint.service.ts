import { complaintRepository } from '../repositories/complaint.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/appError.js';
import { ComplaintStatus } from '../repositories/types.js';
import crypto from 'crypto';

export class ComplaintService {
  async createComplaint(
    userId: string,
    input: {
      courseId?: string | null;
      category: string;
      subject: string;
      description: string;
    },
    file?: Express.Multer.File
  ) {
    let attachmentPath: string | null = null;
    if (file) {
      const fileUuid = crypto.randomUUID();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      attachmentPath = `complaint-attachments/${userId}/${fileUuid}-${safeName}`;
    }

    const complaint = await complaintRepository.createComplaint({
      raisedBy: userId,
      courseId: input.courseId || null,
      category: input.category,
      subject: input.subject,
      description: input.description,
      attachmentPath,
    });

    await auditRepository.log('CREATE_COMPLAINT', 'complaint', complaint.id, userId);
    return complaint;
  }

  async getMyComplaints(userId: string) {
    return complaintRepository.listUserComplaints(userId);
  }

  async getAdminQueue(options: {
    status?: ComplaintStatus;
    category?: string;
    page: number;
    pageSize: number;
  }) {
    return complaintRepository.listAdminQueue(options);
  }

  async updateComplaint(
    adminId: string,
    complaintId: string,
    updates: {
      status: ComplaintStatus;
      adminResponse?: string | null;
    }
  ) {
    const existing = await complaintRepository.findById(complaintId);
    if (!existing) {
      throw AppError.notFound('Complaint not found');
    }

    // Spec Acceptance Rule: Resolving without a response is rejected (422)
    if (
      (updates.status === 'resolved' || updates.status === 'rejected') &&
      (!updates.adminResponse || updates.adminResponse.trim().length === 0)
    ) {
      throw AppError.unprocessable('An administrative response is strictly required when resolving or rejecting a complaint');
    }

    const updated = await complaintRepository.updateComplaint(complaintId, {
      status: updates.status,
      adminResponse: updates.adminResponse,
      resolvedBy: adminId,
    });

    await auditRepository.log('UPDATE_COMPLAINT_STATUS', 'complaint', complaintId, adminId);
    return updated;
  }
}

export const complaintService = new ComplaintService();
