import morgan from 'morgan';
import { morganStream } from '@/config/logger';
import { isDevelopment } from '@/config/env';

// Morgan format
const morganFormat = isDevelopment
  ? 'dev'
  : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

export const requestLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (req, _res) => {
    // Skip logging for health check endpoints
    return req.url === '/health' || req.url === '/api/health';
  },
});
