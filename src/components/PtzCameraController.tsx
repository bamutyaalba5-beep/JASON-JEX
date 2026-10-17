import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Radio,
  Crosshair,
  Sliders,
  Play,
  Pause,
  Save,
  Bookmark,
  Activity,
  Check,
  Zap,
} from 'lucide-react';
import { CameraDevice } from '../types';

export interface PtzState {
  pan: number; // -180 to +180 degrees (mapped to px)
  tilt: number; // -90 to +90 degrees (mapped to px)
  zoom: number; // 1.0x to 5.0x
  speed: 1 | 2 | 4;
  isPatrolling: boolean;
  activePreset: number | null;
  lastCommand: string;
}

export interface PtzCameraControllerProps {
  camera: CameraDevice;
  onPtzChange?: (ptz: { pan: number; tilt: number; zoom: number }) => void;
  className?: string;
  isCompact?: boolean;
}

export const PtzCameraController: React.FC<PtzCameraControllerProps> = ({
  camera,
  onPtzChange,
  className = '',
  isCompact = false,
}) => {
  const [pan, setPan] = useState<number>(0);
  const [tilt, setTilt] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [speed, setSpeed] = useState<1 | 2 | 4>(2);
  const [isPatrolling, setIsPatrolling] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('IDLE');
  const [signalStatus, setSignalStatus] = useState<'IDLE' | 'TRANSMITTING' | 'ACKNOWLEDGED'>('IDLE');
  const [presets, setPresets] = useState<{ id: number; name: string; pan: number; tilt: number; zoom: number }[]>([
    { id: 1, name: 'Preset 1: Gate', pan: -35, tilt: 10, zoom: 1.8 },
    { id: 2, name: 'Preset 2: Doorway', pan: 0, tilt: 0, zoom: 1.0 },
    { id: 3, name: 'Preset 3: Perimeter', pan: 45, tilt: -15, zoom: 2.2 },
    { id: 4, name: 'Preset 4: Driveway', pan: -60, tilt: -10, zoom: 2.8 },
  ]);

  const patrolIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const patrolDirectionRef = useRef<number>(1);

  // Notify parent component for real-time viewport transform
  useEffect(() => {
    onPtzChange?.({ pan, tilt, zoom });
  }, [pan, tilt, zoom, onPtzChange]);

  // Transmit directional PTZ signal to network backend
  const sendPtzSignal = useCallback(
    async (command: string, deltaPan = 0, deltaTilt = 0, deltaZoom = 0) => {
      setSignalStatus('TRANSMITTING');
      setLastCommand(command);

      const newPan = Math.max(-100, Math.min(100, pan + deltaPan));
      const newTilt = Math.max(-80, Math.min(80, tilt + deltaTilt));
      const newZoom = Math.max(1.0, Math.min(5.0, Number((zoom + deltaZoom).toFixed(2))));

      setPan(newPan);
      setTilt(newTilt);
      setZoom(newZoom);

      try {
        await fetch('/api/camera/ptz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cameraId: camera.id,
            cameraName: camera.name,
            command,
            pan: newPan,
            tilt: newTilt,
            zoom: newZoom,
            speed,
            timestamp: Date.now(),
          }),
        });
        setSignalStatus('ACKNOWLEDGED');
        setTimeout(() => setSignalStatus('IDLE'), 400);
      } catch (err) {
        console.warn('Network camera PTZ signal dispatch fallback to local emulation:', err);
        setSignalStatus('ACKNOWLEDGED');
        setTimeout(() => setSignalStatus('IDLE'), 400);
      }
    },
    [camera.id, camera.name, pan, tilt, zoom, speed]
  );

  // Handle directional buttons with speed multiplier
  const handleMove = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP_LEFT' | 'UP_RIGHT' | 'DOWN_LEFT' | 'DOWN_RIGHT') => {
    const step = 8 * speed;
    switch (direction) {
      case 'UP':
        sendPtzSignal('TILT_UP', 0, -step, 0);
        break;
      case 'DOWN':
        sendPtzSignal('TILT_DOWN', 0, step, 0);
        break;
      case 'LEFT':
        sendPtzSignal('PAN_LEFT', -step, 0, 0);
        break;
      case 'RIGHT':
        sendPtzSignal('PAN_RIGHT', step, 0, 0);
        break;
      case 'UP_LEFT':
        sendPtzSignal('PAN_TILT_UP_LEFT', -step * 0.7, -step * 0.7, 0);
        break;
      case 'UP_RIGHT':
        sendPtzSignal('PAN_TILT_UP_RIGHT', step * 0.7, -step * 0.7, 0);
        break;
      case 'DOWN_LEFT':
        sendPtzSignal('PAN_TILT_DOWN_LEFT', -step * 0.7, step * 0.7, 0);
        break;
      case 'DOWN_RIGHT':
        sendPtzSignal('PAN_TILT_DOWN_RIGHT', step * 0.7, step * 0.7, 0);
        break;
    }
  };

  // Center / Home reset
  const handleHomeReset = () => {
    setPan(0);
    setTilt(0);
    setZoom(1.0);
    setActivePreset(null);
    sendPtzSignal('HOME_RESET', -pan, -tilt, 1.0 - zoom);
  };

  // Zoom controls
  const handleZoom = (direction: 'IN' | 'OUT') => {
    const delta = direction === 'IN' ? 0.3 * speed : -0.3 * speed;
    sendPtzSignal(direction === 'IN' ? 'ZOOM_IN' : 'ZOOM_OUT', 0, 0, delta);
  };

  // Preset recall
  const handleRecallPreset = (preset: { id: number; name: string; pan: number; tilt: number; zoom: number }) => {
    setActivePreset(preset.id);
    setPan(preset.pan);
    setTilt(preset.tilt);
    setZoom(preset.zoom);
    sendPtzSignal(`GOTO_PRESET_${preset.id}`, preset.pan - pan, preset.tilt - tilt, preset.zoom - zoom);
  };

  // Save current position to preset
  const handleSavePreset = (id: number) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pan, tilt, zoom } : p))
    );
    sendPtzSignal(`SAVE_PRESET_${id}`);
  };

  // Auto-patrol / continuous sweep
  useEffect(() => {
    if (!isPatrolling) {
      if (patrolIntervalRef.current) {
        clearInterval(patrolIntervalRef.current);
        patrolIntervalRef.current = null;
      }
      return;
    }

    patrolIntervalRef.current = setInterval(() => {
      setPan((prevPan) => {
        let nextPan = prevPan + patrolDirectionRef.current * (4 * speed);
        if (nextPan >= 70) {
          patrolDirectionRef.current = -1;
          nextPan = 70;
        } else if (nextPan <= -70) {
          patrolDirectionRef.current = 1;
          nextPan = -70;
        }
        return nextPan;
      });
      setLastCommand('PATROL_SWEEP');
    }, 120);

    return () => {
      if (patrolIntervalRef.current) {
        clearInterval(patrolIntervalRef.current);
        patrolIntervalRef.current = null;
      }
    };
  }, [isPatrolling, speed]);

  return (
    <div
      id="ptz-controller-panel"
      className={`rounded-xl border border-cyan-500/40 bg-[#050e1a]/95 backdrop-blur-md p-3.5 text-slate-100 font-mono-code shadow-[0_4px_25px_rgba(6,182,212,0.15)] ${className}`}
    >
      {/* Header & Signal Telemetry */}
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-950/80 text-cyan-400">
            <Compass className="h-4 w-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-exo font-bold text-slate-100">
              <span>PTZ GIMBAL CONTROLLER</span>
              <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[9px] text-cyan-300 border border-cyan-800">
                ONVIF / PELCO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <span>Target: <span className="text-cyan-300">{camera.name}</span></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    signalStatus === 'TRANSMITTING'
                      ? 'bg-amber-400 animate-ping'
                      : signalStatus === 'ACKNOWLEDGED'
                      ? 'bg-emerald-400'
                      : 'bg-cyan-400'
                  }`}
                />
                <span className="text-[10px] text-cyan-400">{signalStatus}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Speed Multiplier selector */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-slate-400 mr-1">SLEW:</span>
          {([1, 2, 4] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                speed === s
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              {s}X
            </button>
          ))}
        </div>
      </div>

      {/* Main Gimbal & Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Directional Pad */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-cyan-900/40 bg-[#030812]">
          <div className="text-[10px] text-cyan-400/80 mb-2 uppercase tracking-wider flex items-center gap-1">
            <Crosshair className="h-3 w-3" />
            <span>DIRECTIONAL GIMBAL PAD</span>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Compass background circle */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-transparent pointer-events-none" />
            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/30 pointer-events-none" />

            {/* UP */}
            <button
              type="button"
              onClick={() => handleMove('UP')}
              title="Tilt Up"
              className="absolute top-1 left-1/2 -translate-x-1/2 flex h-8 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-800 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <ChevronUp className="h-5 w-5" />
            </button>

            {/* DOWN */}
            <button
              type="button"
              onClick={() => handleMove('DOWN')}
              title="Tilt Down"
              className="absolute bottom-1 left-1/2 -translate-x-1/2 flex h-8 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-800 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <ChevronDown className="h-5 w-5" />
            </button>

            {/* LEFT */}
            <button
              type="button"
              onClick={() => handleMove('LEFT')}
              title="Pan Left"
              className="absolute left-1 top-1/2 -translate-y-1/2 flex h-10 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-800 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => handleMove('RIGHT')}
              title="Pan Right"
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-800 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* CENTER HOME BUTTON */}
            <button
              type="button"
              onClick={handleHomeReset}
              title="Center / Reset Gimbal to Home"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400 bg-cyan-900 text-cyan-100 hover:bg-cyan-600 hover:scale-105 active:scale-90 transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Coordinate Readout */}
          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-300">
            <span>
              PAN: <strong className="text-cyan-300">{pan > 0 ? `+${Math.round(pan)}°` : `${Math.round(pan)}°`}</strong>
            </span>
            <span>•</span>
            <span>
              TILT: <strong className="text-cyan-300">{tilt > 0 ? `+${Math.round(tilt)}°` : `${Math.round(tilt)}°`}</strong>
            </span>
            <span>•</span>
            <span>
              ZOOM: <strong className="text-cyan-300">{zoom.toFixed(1)}X</strong>
            </span>
          </div>
        </div>

        {/* Zoom, Patrol & Presets Column */}
        <div className="flex flex-col gap-3">
          {/* Zoom Section */}
          <div className="rounded-xl border border-cyan-900/40 bg-[#030812] p-2.5">
            <div className="flex items-center justify-between text-[10px] text-cyan-400/80 mb-2 uppercase">
              <span className="flex items-center gap-1">
                <ZoomIn className="h-3 w-3" />
                <span>MAGNIFICATION & ZOOM</span>
              </span>
              <span className="font-bold text-cyan-300">{zoom.toFixed(1)}X</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleZoom('OUT')}
                disabled={zoom <= 1.0}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={zoom}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setZoom(val);
                  sendPtzSignal('ZOOM_SLIDER', 0, 0, val - zoom);
                }}
                className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <button
                type="button"
                onClick={() => handleZoom('IN')}
                disabled={zoom >= 5.0}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Auto-Patrol / Continuous Sweep */}
          <div className="flex items-center justify-between rounded-xl border border-cyan-900/40 bg-[#030812] p-2.5">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                  isPatrolling
                    ? 'border-emerald-500 bg-emerald-950 text-emerald-400'
                    : 'border-slate-700 bg-slate-900 text-slate-500'
                }`}
              >
                <Radio className={`h-3.5 w-3.5 ${isPatrolling ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-200">CONTINUOUS PATROL</div>
                <div className="text-[9px] text-slate-400">Autonomous motor sweep</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPatrolling(!isPatrolling)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                isPatrolling
                  ? 'border border-emerald-500 bg-emerald-950 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isPatrolling ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{isPatrolling ? 'STOP PATROL' : 'START PATROL'}</span>
            </button>
          </div>

          {/* Guard Tour Presets */}
          <div className="rounded-xl border border-cyan-900/40 bg-[#030812] p-2.5">
            <div className="flex items-center justify-between text-[10px] text-cyan-400/80 mb-1.5 uppercase">
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                <span>SAVED GUARD PRESETS</span>
              </span>
              <span className="text-[9px] text-slate-400">Click to recall</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRecallPreset(p)}
                    className={`flex-1 truncate rounded px-2 py-1 text-[10px] text-left transition-all border ${
                      activePreset === p.id
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                    title={`Go to ${p.name} (Pan: ${p.pan}°, Tilt: ${p.tilt}°, Zoom: ${p.zoom}x)`}
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePreset(p.id)}
                    title={`Save current view to ${p.name}`}
                    className="flex h-6 w-6 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-300 hover:border-cyan-700"
                  >
                    <Save className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
