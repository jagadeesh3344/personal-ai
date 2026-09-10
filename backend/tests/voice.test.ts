import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server.js';

describe('FRIDAY Voice Pipeline & Agent Integration Tests', () => {
  let app: FastifyInstance;
  const userAToken = 'test-token-voice-user-a';
  const userBToken = 'test-token-voice-user-b';
  let convId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Voice session endpoint rejects unauthenticated requests with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/session'
    });
    expect(res.statusCode).toBe(401);
  });

  it('Voice message endpoint rejects unauthenticated requests with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      payload: { transcript: 'Hey FRIDAY' }
    });
    expect(res.statusCode).toBe(401);
  });

  it('Authenticated user can initialize a voice session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/session',
      headers: { authorization: `Bearer ${userAToken}` }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toContain('voice-user-a');
    expect(body.data.userId).toBe('voice-user-a');
  });

  it('Voice: "Hey FRIDAY" produces friendly coach reply and clean spokenText', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: { transcript: 'Hey FRIDAY' }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.reply).toBeDefined();
    expect(body.data.spokenText).toBeDefined();
    expect(body.data.spokenText).not.toContain('*');
    convId = body.data.conversationId;
  });

  it('Voice: "What is my workout today?" invokes getTodayWorkout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'What is my workout today?'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const workoutTool = body.data.toolCalls?.find((t: any) => t.name === 'getTodayWorkout');
    expect(workoutTool).toBeDefined();
  });

  it('Voice: "Start my workout." invokes startWorkout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'Start my workout.'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const startTool = body.data.toolCalls?.find((t: any) => t.name === 'startWorkout');
    expect(startTool).toBeDefined();
  });

  it('Voice: "What\'s my next exercise?" invokes getTodayWorkout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: "What's my next exercise?"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const tool = body.data.toolCalls?.find((t: any) => t.name === 'getTodayWorkout');
    expect(tool).toBeDefined();
  });

  it('Voice: "I completed 10 reps." invokes logWorkoutSet', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'I completed 10 reps.'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const logSetTool = body.data.toolCalls?.find((t: any) => t.name === 'logWorkoutSet');
    expect(logSetTool).toBeDefined();
    expect(logSetTool.arguments.reps).toBe(10);
  });

  it('Voice: "I drank 500 ml of water." invokes logHydration', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'I drank 500 ml of water.'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const hydrTool = body.data.toolCalls?.find((t: any) => t.name === 'logHydration');
    expect(hydrTool).toBeDefined();
    expect(hydrTool.arguments.amountMl).toBe(500);
  });

  it('Voice: "How much water have I had today?" invokes getHydrationSummary', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'How much water have I had today?'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const summaryTool = body.data.toolCalls?.find((t: any) => t.name === 'getHydrationSummary');
    expect(summaryTool).toBeDefined();
  });

  it('Voice: "What are my calories today?" invokes getNutritionSummary', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'What are my calories today?'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const nutTool = body.data.toolCalls?.find((t: any) => t.name === 'getNutritionSummary');
    expect(nutTool).toBeDefined();
  });

  it('Voice: "How am I progressing?" invokes getProgressSummary', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'How am I progressing?'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const progressTool = body.data.toolCalls?.find((t: any) => t.name === 'getProgressSummary');
    expect(progressTool).toBeDefined();
  });

  it('Voice: "Finish my workout." invokes completeWorkout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/friday/voice/message',
      headers: { authorization: `Bearer ${userAToken}` },
      payload: {
        conversationId: convId,
        transcript: 'Finish my workout.'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    const completeTool = body.data.toolCalls?.find((t: any) => t.name === 'completeWorkout');
    expect(completeTool).toBeDefined();
  });

  it('User isolation: User B cannot access User A voice conversation history', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/friday/history/${convId}`,
      headers: { authorization: `Bearer ${userBToken}` }
    });

    const body = JSON.parse(res.body);
    expect(body.messages?.length || 0).toBe(0);
  });
});
