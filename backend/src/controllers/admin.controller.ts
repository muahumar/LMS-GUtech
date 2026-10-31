import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

export class AdminController {
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createUser(req.user!.id, req.body);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.updateUser(req.user!.id, id, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
      const role = req.query.role as any;
      const search = req.query.search as string;

      const { users, total } = await adminService.listUsers({
        page,
        pageSize,
        role,
        search,
      });

      return sendSuccess(res, users, { page, pageSize, total });
    } catch (error) {
      next(error);
    }
  }

  async resetUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.triggerPasswordReset(req.user!.id, id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createCourse(req.user!.id, req.body);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.updateCourse(req.user!.id, id, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
      const search = req.query.search as string;
      const includeArchived = req.query.includeArchived === 'true';

      const { courses, total } = await adminService.listCourses({
        page,
        pageSize,
        search,
        includeArchived,
      });

      return sendSuccess(res, courses, { page, pageSize, total });
    } catch (error) {
      next(error);
    }
  }

  async getCourseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.getCourseDetail(id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async setCourseTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { teacherIds } = req.body;
      const result = await adminService.setCourseTeachers(req.user!.id, id, teacherIds);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async enrollStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.enrollStudents(req.user!.id, id, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async unenrollStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, studentId } = req.params;
      const result = await adminService.unenrollStudent(req.user!.id, id, studentId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
      const result = await auditRepository.list({ page, pageSize });
      return sendSuccess(res, result.logs, { page, pageSize, total: result.total });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
