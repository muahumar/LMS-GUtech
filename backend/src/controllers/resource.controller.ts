import { Request, Response, NextFunction } from 'express';
import { resourceService } from '../services/resource.service.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

export class ResourceController {
  async uploadResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const { title, description } = req.body;
      const file = req.file;

      const resource = await resourceService.uploadResource(
        id,
        req.user!.id,
        req.user!.role,
        file,
        title,
        description
      );

      return sendCreated(res, resource);
    } catch (error) {
      next(error);
    }
  }

  async listResources(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // courseId
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
      const search = req.query.search as string;

      const { resources, total } = await resourceService.listResources(
        id,
        req.user!.id,
        req.user!.role,
        { page, pageSize, search }
      );

      return sendSuccess(res, resources, { page, pageSize, total });
    } catch (error) {
      next(error);
    }
  }

  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // resourceId
      const result = await resourceService.getDownloadUrl(id, req.user!.id, req.user!.role);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resourceService.deleteResource(id, req.user!.id, req.user!.role);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const resourceController = new ResourceController();
