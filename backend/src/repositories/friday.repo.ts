import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface FridayConversationEntity {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface FridayMessageEntity {
  id: string;
  conversationId: string;
  userId: string;
  sender: 'user' | 'friday' | 'system';
  text: string;
  category?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface FridayMemoryEntity {
  id: string;
  userId: string;
  key: string;
  value: string;
  category: string;
  confidence: number;
}

const memoryConversations = new Map<string, FridayConversationEntity[]>();
const memoryMessages = new Map<string, FridayMessageEntity[]>();
const memoryLongTerm = new Map<string, FridayMemoryEntity[]>();

export class FridayRepository {
  static async getOrCreateConversation(userId: string, conversationId?: string, client?: SupabaseClient): Promise<FridayConversationEntity> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const userConvs = memoryConversations.get(userId) || [];
      if (conversationId) {
        const found = userConvs.find(c => c.id === conversationId);
        if (found) return found;
      }
      const newConv: FridayConversationEntity = {
        id: conversationId || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        title: 'Fitness Coaching Session',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      userConvs.unshift(newConv);
      memoryConversations.set(userId, userConvs);
      return newConv;
    }

    const sb = client || getSupabaseAdmin();
    if (conversationId) {
      const { data, error } = await sb
        .from('friday_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        return {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    }

    // Create new conversation
    const { data: created, error: createErr } = await sb
      .from('friday_conversations')
      .insert({
        user_id: userId,
        title: 'Fitness Coaching Session'
      })
      .select()
      .single();

    if (createErr || !created) throw createErr || new Error('Failed to create conversation');

    return {
      id: created.id,
      userId: created.user_id,
      title: created.title,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };
  }

  static async getRecentMessages(
    userId: string, 
    conversationId: string, 
    limit = 12, 
    client?: SupabaseClient
  ): Promise<FridayMessageEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const convMsgs = memoryMessages.get(conversationId) || [];
      return convMsgs.filter(m => m.userId === userId).slice(-limit);
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('friday_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      conversationId: d.conversation_id,
      userId: d.user_id,
      sender: d.sender,
      text: d.text,
      category: d.category,
      metadata: d.metadata,
      createdAt: d.created_at
    }));
  }

  static async saveMessage(
    userId: string,
    conversationId: string,
    sender: 'user' | 'friday' | 'system',
    text: string,
    metadata?: Record<string, any>,
    client?: SupabaseClient
  ): Promise<FridayMessageEntity> {
    const newMsg: FridayMessageEntity = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      userId,
      sender,
      text,
      metadata,
      createdAt: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const msgs = memoryMessages.get(conversationId) || [];
      msgs.push(newMsg);
      memoryMessages.set(conversationId, msgs);
      return newMsg;
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('friday_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        sender,
        text,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to save message');

    newMsg.id = data.id;
    return newMsg;
  }

  static async getLongTermMemories(userId: string, client?: SupabaseClient): Promise<FridayMemoryEntity[]> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return memoryLongTerm.get(userId) || [];
    }

    const sb = client || getSupabaseAdmin();
    const { data, error } = await sb
      .from('friday_memory')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      key: d.key,
      value: d.value,
      category: d.category,
      confidence: Number(d.confidence)
    }));
  }

  static async saveLongTermMemory(
    userId: string,
    key: string,
    value: string,
    category = 'preferences',
    client?: SupabaseClient
  ): Promise<void> {
    if (process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const list = memoryLongTerm.get(userId) || [];
      const idx = list.findIndex(m => m.key === key);
      if (idx >= 0) list[idx].value = value;
      else list.push({ id: `mem-${Date.now()}`, userId, key, value, category, confidence: 1.0 });
      memoryLongTerm.set(userId, list);
      return;
    }

    const sb = client || getSupabaseAdmin();
    await sb.from('friday_memory').upsert({
      user_id: userId,
      key,
      value,
      category,
      confidence: 1.0,
      updated_at: new Date().toISOString()
    });
  }
}
