import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    trustProxy: true
  });

  // 1. Secure Headers
  await app.register(helmet, {
    contentSecurityPolicy: false // Allows API to serve JSON without CSP conflicts
  });

  // 2. CORS configuration
  await app.register(cors, {
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // 3. Rate Limiting
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  });

  // 4. Global Error Handler
  app.setErrorHandler(errorHandler);

  // 5. Register All Routes
  await registerRoutes(app);

  return app;
}

export async function startServer() {
  const app = await buildApp();
  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 FRIDAY Backend Server active at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Start automatically if directly invoked
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
