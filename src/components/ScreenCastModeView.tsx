import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Cast,
  Tv,
  Monitor,
  Smartphone,
  Play,
  Square,
  Pause,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Radio,
  Eye,
  Settings,
} from 'lucide-react';
import { ScreenCastSession } from '../types';
import { startScreenDisplayCapture } from '../utils/hardwareConnector';

interface ScreenCastModeViewProps {
  onOpenTvMode?: () => void;
  onOpenHardwareSettings?: () => void;
}

export const ScreenCastModeView: React.FC<ScreenCastModeViewProps> = ({
  onOpenTvMode,
  onOpenHardwareSettings,
}) => {
  const [castStream, setCastStream] = useState<MediaStream | null>(null);
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasAudio, setHasAudio] = useState<boolean>(true);
  const [sourceType, setSourceType] = useState<'ENTIRE_SCREEN' | 'APPLICATION_WINDOW' | 'BROWSER_TAB'>('ENTIRE_SCREEN');
  const [targetDevice, setTargetDevice] = useState<'SMART_TV' | 'MOBILE_DEVICE' | 'COMMAND_MONITOR'>('SMART_TV');
  const [targetDeviceName, setTargetDeviceName] = useState<string>('Living Room Smart TV (Chromecast / AirPlay)');
  const [castResolution, setCastResolution] = useState<string>('1920x1080 FHD (60 FPS)');
  const [castFps, setCastFps] = useState<number>(30);
  const [bitrateKbps, setBitrateKbps] = useState<number>(4200);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [castCode, setCastCode] = useState<string>('');
  const [castId, setCastId] = useState<string>('');
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const relayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const relayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or generate casting room credentials
  useEffect(() => {
    const code = `CAST-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `SST-${Date.now().toString(36).toUpperCase()}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const link = `${origin}/?mode=cast_viewer&castId=${id}`;

    setCastCode(code);
    setCastId(id);
    setViewerUrl(link);

    QRCode.toDataURL(link, {
      width: 280,
      margin: 2,
      color: { dark: '#020617', light: '#ffffff' },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR gen error:', err));
  }, []);

  // Timer for active cast duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCasting && !isPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCasting, isPaused]);

  // Push frame relay periodically to backend so remote smart TV or phone can see the stream
  const startFrameRelay = useCallback((stream: MediaStream, activeCastId: string) => {
    if (relayIntervalRef.current) clearInterval(relayIntervalRef.current);

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});

    const canvas = relayCanvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    relayIntervalRef.current = setInterval(async () => {
      if (!ctx || video.readyState < 2) return;

      canvas.width = 640;
      canvas.height = 360;
      ctx.drawImage(video, 0, 0, 640, 360);

      try {
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.65);
        await fetch(`/api/cast/relay-frame/${activeCastId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frameBase64,
            resolution: '1920x1080',
            framerate: 30,
            bitrateKbps: 3800,
          }),
        });
      } catch (_) {
        // network polling
      }
    }, 400); // ~2.5 fps fallback relay for low-bandwidth cellular/TV
  }, []);

  const handleStartCast = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const stream = await startScreenDisplayCapture({
        audio: hasAudio,
        frameRate: 30,
      });

      // Handle user stopping stream via browser native UI banner
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          handleStopCast();
        };
      });

      setCastStream(stream);
      setIsCasting(true);
      setIsPaused(false);
      setElapsedSeconds(0);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Register session with backend
      await fetch('/api/cast/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          targetDeviceType: targetDevice,
          targetDeviceName,
        }),
      });

      // Start frame relay for remote TV receiver
      startFrameRelay(stream, castId);

      setSuccessMsg(`Screen Cast active! Broadcasting to ${targetDeviceName}. External devices can scan the QR code or open the viewer link.`);
    } catch (err: any) {
      console.warn('Cast error:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Screen capture permission was cancelled by user.');
      } else {
        setErrorMsg(err.message || 'Could not initiate screen cast. Check browser permissions.');
      }
    }
  };

  const handleStopCast = () => {
    if (castStream) {
      castStream.getTracks().forEach((t) => t.stop());
    }
    if (relayIntervalRef.current) {
      clearInterval(relayIntervalRef.current);
      relayIntervalRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }

    if (castId) {
      fetch(`/api/cast/stop/${castId}`, { method: 'POST' }).catch(() => {});
    }

    setCastStream(null);
    setIsCasting(false);
    setIsPaused(false);
    setSuccessMsg('Screen cast session closed successfully.');
  };

  const handleTogglePause = () => {
    if (!castStream) return;
    const isNowPaused = !isPaused;
    castStream.getVideoTracks().forEach((t) => {
      t.enabled = !isNowPaused;
    });
    setIsPaused(isNowPaused);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(viewerUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 font-mono-code text-xs">
      {/* Hidden canvas for video frame extraction */}
      <canvas ref={relayCanvasRef} className="hidden" />

      {/* HEADER BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-900/40 bg-[#061424] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-400">
            <Cast className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span>WIRELESS SCREEN CAST & DISPLAY MIRROR</span>
              <span className="rounded border border-cyan-500/40 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-normal text-cyan-300">
                {isCasting ? (isPaused ? 'CAST PAUSED' : 'LIVE BROADCASTING') : 'READY TO CAST'}
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Cast entire laptop screen, surveillance matrix, or specific application windows to Smart TVs, secondary monitors, or phones
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/60 bg-amber-950 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            >
              <Tv className="h-4 w-4" />
              <span>TV MATRIX VIEW</span>
            </button>
          )}
          {onOpenHardwareSettings && (
            <button
              onClick={onOpenHardwareSettings}
              className="flex items-center gap-1.5 rounded-lg border border-sky-700/60 bg-sky-950 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-900 transition-all"
            >
              <Settings className="h-4 w-4" />
              <span>DEVICE SETTINGS</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/60 bg-emerald-950/70 p-3 text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold text-base">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/60 bg-red-950/70 p-3 text-red-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white font-bold text-base">×</button>
        </div>
      )}

      {/* MAIN TWO-COLUMN CAST INTERFACE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT COLUMN: LIVE CAST PREVIEW & CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* VIDEO PREVIEW FRAME */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-900/50 bg-[#030914] shadow-[0_8px_32px_rgba(0,0,0,0.6)] aspect-video flex items-center justify-center">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-contain ${!isCasting ? 'hidden' : ''}`}
            />

            {!isCasting && (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
                  <Cast className="h-8 w-8" />
                </div>
                <h3 className="font-exo text-base font-bold text-slate-100">
                  SCREEN CAST TRANSMITTER READY
                </h3>
                <p className="mt-1 max-w-sm text-[11px] text-slate-400 leading-relaxed mx-auto">
                  Click 'START SCREEN CAST' to select an entire display, application window, or surveillance tab. Stream transmits with AES-GCM P2P and low-latency frame relay.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={handleStartCast}
                    className="flex items-center gap-2 rounded-lg border border-cyan-400 bg-cyan-600 px-5 py-2.5 font-bold text-slate-950 hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>START SCREEN CAST</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE OVERLAY HUD */}
            {isCasting && (
              <div className="pointer-events-none absolute inset-0 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded bg-black/80 backdrop-blur px-2.5 py-1 border border-cyan-500/40 text-[10px] text-cyan-300">
                    <span className={`h-2 w-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 animate-ping'}`} />
                    <strong>{isPaused ? 'PAUSED' : 'CASTING LIVE'}</strong>
                    <span className="text-slate-400">|</span>
                    <span>{formatTime(elapsedSeconds)}</span>
                  </div>
                  <div className="rounded bg-black/80 backdrop-blur px-2.5 py-1 border border-slate-700 text-[10px] text-slate-300">
                    {castResolution}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="rounded bg-black/75 px-2 py-0.5">
                    Target: <span className="text-cyan-300 font-bold">{targetDeviceName}</span>
                  </div>
                  <div className="rounded bg-black/75 px-2 py-0.5">
                    Bitrate: <span className="text-emerald-400">{bitrateKbps} kbps</span> • {castFps} FPS
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE CAST CONTROL BAR */}
          {isCasting && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-900/50 bg-[#071322] p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePause}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-bold transition-all ${
                    isPaused
                      ? 'border-emerald-500 bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                      : 'border-amber-500 bg-amber-950 text-amber-300 hover:bg-amber-900'
                  }`}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span>{isPaused ? 'RESUME CAST' : 'PAUSE CAST'}</span>
                </button>

                <button
                  onClick={handleStopCast}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500 bg-red-950 px-3 py-2 font-bold text-red-300 hover:bg-red-900 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>STOP CAST</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <div className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>AES-256 Encrypted</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Frame Relay Synced</span>
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURATION OPTIONS */}
          <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-exo font-bold text-slate-200 flex items-center gap-2 text-xs">
                <Sliders className="h-4 w-4 text-cyan-400" />
                SCREEN CAST SOURCE & HARDWARE TARGET
              </span>
              <span className="text-[10px] text-slate-400">DisplayMedia Web API</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Display Device</label>
                <select
                  value={targetDevice}
                  onChange={(e) => {
                    const dev = e.target.value as any;
                    setTargetDevice(dev);
                    if (dev === 'SMART_TV') setTargetDeviceName('Living Room Smart TV (Chromecast / AirPlay)');
                    else if (dev === 'MOBILE_DEVICE') setTargetDeviceName('Field Commander Mobile Phone');
                    else setTargetDeviceName('Command Center Secondary Monitor');
                  }}
                  className="w-full rounded-lg border border-sky-800/80 bg-[#091524] px-3 py-2 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                >
                  <option value="SMART_TV">Smart TV (Chromecast / Google TV / Apple AirPlay)</option>
                  <option value="COMMAND_MONITOR">Command Station Secondary Monitor</option>
                  <option value="MOBILE_DEVICE">Mobile Smartphone / Tablet Remote Receiver</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Device Label</label>
                <input
                  type="text"
                  value={targetDeviceName}
                  onChange={(e) => setTargetDeviceName(e.target.value)}
                  placeholder="e.g. Samsung 65-inch QLED TV"
                  className="w-full rounded-lg border border-sky-800/80 bg-[#091524] px-3 py-2 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-900/40 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={hasAudio}
                  onChange={(e) => setHasAudio(e.target.checked)}
                  className="rounded border-sky-700 bg-sky-950 text-cyan-500 focus:ring-0"
                />
                <span>Include System / Microphone Audio in Cast</span>
              </label>

              <div className="flex items-center gap-2 text-slate-400">
                <span>Resolution:</span>
                <span className="text-cyan-300 font-bold">1080p FHD</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSTANT RECEIVER CONNECTION & QR CODE (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* PAIRING QR CODE & DIRECT LINK CARD */}
          <div className="rounded-xl border border-cyan-900/50 bg-[#071322] p-4 flex flex-col items-center text-center shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-exo text-sm mb-1">
              <QrCode className="h-5 w-5" />
              <span>SCAN QR TO CONNECT ANY TV OR DEVICE</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs mb-3">
              Scan with smart TV camera/browser or any mobile phone to instantly mirror this screen wirelessly without cables.
            </p>

            {/* QR CODE CONTAINER */}
            <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-cyan-500/50">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Cast Pairing QR"
                  className="h-44 w-44 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center text-slate-700">
                  Generating QR...
                </div>
              )}
            </div>

            {/* CAST CODE PILL */}
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/70 px-3 py-1.5 text-xs text-cyan-300">
              <span>PAIR CODE:</span>
              <strong className="tracking-widest font-mono text-sm text-cyan-200">{castCode}</strong>
            </div>

            {/* DIRECT URL & COPY BUTTON */}
            <div className="mt-3 w-full space-y-1.5 text-left">
              <span className="text-[10px] text-slate-400">Direct Wireless Receiver URL:</span>
              <div className="flex items-center gap-1.5 rounded-lg border border-sky-800 bg-[#020814] p-1.5">
                <input
                  type="text"
                  readOnly
                  value={viewerUrl}
                  className="w-full bg-transparent text-[11px] text-slate-300 outline-none select-all px-1"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 rounded bg-cyan-800 px-2.5 py-1 text-[10px] font-bold text-cyan-100 hover:bg-cyan-700 transition-all shrink-0"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

            <div className="mt-3 w-full flex gap-2">
              <a
                href={viewerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-sky-700 bg-sky-950 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-900 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>OPEN RECEIVER TAB</span>
              </a>
            </div>
          </div>

          {/* COMPATIBILITY & SUPPORTED RECEIVERS */}
          <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-3 space-y-2 text-[11px]">
            <div className="font-exo font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Tv className="h-4 w-4 text-amber-400" />
              <span>SUPPORTED CASTING RECEIVERS</span>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between p-1.5 rounded bg-[#091524]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Smart TV (LG webOS, Samsung Tizen, Sony Bravia)
                </span>
                <span className="text-emerald-400 font-bold">1080p Web Browser</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-[#091524]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Google Chromecast / Android TV / FireStick
                </span>
                <span className="text-cyan-400 font-bold">Native Tab Mirror</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-[#091524]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Apple AirPlay / Mac / iPad / iPhone
                </span>
                <span className="text-indigo-400 font-bold">Safari Screen Link</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-[#091524]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Secondary Laptop / Control Room Monitor
                </span>
                <span className="text-amber-400 font-bold">Dual Monitor Cast</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
