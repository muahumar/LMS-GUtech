import { Request, Response, NextFunction } from 'express';
import { marksService } from '../services/marks.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class MarksController {
  async getMyMarks(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.query.courseId as string;
      const marks = await marksService.getStudentMarks(
        req.user!.id,
        req.user!.id,
        req.user!.role,
        courseId
      );
      return sendSuccess(res, marks);
    } catch (error) {
      next(error);
    }
  }

  async getCourseGradebook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const matrix = await marksService.getGradebook(id, req.user!.id, req.user!.role);
      return sendSuccess(res, matrix);
    } catch (error) {
      next(error);
    }
  }

  async getCourseGradebookCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const csv = await marksService.getGradebookCsv(id, req.user!.id, req.user!.role);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="gradebook-${id}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const marksController = new MarksController();
