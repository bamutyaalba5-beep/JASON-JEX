import React, { useState, useEffect, useRef } from 'react';
import {
  WebRtcMobileSender,
  PeerConnectionStatus,
} from '../utils/webrtcPeerManager';
import {
  Camera,
  RefreshCw,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  Wifi,
  Zap,
  Shield,
  ShieldAlert,
  Lock,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Tv,
} from 'lucide-react';

interface MobileCameraBroadcasterViewProps {
  roomId: string;
  onExitNodeMode?: () => void;
  onTriggerSos?: () => void;
}

export const MobileCameraBroadcasterView: React.FC<MobileCameraBroadcasterViewProps> = ({
  roomId,
  onExitNodeMode,
  onTriggerSos,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const senderRef = useRef<WebRtcMobileSender | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [status, setStatus] = useState<PeerConnectionStatus>({
    state: 'INITIALIZING',
    iceState: 'new',
    isPeerToPeerEncrypted: true,
    encryptionCipher: 'DTLS 1.3 / SRTP-AES-256',
    latencyMs: 32,
    fps: 30,
    bitrateKbps: 1850,
    networkType: 'CELLULAR_DATA',
    deviceModel: 'Mobile Phone Optical Node',
    facingMode: 'environment',
    resolution: '1920x1080',
  });
  const [sosSent, setSosSent] = useState(false);

  // Initialize and start streaming
  const handleStartBroadcast = async () => {
    setErrorMsg(null);
    try {
      const sender = new WebRtcMobileSender(roomId, (newStatus) => {
        setStatus(newStatus);
      });
      senderRef.current = sender;

      const mediaStream = await sender.startBroadcasting(facingMode);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setHasStarted(true);
    } catch (err: any) {
      console.error('Mobile camera start error:', err);
      setErrorMsg(err.message || 'Could not gain access to phone camera. Please grant camera/microphone permissions.');
    }
  };

  const handleFlipCamera = async () => {
    if (!senderRef.current) return;
    try {
      const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextFacing);
      const newStream = await senderRef.current.toggleFacingMode();
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Could not flip camera:', err);
    }
  };

  const toggleAudio = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  };

  const handleSendMobileSos = async () => {
    setSosSent(true);
    try {
      await fetch('/api/sos/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: [],
          threatLevel: 'PANIC_SOS',
          triggerSource: 'PANIC_BUTTON',
          location: { label: `Mobile Node (${roomId}) - Long Range Stream` },
          cameraName: `Mobile Phone Camera (${roomId})`,
        }),
      });
      setTimeout(() => setSosSent(false), 5000);
    } catch (err) {
      console.warn('SOS send error:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (senderRef.current) {
        senderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-black font-mono-code text-slate-100 select-none overflow-hidden">
      {/* TOP TACTICAL HUD */}
      <div className="z-20 flex items-center justify-between border-b border-sky-900/60 bg-[#040b15]/90 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-sky-500/50 bg-sky-950 text-sky-400">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="font-exo text-xs font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>SENTINEL ARC</span>
              <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] text-sky-300 border border-sky-500/30">
                OPTICAL NODE
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              ROOM: <strong className="text-amber-400">{roomId}</strong>
            </div>
          </div>
        </div>

        {/* STATUS BADGES */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className={`flex items-center gap-1 rounded px-2 py-0.5 border ${
            status.state === 'STREAMING' || status.state === 'CONNECTED'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              : status.state === 'FALLBACK_RELAY'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
              : 'bg-sky-950/80 text-sky-300 border-sky-500/50'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              status.state === 'STREAMING' || status.state === 'CONNECTED' ? 'bg-emerald-400 animate-ping' : 'bg-sky-400'
            }`} />
            <strong className="tracking-wider uppercase">
              {status.state === 'STREAMING' ? 'LIVE TO LAPTOP' : status.state === 'FALLBACK_RELAY' ? 'CELLULAR RELAY' : status.state}
            </strong>
          </span>

          {onExitNodeMode && (
            <button
              onClick={onExitNodeMode}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300 hover:text-white"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* MAIN VIEWPORT / VIDEO FEED */}
      <div className="relative flex-1 bg-[#020509] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="h-full w-full object-cover"
        />

        {/* Tactical Crosshair Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-40 rounded-xl border border-sky-500/30">
            <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-sky-400" />
            <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-sky-400" />
            <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-sky-400" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-sky-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-ping" />
            </div>
          </div>
        </div>

        {/* Live Metrics HUD */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1 text-[10px] text-sky-200">
          <div className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 backdrop-blur-sm border border-white/10">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>P2P ENCRYPTED • {status.encryptionCipher}</span>
          </div>
          <div className="flex items-center gap-2 rounded bg-black/60 px-2 py-0.5 backdrop-blur-sm border border-white/10">
            <span className="text-amber-300">LATENCY: {status.latencyMs}ms</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-300">FPS: {status.fps}</span>
            <span className="text-slate-400">|</span>
            <span className="text-sky-300">{status.networkType === 'CELLULAR_DATA' ? '4G/5G DATA' : 'WI-FI'}</span>
          </div>
          <div className="rounded bg-black/60 px-2 py-0.5 backdrop-blur-sm border border-white/10 text-slate-300">
            CAM: {facingMode === 'environment' ? 'BACK ULTRA-WIDE' : 'FRONT SENSOR'} • {status.resolution}
          </div>
        </div>

        {/* Not Started Splash Overlay */}
        {!hasStarted && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-sky-400 bg-sky-950/80 text-sky-300 shadow-[0_0_35px_rgba(56,189,248,0.5)] animate-pulse">
              <Camera className="h-8 w-8" />
            </div>

            <h2 className="mt-4 font-exo text-lg font-bold text-white tracking-wider">
              MOBILE OPTICAL BROADCASTER
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-xs">
              Transmit live peer-to-peer 1080p camera feed across mobile data or Wi-Fi to the laptop surveillance console.
            </p>

            <div className="mt-4 rounded-xl border border-sky-950 bg-[#071322] p-3 text-left w-full max-w-xs space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between text-slate-200">
                <span>Room Pairing ID:</span>
                <strong className="text-amber-400 font-mono text-xs">{roomId}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Encryption:</span>
                <span className="text-emerald-400">DTLS-SRTP (Military Grade)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Network Reach:</span>
                <span className="text-sky-400">Cellular / Cross-Country</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-3 max-w-xs rounded-lg border border-red-500/80 bg-red-950/80 p-2 text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleStartBroadcast}
              className="mt-6 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-600 py-3.5 font-exo text-sm font-bold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:bg-emerald-500 transition-all active:scale-95"
            >
              <Zap className="h-4 w-4" />
              <span>START LIVE BROADCAST</span>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS STRIP */}
      {hasStarted && (
        <div className="z-20 border-t border-sky-900/60 bg-[#040b15]/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-around gap-3">
            {/* Flip Camera */}
            <button
              onClick={handleFlipCamera}
              className="flex flex-col items-center gap-1 rounded-xl border border-sky-800/60 bg-sky-950/80 px-4 py-2 text-xs text-sky-200 hover:bg-sky-900 active:scale-95"
            >
              <RefreshCw className="h-5 w-5 text-sky-400" />
              <span className="text-[9px]">FLIP CAM</span>
            </button>

            {/* Mute Mic */}
            <button
              onClick={toggleAudio}
              className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-2 text-xs transition-all active:scale-95 ${
                isAudioMuted
                  ? 'border-red-500 bg-red-950/80 text-red-300'
                  : 'border-sky-800/60 bg-sky-950/80 text-sky-200 hover:bg-sky-900'
              }`}
            >
              {isAudioMuted ? <MicOff className="h-5 w-5 text-red-400" /> : <Mic className="h-5 w-5 text-sky-400" />}
              <span className="text-[9px]">{isAudioMuted ? 'UNMUTE' : 'MUTE'}</span>
            </button>

            {/* Stop Video */}
            <button
              onClick={toggleVideo}
              className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-2 text-xs transition-all active:scale-95 ${
                isVideoMuted
                  ? 'border-amber-500 bg-amber-950/80 text-amber-300'
                  : 'border-sky-800/60 bg-sky-950/80 text-sky-200 hover:bg-sky-900'
              }`}
            >
              {isVideoMuted ? <VideoOff className="h-5 w-5 text-amber-400" /> : <Video className="h-5 w-5 text-sky-400" />}
              <span className="text-[9px]">{isVideoMuted ? 'UNBLIND' : 'BLIND'}</span>
            </button>

            {/* Panic / Crime SOS Trigger from Phone */}
            <button
              onClick={handleSendMobileSos}
              className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-2 text-xs transition-all active:scale-95 ${
                sosSent
                  ? 'border-red-500 bg-red-600 text-white animate-bounce'
                  : 'border-red-700/80 bg-red-950/90 text-red-300 hover:bg-red-900'
              }`}
            >
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <span className="text-[9px] font-bold">{sosSent ? 'SOS DISPATCHED' : 'CRIME SOS'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
