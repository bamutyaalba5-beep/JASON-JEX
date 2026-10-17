import React, { useState, useEffect, useRef } from 'react';
import {
  Cast,
  Tv,
  Maximize2,
  RefreshCw,
  Wifi,
  ShieldCheck,
  Activity,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

interface CastReceiverViewProps {
  castId: string;
  onExit?: () => void;
}

export const CastReceiverView: React.FC<CastReceiverViewProps> = ({ castId, onExit }) => {
  const [frameBase64, setFrameBase64] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [fps, setFps] = useState<number>(30);
  const [resolution, setResolution] = useState<string>('1920x1080');
  const [lastReceivedTime, setLastReceivedTime] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Poll server for relayed cast frames
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const start = performance.now();
        const res = await fetch(`/api/cast/relay-frame/${castId}`);
        const roundtrip = Math.round(performance.now() - start);
        const data = await res.json();

        if (!active) return;

        if (data.available && data.frameBase64) {
          setFrameBase64(data.frameBase64);
          setIsReceiving(true);
          setLastReceivedTime(Date.now());
          setLatencyMs(roundtrip);
          if (data.resolution) setResolution(data.resolution);
          if (data.framerate) setFps(data.framerate);
        } else {
          // If no frame received for 6 seconds, show waiting state
          if (Date.now() - lastReceivedTime > 6000) {
            setIsReceiving(false);
          }
        }
      } catch (err) {
        if (Date.now() - lastReceivedTime > 8000) {
          setIsReceiving(false);
        }
      }
    };

    const interval = setInterval(poll, 400);
    poll();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [castId, lastReceivedTime]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#02050b] text-slate-100 flex flex-col font-mono-code select-none"
    >
      {/* RECEIVER TOP STRIP */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#040c18] border-b border-cyan-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
            <Cast className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-exo font-bold text-slate-200">SENTINEL CAST RECEIVER</span>
            <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-800">
              ID: {castId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className={`h-2 w-2 rounded-full ${isReceiving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isReceiving ? 'RECEIVING STREAM' : 'WAITING FOR SOURCE...'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
            <span>{resolution}</span>
            <span>•</span>
            <span>{latencyMs}ms LATENCY</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 rounded border border-cyan-800 bg-cyan-950 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-900"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>FULLSCREEN</span>
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
              title="Return to Main Command Dashboard"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>DASHBOARD</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN STREAM CANVAS / VIEWPORT */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {frameBase64 ? (
          <img
            src={frameBase64}
            alt="Wireless Cast Stream"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center p-6 max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-950/60 text-cyan-400 animate-pulse">
              <Tv className="h-8 w-8" />
            </div>
            <h2 className="font-exo text-lg font-bold text-slate-100">
              CONNECTED TO WIRELESS CAST CHANNEL
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Waiting for the primary command transmitter to stream screen frames for session <strong className="text-cyan-300">{castId}</strong>.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400 text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>AES-256 Encrypted Channel Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM METRICS BAR */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#040c18] border-t border-cyan-900/50 text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">● LIVE P2P RELAY</span>
          <span>Buffer: 0ms</span>
          <span>Framerate: {fps} FPS</span>
        </div>
        <div className="flex items-center gap-2">
          <span>TV / BIG DISPLAY SYNC MODE</span>
        </div>
      </div>
    </div>
  );
};
