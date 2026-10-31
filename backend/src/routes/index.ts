import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { adminRoutes } from './admin.routes.js';
import { courseRoutes } from './course.routes.js';
import { resourceRoutes } from './resource.routes.js';
import { assignmentRoutes } from './assignment.routes.js';
import { quizRoutes } from './quiz.routes.js';
import { announcementRoutes } from './announcement.routes.js';
import { chatRoutes } from './chat.routes.js';
import { complaintRoutes } from './complaint.routes.js';
import { marksRoutes } from './marks.routes.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock signed download endpoint
apiRouter.get('/storage/signed-download', (req, res) => {
  const filePath = req.query.path as string;
  res.status(200).json({
    data: {
      message: 'Signed download authorized',
      filePath,
      validUntil: new Date(Date.now() + 60000).toISOString(),
    },
  });
});

// Mounted routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/', courseRoutes);
apiRouter.use('/', resourceRoutes);
apiRouter.use('/', assignmentRoutes);
apiRouter.use('/', quizRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/', chatRoutes);
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/', marksRoutes);
