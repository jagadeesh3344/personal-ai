import { FastifyRequest, FastifyReply } from 'fastify';
import { getSupabaseAdmin, createUserClient } from '../config/supabase.js';
import { env } from '../config/env.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: 'Missing or malformed Authorization header. Bearer token required.'
    });
  }

  const token = authHeader.substring(7).trim();

  // Test mode & Dev mode token support (strictly blocked in staging & production)
  if ((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && (token.startsWith('test-token-') || token.startsWith('dev-token-') || token === 'dev-token')) {
    const userId = token.startsWith('test-token-')
      ? token.replace('test-token-', '')
      : (token.startsWith('dev-token-') ? token.replace('dev-token-', '') : 'dev-user-1');
    request.user = { id: userId, email: `${userId}@friday.local` };
    request.userClient = createUserClient(token);
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized: Invalid, revoked, or expired token.'
      });
    }

    request.user = {
      id: user.id,
      email: user.email
    };
    request.userClient = createUserClient(token);
  } catch (err: any) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication failed: ' + (err.message || 'Token verification error')
    });
  }
}
