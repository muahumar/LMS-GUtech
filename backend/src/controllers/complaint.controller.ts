import { Request, Response, NextFunction } from 'express';
import { complaintService } from '../services/complaint.service.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

export class ComplaintController {
  async createComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, subject, description, courseId } = req.body;
      const file = req.file;

      const complaint = await complaintService.createComplaint(
        req.user!.id,
        { category, subject, description, courseId },
        file
      );

      return sendCreated(res, complaint);
    } catch (error) {
      next(error);
    }
  }

  async getMyComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const complaints = await complaintService.getMyComplaints(req.user!.id);
      return sendSuccess(res, complaints);
    } catch (error) {
      next(error);
    }
  }

  async getAdminQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
      const status = req.query.status as any;
      const category = req.query.category as string;

      const { complaints, total } = await complaintService.getAdminQueue({
        page,
        pageSize,
        status,
        category,
      });

      return sendSuccess(res, complaints, { page, pageSize, total });
    } catch (error) {
      next(error);
    }
  }

  async updateComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      const result = await complaintService.updateComplaint(req.user!.id, id, {
        status,
        adminResponse,
      });

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const complaintController = new ComplaintController();
