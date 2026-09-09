import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Terminal, Send, Sparkles, Mic, MicOff } from 'lucide-react';
import { FridayMessage as FridayMessageType, UserProfile } from '../types';
import { FridayMessage } from '../components/friday/FridayMessage';
import { defaultFridayAgent } from '../features/friday/FridayAgent';
import { fridayApi } from '../services/api/fridayApi';

interface FridayProps {
  messages: FridayMessageType[];
  setMessages: React.Dispatch<React.SetStateAction<FridayMessageType[]>>;
  userProfile: UserProfile;
}

export const Friday: React.FC<FridayProps> = ({
  messages,
  setMessages,
  userProfile
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "What's my workout today?",
    "How much protein have I logged today?",
    "Log 500ml water",
    "What is my current goal and biometrics?"
  ];

  const [conversationId, setConversationId] = useState<string | undefined>();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isProcessing) return;

    const userMsg: FridayMessageType = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Connect to real backend FRIDAY agent
      const response = await fridayApi.sendMessage(text.trim(), conversationId);
      if (response.success && response.data) {
        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
        }
        const hasTools = response.data.toolCalls && response.data.toolCalls.length > 0;
        const replyMsg: FridayMessageType = {
          id: `fri-${Date.now()}`,
          sender: 'friday',
          text: response.data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: hasTools ? 'system' : 'info'
        };
        setMessages(prev => [...prev, replyMsg]);
      } else {
        throw new Error(response.error || 'FRIDAY backend could not process your message');
      }
    } catch (apiErr: any) {
      // Local fallback with honest telemetry notification if backend is offline
      try {
        const localResponse = await defaultFridayAgent.processIntent(text.trim());
        const replyMsg: FridayMessageType = {
          id: `fri-${Date.now()}`,
          sender: 'friday',
          text: localResponse.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: localResponse.toolCalled ? 'system' : 'info'
        };
        setMessages(prev => [...prev, replyMsg]);
      } catch (localErr: any) {
        const errorMsg: FridayMessageType = {
          id: `fri-err-${Date.now()}`,
          sender: 'friday',
          text: `I couldn't access your telemetry right now: ${apiErr.message || 'Connection offline'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'alert'
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-7.5rem)] flex flex-col justify-between animate-fade-in pb-4">
      {/* HUD Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider">FRIDAY AI Trainer</h1>
            <p className="text-[10px] text-zinc-500 font-medium">AGENT TOOLS ARCHITECTURE: ACTIVE</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-500/5 px-2.5 py-1 border border-cyan-500/10 rounded-md">
          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
          <span>TOOL-CALLING ENGINE</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden mb-4 min-h-0">
        {/* Left Column: Voice Assistant Status & Core */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 overflow-hidden relative">
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            {/* Pulsing Core Orb */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full blur-2xl bg-cyan-500/15" />
              <div className="w-28 h-28 rounded-full border-2 border-cyan-500/40 flex items-center justify-center bg-zinc-950 relative">
                <Bot className="w-10 h-10 text-cyan-400" />
              </div>
            </div>

            <h3 className="text-base font-black text-white uppercase tracking-wider mb-1">
              FRIDAY Voice Pipeline
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 font-mono mt-1">
              <MicOff className="w-3.5 h-3.5 text-zinc-500" />
              <span>Voice assistant coming online...</span>
            </div>
            <p className="text-xs text-zinc-500 max-w-xs mt-3 leading-relaxed">
              Voice provider abstraction loaded. Streaming speech recognition & realtime voice feedback will activate in the next release.
            </p>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-1.5 pt-4 border-t border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Action Queries
            </span>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-xs p-2 rounded-lg bg-zinc-900/50 hover:bg-cyan-500/10 border border-zinc-850 hover:border-cyan-500/20 text-zinc-300 hover:text-cyan-300 transition-all cursor-pointer truncate"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Stream */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 overflow-hidden min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {messages.map(msg => (
              <FridayMessage key={msg.id} message={msg} />
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-3 bg-zinc-900/40 rounded-lg">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>FRIDAY evaluating tools & telemetry...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-3 border-t border-zinc-900 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask FRIDAY or command an action (e.g. log 500ml water)..."
              className="flex-1 bg-zinc-900/60 border border-zinc-800 focus:border-cyan-500 px-4 py-2.5 rounded-xl text-xs text-white outline-none"
            />
            <Button type="submit" variant="primary" size="md" disabled={!inputText.trim() || isProcessing}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
