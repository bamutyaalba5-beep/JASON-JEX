import React from 'react';
import { X, Cast, Maximize2, Shield } from 'lucide-react';
import { CameraDevice } from '../types';
import { ScreenCastModeView } from './ScreenCastModeView';

export interface CastModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCamera?: CameraDevice;
  cameras?: CameraDevice[];
}

export const CastModeModal: React.FC<CastModeModalProps> = ({
  isOpen,
  onClose,
  activeCamera,
  cameras,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="cast-mode-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="cast-mode-modal-container"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-cyan-500/50 bg-[#050c16] text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden"
      >
        {/* Tactical Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 bg-[#071322] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/50 bg-cyan-950/80 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Cast className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-exo text-lg font-bold tracking-wide text-slate-100">
                  WIRELESS SCREEN CAST TRANSMITTER
                </h2>
                <span className="rounded border border-cyan-500/40 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-mono-code font-bold text-cyan-300">
                  SMART TV / P2P
                </span>
              </div>
              <p className="text-xs font-mono-code text-slate-400">
                Transmit surveillance stream in real-time to Smart TVs, phones, monitors, or Chromecast
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-cast-modal-btn"
              onClick={onClose}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-500/50 hover:bg-cyan-950/50 hover:text-cyan-200 transition-all"
              title="Close Cast Controller"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with ScreenCastModeView */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <ScreenCastModeView />
        </div>
      </div>
    </div>
  );
};
