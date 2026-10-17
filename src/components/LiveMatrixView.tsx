import React, { useState } from 'react';
import { CameraDevice } from '../types';
import {
  LayoutGrid,
  Video,
  Maximize2,
  Volume2,
  VolumeX,
  Camera,
  Radio,
  Wifi,
  Shield,
} from 'lucide-react';

interface LiveMatrixViewProps {
  cameras: CameraDevice[];
  onSelectCamera: (cam: CameraDevice) => void;
  onTriggerAlarm: (reason: string, details?: string) => void;
}

export const LiveMatrixView: React.FC<LiveMatrixViewProps> = ({
  cameras,
  onSelectCamera,
  onTriggerAlarm,
}) => {
  const [gridSize, setGridSize] = useState<2 | 3>(2);
  const [mutedChannels, setMutedChannels] = useState<{ [id: string]: boolean }>({});

  const toggleMute = (id: string) => {
    setMutedChannels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* HEADER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-400">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span>MULTI-CHANNEL SURVEILLANCE MATRIX</span>
              <span className="rounded border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono-code font-normal text-emerald-300">
                SYNCHRONIZED REAL-TIME
              </span>
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Simultaneous Multi-Feed Monitoring • Hardware Sensors • Mobile Phones • IP RTSP Cameras
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-slate-400">GRID:</span>
          <button
            onClick={() => setGridSize(2)}
            className={`rounded px-2.5 py-1 text-xs font-mono-code ${
              gridSize === 2
                ? 'bg-sky-900 text-sky-200 border border-sky-500'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            2x2
          </button>
          <button
            onClick={() => setGridSize(3)}
            className={`rounded px-2.5 py-1 text-xs font-mono-code ${
              gridSize === 3
                ? 'bg-sky-900 text-sky-200 border border-sky-500'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            3x3
          </button>
        </div>
      </div>

      {/* MATRIX SURVEILLANCE GRID */}
      <div
        className={`grid gap-3 ${
          gridSize === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        {cameras.map((cam, idx) => {
          const isMuted = mutedChannels[cam.id] ?? true;
          return (
            <div
              key={cam.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-sky-900/50 bg-[#050b14] shadow-[0_0_20px_rgba(0,0,0,0.7)]"
            >
              {/* Feed Header */}
              <div className="flex items-center justify-between border-b border-sky-950 bg-[#06101d] px-3 py-2 text-xs font-mono-code">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-slate-200 truncate">{cam.name}</span>
                </div>
                <span className="rounded bg-sky-950/80 px-1.5 py-0.2 text-[10px] text-sky-300">
                  CH-0{idx + 1}
                </span>
              </div>

              {/* Feed Simulated/Live View Canvas */}
              <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                {/* Surveillance Radar Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)]" />
                <div className="radar-sweep absolute inset-0 pointer-events-none" />

                {/* Tactical Reticle Graphics */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                  <Video className="h-8 w-8 text-sky-500/40 mb-1" />
                  <div className="text-[11px] font-mono-code text-slate-300 font-semibold">{cam.location}</div>
                  <div className="text-[10px] font-mono-code text-sky-400/80">
                    {cam.resolution} • {cam.fps} FPS • {cam.type.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Bottom HUD inside video */}
                <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between text-[10px] font-mono-code text-slate-400">
                  <span className="rounded bg-black/70 px-1.5 py-0.5">LIVE SENSOR ONLINE</span>
                  <span className="rounded bg-black/70 px-1.5 py-0.5">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Feed Controls Footer */}
              <div className="flex items-center justify-between border-t border-sky-950/70 bg-[#071322] px-3 py-2 text-xs">
                <button
                  onClick={() => onSelectCamera(cam)}
                  className="rounded bg-sky-950/80 px-2.5 py-1 text-[11px] font-mono-code text-sky-300 hover:bg-sky-900 border border-sky-800/40"
                >
                  FOCUS MONITOR
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMute(cam.id)}
                    className="rounded p-1 text-slate-400 hover:text-white"
                    title={isMuted ? 'Listen' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => onTriggerAlarm('MANUAL_FEED_ALARM', `Operator triggered alarm on feed ${cam.name}`)}
                    className="rounded p-1 text-red-400 hover:bg-red-950"
                    title="Engage alarm on this channel"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
