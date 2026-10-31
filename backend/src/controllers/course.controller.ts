import { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/course.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class CourseController {
  async getMyCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const courses = await courseService.getMyCourses(req.user!.id, req.user!.role);
      return sendSuccess(res, courses);
    } catch (error) {
      next(error);
    }
  }

  async getCourseDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const details = await courseService.getCourseDetails(id, req.user!.id, req.user!.role);
      return sendSuccess(res, details);
    } catch (error) {
      next(error);
    }
  }
}

export const courseController = new CourseController();
