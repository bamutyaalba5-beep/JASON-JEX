import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  RefreshCw,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Radio,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  User,
  Copy,
  Check,
  Compass,
  Navigation as NavIcon,
} from 'lucide-react';
import { ChatMessage, DefconLevel, CameraDevice } from '../types';
import { getRealGeolocation } from '../utils/hardwareConnector';

interface SentinelTacticalChatProps {
  defcon: DefconLevel;
  cameras: CameraDevice[];
  facilityAddress?: string;
  onOpenCastMode?: () => void;
  onOpenTvMode?: () => void;
}

export const SentinelTacticalChat: React.FC<SentinelTacticalChatProps> = ({
  defcon,
  cameras,
  facilityAddress = 'Civic Center Command Plaza, San Francisco, CA',
  onOpenCastMode,
  onOpenTvMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'system',
      content:
        'SENTINEL ARC Tactical Operator AI initialized. Standing by for surveillance queries, Defcon threat assessments, Google Maps emergency facility locator, and screen casting guidance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'init-2',
      role: 'model',
      content:
        `Commander, I am online and synced with your sensor bus. Current posture: ${defcon}. All ${cameras.length} optical feeds and screen cast relay ports are active. How can I assist tactical operations?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clientLocation, setClientLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Awaiting GPS handshake');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Read real GPS location for Google Maps grounding
  useEffect(() => {
    getRealGeolocation()
      .then((loc) => {
        setClientLocation({ latitude: loc.latitude, longitude: loc.longitude });
        setLocationStatus(`GPS Locked: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} (±${loc.accuracy}m)`);
      })
      .catch(() => {
        setLocationStatus('Using Facility HQ Coordinates (San Francisco)');
      });
  }, []);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if user is asking for location/maps query
      const isMapsQuery =
        text.toLowerCase().includes('police') ||
        text.toLowerCase().includes('hospital') ||
        text.toLowerCase().includes('emergency') ||
        text.toLowerCase().includes('trauma') ||
        text.toLowerCase().includes('fire department') ||
        text.toLowerCase().includes('near') ||
        text.toLowerCase().includes('station');

      if (isMapsQuery) {
        // Use Google Maps Grounding via /api/gemini/maps-dispatch
        const res = await fetch('/api/gemini/maps-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
            latitude: clientLocation?.latitude,
            longitude: clientLocation?.longitude,
            facilityAddress,
          }),
        });

        const data = await res.json();
        const groundingUrls = (data.places || []).map((p: any) => ({
          uri: p.uri,
          title: p.title,
          snippet: p.snippet || p.category,
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            content: data.summaryText || 'Emergency facilities retrieved using Google Maps Grounding.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: 'gemini-3.5-flash (Google Maps Tool)',
            groundingUrls,
          },
        ]);
      } else {
        // Standard or complex conversation using /api/gemini/chat
        const conversationPayload = updatedHistory
          .filter((m) => m.role === 'user' || m.role === 'model')
          .slice(-8)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: conversationPayload,
            model: selectedModel,
          }),
        });

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            content: data.text || 'Tactical evaluation complete.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: data.modelUsed || selectedModel,
            groundingUrls: data.groundingUrls || [],
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          content: `[TACTICAL HEURISTIC DISPATCH]\nPerimeter monitoring remains armed. Error receiving remote model transmission: ${err?.message || 'Network delay'}. Recommendation: Inspect physical camera cables, check WebRTC link, and maintain DEFCON 3 elevated alert.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'OFFLINE_FALLBACK',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'system',
        content: 'Session reset. Tactical Operator AI standing by.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    {
      label: '📍 Nearest Police & Trauma Centers',
      prompt: 'Locate nearest police stations, tactical patrol sectors, and trauma emergency rooms around our coordinates using Google Maps.',
      action: 'maps',
    },
    {
      label: '🛡️ Threat & DEFCON Posture Review',
      prompt: `Audit current threat level (${defcon}) with ${cameras.length} cameras active. What actions should the commander take?`,
    },
    {
      label: '⚖️ Community Norms vs Crime Rules',
      prompt: 'Explain the distinction criteria between ordinary community activities (couriers, joggers, dogs) and genuine crimes requiring alarm tripwires.',
    },
    {
      label: '📺 Screen Cast & Smart TV Instructions',
      prompt: 'How do I cast my multi-camera surveillance matrix to my living room Smart TV or phone wirelessly?',
    },
  ];

  return (
    <div className="flex flex-col h-[750px] rounded-xl border border-purple-900/40 bg-[#040a16] shadow-[0_4px_30px_rgba(0,0,0,0.6)] font-mono-code text-xs overflow-hidden">
      {/* CHAT HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-900/50 bg-[#061022] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/40 bg-purple-950/60 text-purple-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
              <span>SENTINEL ARC TACTICAL AI OPERATOR</span>
              <span className="rounded border border-purple-500/40 bg-purple-950/60 px-2 py-0.5 text-[10px] text-purple-300">
                MULTI-TURN GEMINI + GOOGLE MAPS
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {locationStatus}
              </span>
            </div>
          </div>
        </div>

        {/* MODEL SELECTOR & UTILITY BUTTONS */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#020814] px-2.5 py-1">
            <Sliders className="h-3.5 w-3.5 text-purple-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-slate-300 text-[11px] outline-none cursor-pointer"
            >
              <option value="gemini-3.8-flash" className="bg-[#040a16]">gemini-3.8-flash (General Tactical)</option>
              <option value="gemini-3.5-flash" className="bg-[#040a16]">gemini-3.5-flash (Maps Grounding)</option>
              <option value="gemini-3.1-flash-lite" className="bg-[#040a16]">gemini-3.1-flash-lite (Fast Triage)</option>
              <option value="gemini-3.1-pro-preview" className="bg-[#040a16]">gemini-3.1-pro-preview (Complex Forensic)</option>
            </select>
          </div>

          <button
            onClick={clearChat}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#020814] px-2.5 py-1.5 text-slate-400 hover:text-slate-200 transition-all text-[11px]"
            title="Clear Chat Thread"
          >
            <RefreshCw className="h-3 w-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* MESSAGE THREAD (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="flex items-center justify-center text-[10px] text-purple-300/80 my-2"
              >
                <div className="rounded-full border border-purple-800/40 bg-purple-950/40 px-3 py-1 text-center">
                  ⚙️ {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* AVATAR */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isUser
                    ? 'border border-sky-500/40 bg-sky-950 text-sky-300'
                    : 'border border-purple-500/40 bg-purple-950 text-purple-300'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* MESSAGE BUBBLE */}
              <div
                className={`rounded-xl p-3.5 border space-y-2 shadow-lg ${
                  isUser
                    ? 'border-sky-700/60 bg-[#0a1e36] text-sky-100'
                    : 'border-purple-900/60 bg-[#0d1326] text-slate-200'
                }`}
              >
                {/* HEADER INFO */}
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 pb-1 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">
                      {isUser ? 'COMMANDER' : 'SENTINEL AI'}
                    </span>
                    {msg.modelUsed && (
                      <span className="rounded bg-purple-950/80 px-1.5 py-0.2 border border-purple-800/50 text-purple-300 text-[9px]">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="hover:text-slate-200"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="whitespace-pre-wrap leading-relaxed text-[11px]">
                  {msg.content}
                </div>

                {/* GOOGLE MAPS GROUNDING PLACE CARDS */}
                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-purple-900/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      <span>GROUNDED EMERGENCY LOCATIONS & DISPATCH PRECINCTS:</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                      {msg.groundingUrls.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col justify-between p-2 rounded-lg border border-cyan-800/60 bg-[#031526] hover:border-cyan-400 hover:bg-[#062038] transition-all group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-cyan-300 group-hover:text-cyan-200">
                              <span className="truncate">{place.title}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 text-cyan-400" />
                            </div>
                            {place.snippet && (
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                                {place.snippet}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 text-[9px] text-cyan-400 font-bold flex items-center gap-1">
                            <NavIcon className="h-2.5 w-2.5" />
                            <span>OPEN IN GOOGLE MAPS</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* LOADING INDICATOR */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto animate-fadeIn">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/40 bg-purple-950 text-purple-300">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-xl p-3 border border-purple-900/60 bg-[#0d1326] text-purple-300 flex items-center gap-2 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span>Analyzing tactical feeds and grounding intelligence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK PROMPT CHIPS */}
      <div className="px-4 py-2 border-t border-purple-900/40 bg-[#050e1c] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">QUICK DISPATCH:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(qp.prompt)}
            className="rounded-full border border-purple-800/60 bg-purple-950/40 px-3 py-1 text-[10px] text-purple-200 hover:border-purple-500 hover:bg-purple-900 transition-all shrink-0 whitespace-nowrap"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* INPUT FORM */}
      <div className="p-3 border-t border-purple-900/50 bg-[#061022]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask tactical AI operator (e.g., 'Find nearest police stations on Maps' or 'Analyze DEFCON status')..."
            className="flex-1 rounded-lg border border-purple-800/80 bg-[#020712] px-3 py-2 text-slate-200 text-xs outline-none focus:border-purple-400 transition-all placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500 bg-purple-700 px-4 py-2 font-bold text-white hover:bg-purple-600 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>DISPATCH</span>
          </button>
        </form>
      </div>
    </div>
  );
};
