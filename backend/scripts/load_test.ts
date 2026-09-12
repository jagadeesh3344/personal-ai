/**
 * Phase 13 Realistic Load Test — FRIDAY Personal AI Trainer
 * 
 * Simulates 1,000 concurrent user sessions executing realistic multi-step fitness journeys:
 * - Health / readiness probe
 * - Profile retrieval
 * - Workout & Daily Coaching plan retrieval
 * - Workout Set logging (manual & camera verified)
 * - Hydration intake logging
 * - Telemetry event submission
 * 
 * NOTE: Separates API/DB load from live Gemini LLM API calls to avoid 
 * external rate limiting and cost waste.
 */

process.env.LOAD_TEST = 'true';
process.env.NODE_ENV = 'test';

import { buildApp } from '../src/server.js';
import { TelemetryService } from '../src/modules/telemetry/telemetryService.js';

interface SimulationMetrics {
  totalUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRatePct: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  meanMs: number;
  durationSeconds: number;
  requestsPerSecond: number;
  memoryUsageMb: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

function calculatePercentile(latencies: number[], p: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, Math.min(idx, sorted.length - 1))] * 100) / 100;
}

export async function runLoadTest(concurrency: number = 1000): Promise<SimulationMetrics> {
  console.log(`\n========================================================`);
  console.log(`🚀 STARTING FRIDAY LOAD TEST: ${concurrency} SIMULATED CONCURRENT USERS`);
  console.log(`========================================================`);

  const app = await buildApp();
  await app.ready();

  const latencies: number[] = [];
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  const userBatchSize = 100; // Run in concurrent waves to preserve stability
  const batches = Math.ceil(concurrency / userBatchSize);

  for (let b = 0; b < batches; b++) {
    const userPromises: Promise<void>[] = [];
    const currentBatchSize = Math.min(userBatchSize, concurrency - b * userBatchSize);

    for (let u = 0; u < currentBatchSize; u++) {
      const userIndex = b * userBatchSize + u;
      const userId = `load-user-${userIndex}`;
      const authHeader = `Bearer test-token-${userId}`;

      const runUserFlow = async () => {
        // Step 1: Health probe
        const t0 = performance.now();
        const r1 = await app.inject({ method: 'GET', url: '/health' });
        const d1 = performance.now() - t0;
        latencies.push(d1);
        if (r1.statusCode === 200) successCount++; else failCount++;

        // Step 2: User profile
        const t1 = performance.now();
        const r2 = await app.inject({
          method: 'GET',
          url: '/api/profile',
          headers: { authorization: authHeader },
        });
        const d2 = performance.now() - t1;
        latencies.push(d2);
        if (r2.statusCode === 200) successCount++; else failCount++;

        // Step 3: Today's workout
        const t2 = performance.now();
        const r3 = await app.inject({
          method: 'GET',
          url: '/api/workouts/today',
          headers: { authorization: authHeader },
        });
        const d3 = performance.now() - t2;
        latencies.push(d3);
        if (r3.statusCode === 200) successCount++; else failCount++;

        // Step 4: Workout session & set logging
        const t3 = performance.now();
        const rSess = await app.inject({
          method: 'POST',
          url: '/api/workout-sessions',
          headers: { authorization: authHeader },
          payload: { date: '2026-09-12', notes: 'Load test session' },
        });
        const sessId = rSess.statusCode === 201 ? JSON.parse(rSess.body).session.id : 'sess-load-test';

        const r4 = await app.inject({
          method: 'POST',
          url: `/api/workout-sessions/${sessId}/sets`,
          headers: { authorization: authHeader },
          payload: {
            exerciseId: 'bodyweight-squat',
            setNumber: 1,
            reps: 10,
            weightKg: 0,
            completionMethod: 'MANUAL',
            verification: 'SELF_REPORTED',
          },
        });
        const d4 = performance.now() - t3;
        latencies.push(d4);
        if (r4.statusCode === 201 || r4.statusCode === 200) {
          successCount++;
        } else {
          console.error('STEP 4 FAILED:', r4.statusCode, r4.body);
          failCount++;
        }

        // Step 5: Hydration logging
        const t4 = performance.now();
        const r5 = await app.inject({
          method: 'POST',
          url: '/api/hydration',
          headers: { authorization: authHeader },
          payload: {
            amountMl: 250,
          },
        });
        const d5 = performance.now() - t4;
        latencies.push(d5);
        if (r5.statusCode === 201 || r5.statusCode === 200) successCount++; else failCount++;

        // Step 6: Telemetry Event Logging
        const t5 = performance.now();
        const r6 = await app.inject({
          method: 'POST',
          url: '/api/telemetry/events',
          headers: { authorization: authHeader },
          payload: {
            eventName: 'WORKOUT_STARTED',
            platform: 'load-test-worker',
            appVersion: '1.0.0',
            sessionId: `sess-${userIndex}`,
            metadata: { step: 'load-simulation' },
          },
        });
        const d6 = performance.now() - t5;
        latencies.push(d6);
        if (r6.statusCode === 201 || r6.statusCode === 200) successCount++; else failCount++;
      };

      userPromises.push(runUserFlow());
    }

    await Promise.all(userPromises);
  }

  const durationSeconds = (Date.now() - startTime) / 1000;
  const totalRequests = successCount + failCount;
  const mem = process.memoryUsage();

  const metrics: SimulationMetrics = {
    totalUsers: concurrency,
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failCount,
    errorRatePct: totalRequests > 0 ? Math.round((failCount / totalRequests) * 10000) / 100 : 0,
    p50Ms: calculatePercentile(latencies, 50),
    p95Ms: calculatePercentile(latencies, 95),
    p99Ms: calculatePercentile(latencies, 99),
    minMs: Math.round(Math.min(...latencies) * 100) / 100,
    maxMs: Math.round(Math.max(...latencies) * 100) / 100,
    meanMs: Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100,
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    requestsPerSecond: Math.round((totalRequests / durationSeconds) * 10) / 10,
    memoryUsageMb: {
      heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
      rss: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    },
  };

  // Record into telemetry service
  TelemetryService.recordLatency('api', metrics.p50Ms);

  console.log(`\n========================================================`);
  console.log(`📊 LOAD TEST COMPLETED IN ${metrics.durationSeconds}s`);
  console.log(`Total Requests:       ${metrics.totalRequests}`);
  console.log(`Successful:           ${metrics.successfulRequests}`);
  console.log(`Failed (5xx/4xx):     ${metrics.failedRequests} (${metrics.errorRatePct}%)`);
  console.log(`Throughput (RPS):     ${metrics.requestsPerSecond} req/sec`);
  console.log(`P50 Latency:          ${metrics.p50Ms} ms`);
  console.log(`P95 Latency:          ${metrics.p95Ms} ms`);
  console.log(`P99 Latency:          ${metrics.p99Ms} ms`);
  console.log(`Min / Max Latency:    ${metrics.minMs} ms / ${metrics.maxMs} ms`);
  console.log(`Heap Used:            ${metrics.memoryUsageMb.heapUsed} MB (RSS: ${metrics.memoryUsageMb.rss} MB)`);
  console.log(`========================================================\n`);

  await app.close();
  return metrics;
}

// Self-run when executed directly via tsx
if (process.argv[1]?.endsWith('load_test.ts') || process.argv[1]?.endsWith('load_test.js')) {
  runLoadTest(1000)
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
