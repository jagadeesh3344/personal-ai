import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Bot, 
  Mic, 
  Terminal, 
  Volume2, 
  Square, 
  Sparkles, 
  AudioLines, 
  RefreshCw, 
  Send, 
  ChevronRight,
  User,
  History,
  Info
} from 'lucide-react';
import { FridayMessage as FridayMessageType, UserProfile, Workout, Nutrition } from '../types';

interface FridayProps {
  messages: FridayMessageType[];
  setMessages: React.Dispatch<React.SetStateAction<FridayMessageType[]>>;
  workouts: Workout[];
  userProfile: UserProfile;
  nutrition: Nutrition;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const Friday: React.FC<FridayProps> = ({
  messages,
  setMessages,
  workouts,
  userProfile,
  nutrition
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [fridayResponse, setFridayResponse] = useState('');
  const [displayedResponseText, setDisplayedResponseText] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textRevealIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic voice waves height simulator
  const [waveHeights, setWaveHeights] = useState<number[]>([12, 24, 18, 30, 15, 20, 25, 12, 18, 30, 22, 15, 28, 14, 10]);

  // Simulated Voice Commands options using 100% REAL state values
  const simulationQueries = [
    {
      label: "Ask Workout today",
      query: "What's my workout today?",
      getResponse: () => {
        const w = workouts[0];
        if (w) {
          const names = w.exercises.map(e => e.name).join(', ');
          return `${w.name} is scheduled for today. Since you are training at ${userProfile.trainingEnvironment.toUpperCase()}, I've made sure this matches your equipment setup. We have: ${names}. Ready to get started?`;
        }
        return "No active workout is scheduled. You can configure your profile and goals in Settings.";
      }
    },
    {
      label: "Query body status",
      query: "What is my body status?",
      getResponse: () => {
        const target = userProfile.preferences?.targetWeight || userProfile.targetWeight || 68;
        const diff = Math.abs(userProfile.weight - target).toFixed(1);
        return `We have your current weight at ${userProfile.weight} kg, with a target weight of ${target} kg. This leaves ${diff} kg to go. Let's keep working consistently to reach your goal.`
      }
    },
    {
      label: "Query protein levels",
      query: "How much protein have I eaten today?",
      getResponse: () => {
        const current = nutrition?.protein?.current || 0;
        const target = nutrition?.protein?.target || 140;
        return `You have logged ${current}g of protein out of your ${target}g target today. Great job keeping up with your nutrition!`
      }
    },
    {
      label: "Query active goal",
      query: "What is my current goal?",
      getResponse: () => `Your current fitness goal is set to ${userProfile.goal || userProfile.fitnessGoal || 'optimal performance'}. I will continue to optimize your custom workout and macro recommendations to align with this.`
    },
    {
      label: "Initialize Rest Timer",
      query: "Start rest timer for 90 seconds.",
      getResponse: () => `Starting your 90-second rest timer. Breathe deeply and prepare for your next set. I'll let you know when the time is up.`
    }
  ];

  // Auto-oscillate soundwave bars when listening or speaking
  useEffect(() => {
    if (voiceState === 'listening' || voiceState === 'speaking') {
      audioIntervalRef.current = setInterval(() => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 32) + 8));
      }, 100);
    } else {
      setWaveHeights([12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [voiceState]);

  // Typewriter effect for FRIDAY speaking response
  useEffect(() => {
    if (voiceState === 'speaking' && fridayResponse) {
      let index = 0;
      setDisplayedResponseText('');
      
      textRevealIntervalRef.current = setInterval(() => {
        if (index < fridayResponse.length) {
          setDisplayedResponseText(prev => prev + fridayResponse.charAt(index));
          index++;
        } else {
          // Finished speaking, go back to idle
          setTimeout(() => {
            handleFinishedSpeaking(fridayResponse);
          }, 1500);
          if (textRevealIntervalRef.current) clearInterval(textRevealIntervalRef.current);
        }
      }, 35); // 35ms per character typing
    } else {
      if (textRevealIntervalRef.current) clearInterval(textRevealIntervalRef.current);
    }
    return () => {
      if (textRevealIntervalRef.current) clearInterval(textRevealIntervalRef.current);
    };
  }, [voiceState, fridayResponse]);

  // Keep log scroll anchored to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, voiceState, liveTranscript, displayedResponseText]);

  // User taps the central core orb
  const handleCoreClick = () => {
    if (voiceState === 'idle') {
      startListeningSequence("Say something, Operator... (or tap a scenario query below)");
    } else if (voiceState === 'speaking' || voiceState === 'listening') {
      handleInterrupt();
    }
  };

  // Trigger a full simulation speech sequence
  const startListeningSequence = (userText: string, exactResponse?: string) => {
    setVoiceState('listening');
    setLiveTranscript('');
    setFridayResponse('');
    setDisplayedResponseText('');

    // Simulate word by word user transcript appearing
    let words = userText.split(' ');
    let currentWordIdx = 0;
    let accumulatedText = '';
    
    const transInterval = setInterval(() => {
      if (currentWordIdx < words.length) {
        accumulatedText += (currentWordIdx === 0 ? '' : ' ') + words[currentWordIdx];
        setLiveTranscript(accumulatedText);
        currentWordIdx++;
      } else {
        clearInterval(transInterval);
        
        // Complete speech capture -> transition to thinking
        setTimeout(() => {
          setVoiceState('thinking');
          
          // Think for 1.5 seconds -> transition to speaking
          setTimeout(() => {
            setVoiceState('speaking');
            const targetResponse = exactResponse || "I understand. I've updated your training details and saved the changes.";
            setFridayResponse(targetResponse);
          }, 1500);

        }, 800);
      }
    }, 220); // Simulate verbal speech word cadence
  };

  const handleFinishedSpeaking = (finalResponse: string) => {
    // Save to conversation history list
    const userMsg: FridayMessageType = {
      id: `voice-usr-${Date.now()}`,
      sender: 'user',
      text: liveTranscript || "Simulated Vocal Query",
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    const fridayMsg: FridayMessageType = {
      id: `voice-fri-${Date.now() + 1}`,
      sender: 'friday',
      text: finalResponse,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      category: 'info'
    };

    setMessages(prev => [...prev, userMsg, fridayMsg]);
    setVoiceState('idle');
    setLiveTranscript('');
    setDisplayedResponseText('');
  };

  const handleInterrupt = () => {
    if (textRevealIntervalRef.current) clearInterval(textRevealIntervalRef.current);
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    setVoiceState('idle');
    setLiveTranscript('');
    setDisplayedResponseText('');
  };

  // Support typing a message as secondary input
  const handleSendText = () => {
    if (!inputText.trim()) return;
    const queryText = inputText;
    setInputText('');
    
    // Find matching query response or fallback
    const matched = simulationQueries.find(q => 
      queryText.toLowerCase().includes(q.query.toLowerCase()) || 
      q.query.toLowerCase().includes(queryText.toLowerCase())
    );
    
    const targetResponse = matched ? matched.getResponse() : "I understand. I'll customize your training guidelines and nutrition targets based on your goals.";
    
    startListeningSequence(queryText, targetResponse);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendText();
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-7.5rem)] flex flex-col justify-between animate-fade-in pb-4">
      {/* HUD Operational Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg shadow-inner">
            <Bot className={`w-5 h-5 ${voiceState !== 'idle' ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider">FRIDAY AI Assistant</h1>
            <p className="text-[10px] text-zinc-500 font-medium">AUDIO MODE: ACTIVE (Say "Hey FRIDAY" to talk)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-500/5 px-2.5 py-1 border border-cyan-500/10 rounded-md">
          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
          <span className="uppercase">{voiceState} MODE</span>
        </div>
      </div>

      {/* Main Visual Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden mb-4 min-h-0">
        
        {/* Left Column: Prominent Voice-First Area (Orb, Live waveform, status feedback) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 overflow-y-auto relative min-h-0">
          
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            
            {/* Pulsating/glowing interactive AI visual orb */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-5 select-none">
              
              {/* Orb Glow Shadow Backing */}
              <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${
                voiceState === 'listening' ? 'bg-cyan-500/25 scale-110' :
                voiceState === 'thinking' ? 'bg-indigo-500/30 scale-125' :
                voiceState === 'speaking' ? 'bg-emerald-500/25 scale-115' : 'bg-cyan-500/5 scale-90'
              }`} />

              {/* Holographic dashed rotating track */}
              <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-1000 ${
                voiceState === 'listening' ? 'border-cyan-500/30 animate-spin [animation-duration:10s]' :
                voiceState === 'thinking' ? 'border-indigo-500/50 animate-spin [animation-duration:3s]' :
                voiceState === 'speaking' ? 'border-emerald-500/30 animate-spin [animation-duration:12s]' :
                'border-zinc-800'
              }`} />

              {/* Ambient Expanding ripple wave */}
              {voiceState === 'listening' && (
                <div className="absolute inset-2 rounded-full border border-cyan-400/40 animate-ping opacity-60 [animation-duration:1.5s]" />
              )}
              {voiceState === 'speaking' && (
                <div className="absolute inset-1 rounded-full border border-emerald-400/30 animate-ping opacity-45 [animation-duration:1.8s]" />
              )}

              {/* Physical Core Button */}
              <div 
                onClick={handleCoreClick}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 border z-10 select-none shadow-2xl ${
                  voiceState === 'listening' ? 'bg-gradient-to-tr from-cyan-400 to-cyan-600 border-cyan-300 shadow-cyan-500/40 text-black scale-105' :
                  voiceState === 'thinking' ? 'bg-gradient-to-tr from-indigo-500 to-indigo-700 border-indigo-400 shadow-indigo-500/40 text-white animate-pulse' :
                  voiceState === 'speaking' ? 'bg-gradient-to-tr from-emerald-400 to-teal-600 border-emerald-300 shadow-emerald-500/30 text-black scale-110' :
                  'bg-zinc-900/90 border-zinc-750 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]'
                }`}
              >
                {voiceState === 'idle' && (
                  <div className="flex flex-col items-center">
                    <Mic className="w-10 h-10 mb-1" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-500">Tap Mic</span>
                  </div>
                )}
                
                {voiceState === 'listening' && (
                  <div className="flex flex-col items-center animate-pulse">
                    <AudioLines className="w-11 h-11 mb-1 text-black" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-black">Active</span>
                  </div>
                )}

                {voiceState === 'thinking' && (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-10 h-10 mb-1 text-white animate-spin [animation-duration:2.5s]" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-indigo-200">Thinking</span>
                  </div>
                )}

                {voiceState === 'speaking' && (
                  <div className="flex flex-col items-center">
                    <Volume2 className="w-11 h-11 mb-1 text-black animate-bounce" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-black">Speaking</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Orb text descriptors */}
            <div className="text-center mb-6">
              <h2 className={`text-sm font-black uppercase tracking-widest transition-colors duration-300 ${
                voiceState === 'listening' ? 'text-cyan-400' :
                voiceState === 'thinking' ? 'text-indigo-400' :
                voiceState === 'speaking' ? 'text-emerald-400' : 'text-zinc-300'
              }`}>
                {voiceState === 'idle' && "Hey FRIDAY"}
                {voiceState === 'listening' && "Listening..."}
                {voiceState === 'thinking' && "Thinking..."}
                {voiceState === 'speaking' && "FRIDAY speaking"}
              </h2>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">
                {voiceState === 'idle' && "Tap mic or use quick commands to speak"}
                {voiceState === 'listening' && "Say a query or try a quick command below."}
                {voiceState === 'thinking' && "Analyzing your query..."}
                {voiceState === 'speaking' && "Tap mic or click STOP below to interrupt"}
              </p>
            </div>

            {/* Simulated Live Audio Waves */}
            <div className="flex items-center gap-1.5 h-12 justify-center mb-6 px-12">
              {waveHeights.map((h, i) => (
                <div 
                  key={i}
                  style={{ height: `${h}px` }}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    voiceState === 'listening' ? 'bg-cyan-400' :
                    voiceState === 'thinking' ? 'bg-indigo-400' :
                    voiceState === 'speaking' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* LIVE TELEMETRY TEXT BOX */}
            {(liveTranscript || displayedResponseText) && (
              <div className="w-full max-w-md bg-zinc-950/70 border border-zinc-900 rounded-xl p-4 min-h-24 flex flex-col justify-between mb-4">
                <div className="space-y-3">
                  {liveTranscript && (
                    <div className="flex gap-2 items-start text-xs text-cyan-300 font-medium">
                      <User className="w-3.5 h-3.5 mt-0.5 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">OPERATOR TRANSCRIPT</span>
                        <p className="mt-0.5 italic">"{liveTranscript}"</p>
                      </div>
                    </div>
                  )}

                  {voiceState === 'thinking' && (
                    <div className="text-[10px] font-mono text-indigo-400 border-t border-zinc-900/80 pt-2 animate-pulse flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>SYNAPSE: compiling biometrics ledger, loading protocol database...</span>
                    </div>
                  )}

                  {displayedResponseText && (
                    <div className="flex gap-2 items-start text-xs text-zinc-200 font-medium border-t border-zinc-900/80 pt-3">
                      <Bot className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">FRIDAY INTERMEDIATE VOCAL</span>
                        <p className="mt-0.5">{displayedResponseText}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Interrupt Control Action */}
                {(voiceState === 'speaking' || voiceState === 'listening') && (
                  <button 
                    onClick={handleInterrupt}
                    className="mt-3 w-full border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-red-400" />
                    <span>Stop Speaking / Intercept</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Verbal Commands Dock */}
          <div className="border-t border-zinc-900/60 pt-4 shrink-0">
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulated Verbal Quick Commands</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {simulationQueries.map((item) => (
                <button
                  key={item.label}
                  disabled={voiceState !== 'idle'}
                  onClick={() => startListeningSequence(item.query, item.getResponse())}
                  className="flex items-center justify-between text-left text-[11px] font-semibold text-zinc-400 hover:text-cyan-400 border border-zinc-850 hover:border-cyan-500/20 bg-zinc-900/20 hover:bg-zinc-900/80 p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none group"
                >
                  <div className="truncate pr-2">
                    <span className="text-[8px] font-black text-zinc-550 group-hover:text-cyan-500/70 block uppercase tracking-wider mb-0.5">{item.label}</span>
                    <span className="truncate block font-medium">"{item.query}"</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-cyan-400 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Historical Transcript Feed Log */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 overflow-hidden min-h-0">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 mb-3 shrink-0">
            <History className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Conversation Log Feed</h3>
          </div>

          {/* Transcript Scroll Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-5 pr-1.5 scrollbar-thin scrollbar-thumb-zinc-900 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-full text-zinc-600 p-8">
                <Bot className="w-10 h-10 text-zinc-700 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">No telemetry recorded</p>
                <p className="text-[9px] text-zinc-650 max-w-xs mt-1 leading-normal">
                  Vocal and textual interactions will compile here in chronological logs for audit.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isFri = msg.sender === 'friday';
                return (
                  <div 
                    key={msg.id || idx} 
                    className={`flex gap-3 max-w-full ${isFri ? 'mr-auto' : 'ml-auto flex-row-reverse text-right'}`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border text-[10px] ${
                      isFri ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}>
                      {isFri ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex flex-col gap-1 max-w-[85%]">
                      <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block">
                        {isFri ? 'FRIDAY OS' : 'OPERATOR'} • {msg.timestamp}
                      </span>
                      <div className={`rounded-xl px-3.5 py-2.5 border text-xs leading-normal font-medium ${
                        isFri 
                          ? 'bg-zinc-900/40 border-zinc-850/80 text-zinc-350 rounded-tl-none' 
                          : 'bg-cyan-950/10 border-cyan-500/15 text-cyan-200 rounded-tr-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Voice architecture info block */}
          <div className="mt-3 pt-3 border-t border-zinc-900/60 bg-zinc-900/10 p-2.5 rounded-xl border border-zinc-850 shrink-0 text-[9px] text-zinc-500 leading-normal flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
            <span>
              <strong>ARCHITECTURE ARCHETYPE:</strong> Speech Recognition (ASR) to Natural Language Processing (NLP) loop. Local state simulates zero-latency speech streaming and interruption signals, perfectly portable to OpenAI Whisper/Gemini Live in production.
            </span>
          </div>
        </div>
      </div>

      {/* Footer Text Input Tray (Secondary Mode) */}
      <div className="flex gap-3 items-center shrink-0">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={voiceState !== 'idle'}
            placeholder="Type command manually (or ask: 'What's my workout today?')..."
            className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 rounded-xl h-12 pl-4 pr-12 text-xs text-zinc-100 placeholder-zinc-600 transition-all duration-200 outline-none disabled:opacity-40"
          />
          <button 
            type="button"
            onClick={handleCoreClick}
            className={`absolute right-3.5 top-3.5 p-0.5 rounded transition-all cursor-pointer ${
              voiceState === 'listening' ? 'text-cyan-400 animate-pulse' : 'text-zinc-500 hover:text-cyan-400'
            }`}
            title="Trigger verbal stream capture"
          >
            <Mic className="w-4.5 h-4.5" />
          </button>
        </div>
        
        <Button 
          variant="primary" 
          onClick={handleSendText}
          disabled={!inputText.trim() || voiceState !== 'idle'}
          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 p-0"
        >
          <Send className="w-4.5 h-4.5 text-black stroke-[2.5]" />
        </Button>
      </div>
    </div>
  );
};
