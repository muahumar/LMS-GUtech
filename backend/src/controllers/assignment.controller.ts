import { Request, Response, NextFunction } from 'express';
import { assignmentService } from '../services/assignment.service.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

export class AssignmentController {
  async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const result = await assignmentService.createAssignment(
        req.user!.id,
        req.user!.role,
        id,
        req.body
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const result = await assignmentService.listAssignments(
        id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // assignmentId
      const result = await assignmentService.updateAssignment(
        id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await assignmentService.deleteAssignment(
        id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async submitAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // assignmentId
      const { textAnswer, filePath } = req.body;
      const result = await assignmentService.submitAssignment(id, req.user!.id, {
        textAnswer,
        filePath,
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // assignmentId
      const result = await assignmentService.listSubmissions(
        id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async gradeSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // submissionId
      const { marks, feedback } = req.body;
      const result = await assignmentService.gradeSubmission(
        id,
        req.user!.id,
        req.user!.role,
        marks,
        feedback
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const assignmentController = new AssignmentController();
