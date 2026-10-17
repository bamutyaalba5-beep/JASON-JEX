import React, { useState } from 'react';
import { FileText, Shield, Key, Video, Bell, Siren, Lock, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Database } from 'lucide-react';

interface DocumentationViewProps {
  onPurgeLocalData?: () => void;
  auditLogCount?: number;
  biometricCacheCount?: number;
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({
  onPurgeLocalData,
  auditLogCount = 0,
  biometricCacheCount = 0,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [purgedMessage, setPurgedMessage] = useState<string | null>(null);

  const handleConfirmPurge = () => {
    if (onPurgeLocalData) {
      onPurgeLocalData();
      setShowConfirmModal(false);
      setPurgedMessage('System state refreshed: Audit log history cleared and local biometric temporary storage purged.');
      setTimeout(() => setPurgedMessage(null), 6000);
    }
  };

  return (
    <div className="space-y-4 font-mono-code text-xs text-slate-300">
      {/* HEADER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span>SENTINEL ARC PROTOCOL DOCUMENTATION & OPERATIONAL MANUAL</span>
            </div>
            <div className="text-slate-400">
              Military-Grade Physical Surveillance • Biometric Vision Intelligence • Real-World Authorities SOS
            </div>
          </div>
        </div>

        {/* Quick Purge Action in Header */}
        <button
          onClick={() => setShowConfirmModal(true)}
          type="button"
          className="flex items-center gap-2 rounded-lg border border-red-500/60 bg-red-950/80 px-3.5 py-2 font-mono-code text-xs font-bold text-red-300 hover:bg-red-900 transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)]"
          title="Clear audit log history and reset local biometric temporary storage"
        >
          <Trash2 className="h-4 w-4 text-red-400" />
          <span>PURGE LOCAL DATA</span>
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {purgedMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-950/90 p-4 text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="font-bold">{purgedMessage}</div>
        </div>
      )}

      {/* SYSTEM RESILIENCE & LOCAL STORAGE MANAGEMENT CARD */}
      <div className="rounded-xl border border-red-900/60 bg-gradient-to-r from-red-950/30 via-[#071322] to-slate-900/40 p-5 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 font-exo text-sm font-bold text-red-400">
              <Database className="h-4 w-4 text-red-400" />
              <span>SYSTEM MEMORY & LOCAL VOLATILE STORAGE MAINTENANCE</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Purges local audit log entries from memory, clears client-side temporary biometric face detection buffers, and flushes session caches to reset the system state back to initial genesis baseline without affecting enrolled user credentials.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400">
              <span className="rounded border border-slate-800 bg-[#030912] px-2 py-0.5">
                Audit History Records: <strong className="text-sky-300">{auditLogCount}</strong>
              </span>
              <span className="rounded border border-slate-800 bg-[#030912] px-2 py-0.5">
                Temp Biometric Records: <strong className="text-amber-300">{biometricCacheCount}</strong>
              </span>
              <span className="rounded border border-slate-800 bg-[#030912] px-2 py-0.5 text-emerald-400">
                Status: Operational
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            type="button"
            className="flex items-center gap-2 rounded-xl border border-red-500 bg-red-600/90 px-4 py-2.5 font-exo text-sm font-bold text-white hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>PURGE LOCAL DATA</span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-red-500/60 bg-[#0a1422] p-5 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
            <div className="flex items-center gap-2 text-red-400 font-exo font-bold text-base mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-bounce" />
              <span>CONFIRM LOCAL DATA PURGE</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to clear the audit log history and reset local biometric temporary storage?
              This will refresh the system state, clear {auditLogCount} audit records, and flush all cached facial recognition telemetry.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmPurge}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-red-500 bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500 shadow-md"
              >
                <Trash2 className="h-4 w-4" />
                <span>CONFIRM PURGE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL SECTIONS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 space-y-2">
          <div className="flex items-center gap-2 font-exo text-sm font-bold text-sky-400">
            <Video className="h-4 w-4" />
            <span>1. HARDWARE INTEGRATION & SENSORS</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            SENTINEL ARC connects directly to physical device cameras using standard WebRTC MediaDevices API. It supports USB webcams, phone cameras via QR pairing token, and network RTSP/IP CCTV streams. No simulation is permitted; live frames are analyzed directly.
          </p>
        </div>

        <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 space-y-2">
          <div className="flex items-center gap-2 font-exo text-sm font-bold text-emerald-400">
            <Shield className="h-4 w-4" />
            <span>2. GEMINI 2.5 FLASH BIOMETRIC RECOGNITION</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Frames are streamed to the backend visual intelligence engine powered by Gemini 2.5 Flash. Faces are classified into Authorized Enrolled Individuals vs Unknown Visitors vs Suspicious Intruders with estimated demeanor, threat index, and facial attributes.
          </p>
        </div>

        <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 space-y-2">
          <div className="flex items-center gap-2 font-exo text-sm font-bold text-amber-400">
            <Lock className="h-4 w-4" />
            <span>3. AES-256-GCM VAULT & SHA-256 LEDGER</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            All captured security clips are encrypted client-side using Web Crypto API AES-256-GCM with a unique 12-byte initialization vector. Hash chaining with SHA-256 links each clip back to the Genesis Root for tamper-evident court admissibility.
          </p>
        </div>

        <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 space-y-2">
          <div className="flex items-center gap-2 font-exo text-sm font-bold text-red-400">
            <Siren className="h-4 w-4" />
            <span>4. REAL AUTHORITIES & EMERGENCY PROTOCOLS</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            In emergency situations (DEFCON 1 or Panic SOS), the system dispatches real emergency alerts: direct 911 police calls via telecommunication routing, encrypted SMS to armed tactical patrols, and encrypted WhatsApp responder dossiers with coordinates.
          </p>
        </div>
      </div>
    </div>
  );
};
