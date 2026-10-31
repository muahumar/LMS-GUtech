import { resourceRepository } from '../repositories/resource.repository.js';
import { courseService } from './course.service.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/appError.js';
import crypto from 'crypto';

export class ResourceService {
  async uploadResource(
    courseId: string,
    uploadedBy: string,
    role: string,
    file: Express.Multer.File | undefined,
    title: string,
    description?: string
  ) {
    if (!file) {
      throw AppError.badRequest('File is required');
    }

    // Spec: Teacher cannot upload to a course they do not teach (403)
    await courseService.verifyCourseAccess(courseId, uploadedBy, role);

    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileUuid = crypto.randomUUID();
    const filePath = `resources/${courseId}/${fileUuid}-${safeName}`;

    const resource = await resourceRepository.createResource({
      courseId,
      uploadedBy,
      title,
      description,
      filePath,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    await auditRepository.log('UPLOAD_RESOURCE', 'resource', resource.id, uploadedBy);
    return resource;
  }

  async listResources(
    courseId: string,
    userId: string,
    role: string,
    options: { page: number; pageSize: number; search?: string }
  ) {
    // Spec: Student not enrolled gets 403 on list and download
    await courseService.verifyCourseAccess(courseId, userId, role);
    return resourceRepository.listByCourse({
      courseId,
      ...options,
    });
  }

  async getDownloadUrl(resourceId: string, userId: string, role: string) {
    const resource = await resourceRepository.findById(resourceId);
    if (!resource) {
      throw AppError.notFound('Resource not found');
    }

    // Check course access
    await courseService.verifyCourseAccess(resource.courseId, userId, role);

    const signedUrl = resourceRepository.generateSignedUrl(resource.filePath);
    return {
      downloadUrl: signedUrl,
      fileName: resource.fileName,
      mimeType: resource.mimeType,
      expiresInSeconds: 60,
    };
  }

  async deleteResource(resourceId: string, userId: string, role: string) {
    const resource = await resourceRepository.findById(resourceId);
    if (!resource) {
      throw AppError.notFound('Resource not found');
    }

    // Spec: Only uploader or admin can delete
    if (role !== 'admin' && resource.uploadedBy !== userId) {
      throw AppError.forbidden('Only the uploader or an administrator can delete this resource');
    }

    await resourceRepository.deleteResource(resourceId);
    await auditRepository.log('DELETE_RESOURCE', 'resource', resourceId, userId);
    return { message: 'Resource deleted successfully' };
  }
}

export const resourceService = new ResourceService();
