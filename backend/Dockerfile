# Multi-stage production & staging Dockerfile for FRIDAY Fastify Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source and TypeScript configuration
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to dist
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Use non-root user for security
USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]
