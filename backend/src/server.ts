import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({
    logger:
      process.env.LOAD_TEST === 'true'
        ? false
        : env.NODE_ENV === 'development',
    bodyLimit: 1048576, // 1MB body limit to prevent DoS attacks
  });

  // 1. Secure Headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Pure JSON API backend; avoids CSP header conflicts on JSON payloads
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
  });

  // Add Permissions-Policy & nosniff response headers
  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header(
      'Permissions-Policy',
      'camera=(self), microphone=(self), geolocation=()',
    );
  });

  // 2. CORS configuration:
  // strict in production & staging, developer friendly in dev/test
  const allowedOrigins =
    env.NODE_ENV === 'production' || env.NODE_ENV === 'staging'
      ? [env.FRONTEND_URL]
      : [
        env.FRONTEND_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
      ];

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 3. Rate Limiting
  // user-scoped when authenticated, IP-based fallback
  await app.register(rateLimit, {
    max:
      env.NODE_ENV === 'test' || process.env.LOAD_TEST === 'true'
        ? 100000
        : 120,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      const auth = req.headers.authorization;

      if (auth && auth.startsWith('Bearer ')) {
        return auth.substring(7, 40);
      }

      return req.ip;
    },
  });

  // 4. Global Error Handler
  app.setErrorHandler(errorHandler);

  // 5. Register All Routes
  await registerRoutes(app);

  return app;
}

export async function startServer() {
  const app = await buildApp();

  // Graceful shutdown handling
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(
        `\nReceived ${signal}. Shutting down FRIDAY backend gracefully...`,
      );

      try {
        await app.close();
        console.log('FRIDAY backend closed successfully.');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  }

  try {
    /*
     * Render provides PORT dynamically.
     *
     * The server must also listen on 0.0.0.0 so that Render's
     * network can reach the Fastify application.
     *
     * Local development still falls back to the values from env.ts.
     */
    const port = Number(process.env.PORT) || env.PORT;
    const host = process.env.HOST || '0.0.0.0';

    const address = await app.listen({
      port,
      host,
    });

    console.log(`🚀 FRIDAY Backend Server active at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Start automatically ONLY if directly invoked as main entrypoint
const isDirectEntry =
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js'));

if (
  isDirectEntry &&
  process.env.NODE_ENV !== 'test' &&
  !process.env.VITEST
) {
  startServer();
}