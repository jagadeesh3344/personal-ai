import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.flatten().fieldErrors
    });
  }

  const statusCode = (error as FastifyError).statusCode || 500;
  const isProduction = env.NODE_ENV === 'production';
  const message = isProduction && statusCode >= 500
    ? 'Internal server error'
    : (error.message || 'Internal server error');

  return reply.status(statusCode).send({
    success: false,
    error: message
  });
}
