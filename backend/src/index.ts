import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const port = config.port;

app.listen(port, () => {
  logger.info(`GUtech Internal LMS Backend running on http://localhost:${port}`);
  logger.info(`CORS allowed origin: ${config.clientOrigin}`);
  logger.info(`Supabase integrated: ${config.isSupabaseConfigured() ? 'Connected' : 'Using Local Resilient Data Store (ready for keys)'}`);
});
