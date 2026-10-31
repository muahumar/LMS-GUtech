import { Request, Response, NextFunction } from 'express';
import { quizService } from '../services/quiz.service.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

export class QuizController {
  async createQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const result = await quizService.createQuiz(
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

  async updateQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // quizId
      const result = await quizService.updateQuiz(
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

  async listQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const result = await quizService.listQuizzes(
        id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getQuizDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quizService.getQuizDetails(id, req.user!.id, req.user!.role);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async startAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // quizId
      const result = await quizService.startAttempt(id, req.user!.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // quizId
      const { answers } = req.body;
      const result = await quizService.submitAttempt(id, req.user!.id, answers);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // quizId
      const result = await quizService.listResults(
        id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const quizController = new QuizController();
