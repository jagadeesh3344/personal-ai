import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Send, Sparkles, Mic, MicOff, Volume2, Square, AlertCircle, RefreshCw } from 'lucide-react';
import { FridayMessage as FridayMessageType, UserProfile } from '../types';
import { FridayMessage } from '../components/friday/FridayMessage';
import { fridayApi } from '../services/api/fridayApi';
import { WebSpeechVoiceProvider } from '../services/voice/WebSpeechVoiceProvider';
import { VoiceConnectionState } from '../services/voice/VoiceProvider';

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

  const [conversationId, setConversationId] = useState<string | undefined>();
  const [voiceState, setVoiceState] = useState<VoiceConnectionState>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceProviderRef = useRef<WebSpeechVoiceProvider | null>(null);

  const quickPrompts = [
    "What's my workout today?",
    "Start my workout.",
    "I completed 10 reps.",
    "I drank 500 ml of water.",
    "How much water have I had today?",
    "What are my calories today?",
    "How am I progressing?",
    "Finish my workout."
  ];

  // Initialize Voice Provider
  useEffect(() => {
    const provider = new WebSpeechVoiceProvider(conversationId);
    voiceProviderRef.current = provider;

    provider.setCallbacks({
      onStateChange: (st) => {
        setVoiceState(st);
        if (st === 'listening') {
          setVoiceError(null);
        }
      },
      onTranscript: (txt, isFinal) => {
        setLiveTranscript(txt);
        if (isFinal) {
          const userMsg: FridayMessageType = {
            id: `usr-v-${Date.now()}`,
            sender: 'user',
            text: txt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, userMsg]);
          setLiveTranscript('');
        }
      },
      onResponse: (reply, spokenText, toolCalls, newConvId) => {
        if (newConvId) {
          setConversationId(newConvId);
          provider.setConversationId(newConvId);
        }
        const hasTools = toolCalls && toolCalls.length > 0;
        const replyMsg: FridayMessageType = {
          id: `fri-v-${Date.now()}`,
          sender: 'friday',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: hasTools ? 'system' : 'info'
        };
        setMessages(prev => [...prev, replyMsg]);
      },
      onError: (err) => {
        setVoiceError(err);
      }
    });

    return () => {
      provider.stop();
    };
  }, []);

  // Synchronize conversationId with voice provider
  useEffect(() => {
    if (voiceProviderRef.current) {
      voiceProviderRef.current.setConversationId(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing, voiceState]);

  const handleToggleVoice = async () => {
    if (!voiceProviderRef.current) return;

    if (voiceState === 'idle' || voiceState === 'error') {
      setVoiceError(null);
      await voiceProviderRef.current.start();
    } else {
      voiceProviderRef.current.stop();
    }
  };

  const handleInterruptVoice = () => {
    if (voiceProviderRef.current) {
      voiceProviderRef.current.interrupt();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isProcessing) return;

    // If voice was speaking, interrupt it when user sends message
    if (voiceState === 'speaking' && voiceProviderRef.current) {
      voiceProviderRef.current.interrupt();
    }

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
      // Connect directly to real backend FRIDAY agent
      const response = await fridayApi.sendMessage(text.trim(), conversationId);
      if (response.success && response.data) {
        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
          if (voiceProviderRef.current) {
            voiceProviderRef.current.setConversationId(response.data.conversationId);
          }
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
        throw new Error(response.error || 'FRIDAY is temporarily unavailable. Please try again.');
      }
    } catch (apiErr: any) {
      const errorMsg: FridayMessageType = {
        id: `fri-err-${Date.now()}`,
        sender: 'friday',
        text: 'FRIDAY is temporarily unavailable. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'alert'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const isVoiceActive = voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'processing' || voiceState === 'connecting';

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
            <p className="text-[10px] text-zinc-500 font-medium">PERSONAL FITNESS COACH</p>
          </div>
        </div>

        {/* Voice Connection Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 text-[10px] font-mono px-3 py-1 rounded-md border transition-all ${
            voiceState === 'listening' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' :
            voiceState === 'speaking' ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400' :
            voiceState === 'processing' ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400' :
            voiceState === 'error' ? 'bg-red-950/40 border-red-500/30 text-red-400' :
            'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              voiceState === 'listening' ? 'bg-emerald-400 animate-ping' :
              voiceState === 'speaking' ? 'bg-indigo-400 animate-pulse' :
              voiceState === 'processing' ? 'bg-cyan-400 animate-spin' :
              voiceState === 'error' ? 'bg-red-400' : 'bg-zinc-600'
            }`} />
            <span className="uppercase font-bold">
              {voiceState === 'listening' ? 'Listening' :
               voiceState === 'speaking' ? 'FRIDAY Speaking' :
               voiceState === 'processing' ? 'Thinking' :
               voiceState === 'connecting' ? 'Connecting' :
               voiceState === 'error' ? 'Voice Error' : 'Voice Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden mb-4 min-h-0">
        {/* Left Column: Voice Assistant Controls & Core */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 overflow-hidden relative">
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
            {/* Interactive Animated Core Orb */}
            <div 
              onClick={handleToggleVoice}
              className="relative w-36 h-36 flex items-center justify-center mb-5 cursor-pointer group"
              title={isVoiceActive ? "Click to stop listening" : "Click to activate voice"}
            >
              <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                voiceState === 'listening' ? 'bg-emerald-500/25 scale-110 animate-pulse' :
                voiceState === 'speaking' ? 'bg-indigo-500/25 scale-110 animate-pulse' :
                voiceState === 'processing' ? 'bg-cyan-500/25 animate-spin' :
                'bg-cyan-500/10 group-hover:bg-cyan-500/20'
              }`} />
              
              <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center bg-zinc-950 relative transition-all duration-300 shadow-xl ${
                voiceState === 'listening' ? 'border-emerald-500/60 shadow-emerald-500/20' :
                voiceState === 'speaking' ? 'border-indigo-500/60 shadow-indigo-500/20' :
                voiceState === 'processing' ? 'border-cyan-500/60 shadow-cyan-500/20' :
                'border-cyan-500/30 group-hover:border-cyan-400/60'
              }`}>
                {voiceState === 'listening' ? (
                  <Mic className="w-10 h-10 text-emerald-400 animate-bounce" />
                ) : voiceState === 'speaking' ? (
                  <Volume2 className="w-10 h-10 text-indigo-400 animate-pulse" />
                ) : voiceState === 'processing' ? (
                  <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                ) : (
                  <Mic className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                )}
              </div>
            </div>

            <h3 className="text-base font-black text-white uppercase tracking-wider mb-1">
              FRIDAY Voice
            </h3>

            {/* Voice Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium mt-1">
              {voiceState === 'listening' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Listening for your voice...</span>
                </>
              ) : voiceState === 'speaking' ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>FRIDAY is speaking</span>
                </>
              ) : voiceState === 'processing' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span>Processing coaching request...</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Microphone paused</span>
                </>
              )}
            </div>

            {/* Error Notification if any */}
            {voiceError && (
              <div className="flex items-center gap-2 p-2.5 mt-3 bg-red-950/50 border border-red-900/50 rounded-lg text-left text-xs text-red-300 max-w-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}

            {/* Live Interim Speech Transcript */}
            {liveTranscript && (
              <div className="my-3 px-3 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 font-mono italic max-w-xs animate-fade-in">
                "{liveTranscript}"
              </div>
            )}

            {/* Voice Control Buttons */}
            <div className="flex items-center gap-2.5 mt-4">
              <Button
                variant={isVoiceActive ? "secondary" : "primary"}
                size="sm"
                onClick={handleToggleVoice}
                className="cursor-pointer"
              >
                {isVoiceActive ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 mr-1" /> Stop Voice
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 mr-1" /> Start Voice
                  </>
                )}
              </Button>

              {voiceState === 'speaking' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleInterruptVoice}
                  className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 cursor-pointer"
                  title="Interrupt FRIDAY immediately"
                >
                  <Square className="w-3 h-3 mr-1 fill-current" /> Interrupt
                </Button>
              )}
            </div>
          </div>

          {/* Quick Voice Prompts */}
          <div className="space-y-1.5 pt-4 border-t border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Voice Action Commands
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-[11px] p-2 rounded-lg bg-zinc-900/50 hover:bg-cyan-500/10 border border-zinc-850 hover:border-cyan-500/20 text-zinc-300 hover:text-cyan-300 transition-all cursor-pointer truncate"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Unified Chat Stream */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 overflow-hidden min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {messages.map(msg => (
              <FridayMessage key={msg.id} message={msg} />
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-3 bg-zinc-900/40 rounded-lg">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>FRIDAY is thinking...</span>
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
              placeholder="Speak or type a command (e.g. 'What is my workout today?')..."
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

