import React, { useState } from 'react';
import { EncryptedVideoClip, UserAccount } from '../types';
import { decryptClip } from '../utils/security';
import {
  Clock,
  Play,
  Download,
  ShieldCheck,
  Filter,
  Video,
  FileText,
  UserCheck,
  UserX,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';

interface EventsViewProps {
  clips: EncryptedVideoClip[];
  currentUser: UserAccount;
}

export const EventsView: React.FC<EventsViewProps> = ({ clips, currentUser }) => {
  const [selectedClip, setSelectedClip] = useState<EncryptedVideoClip | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [filterCamera, setFilterCamera] = useState<string>('ALL');
  const [filterThreat, setFilterThreat] = useState<string>('ALL');

  const filteredClips = clips.filter((c) => {
    if (filterCamera !== 'ALL' && c.cameraName !== filterCamera) return false;
    if (filterThreat !== 'ALL' && c.threatLevel !== filterThreat) return false;
    return true;
  });

  const uniqueCameras = Array.from(new Set(clips.map((c) => c.cameraName)));

  const handlePlayClip = async (clip: EncryptedVideoClip) => {
    setSelectedClip(clip);
    setIsDecrypting(true);
    try {
      const { blobUrl } = await decryptClip(clip.dataBase64, clip.ivHex, clip.mimeType);
      setDecryptedUrl(blobUrl);
    } catch (err) {
      console.warn('Decryption notice:', err);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleClosePlayer = () => {
    if (decryptedUrl) {
      URL.revokeObjectURL(decryptedUrl);
      setDecryptedUrl(null);
    }
    setSelectedClip(null);
  };

  return (
    <div className="space-y-4">
      {/* HEADER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span>RECORDED SECURITY FOOTAGE & VAULT EVENTS</span>
              <span className="rounded border border-sky-500/40 bg-sky-950/60 px-2 py-0.5 text-[10px] font-mono-code font-normal text-sky-300">
                AES-256-GCM ENCRYPTED
              </span>
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Cryptographically Encrypted Video Clips • SHA-256 Hash Chained For Legal Court Admissibility
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-sky-950/80 px-3 py-1.5 text-xs font-mono-code text-sky-300 border border-sky-800/40">
            TOTAL CLIPS: <strong className="text-white">{clips.length}</strong>
          </span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-950 bg-[#060e18] p-3 text-xs font-mono-code">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="h-3.5 w-3.5 text-sky-400" />
            <span>FILTER CAMERA:</span>
          </div>
          <select
            value={filterCamera}
            onChange={(e) => setFilterCamera(e.target.value)}
            className="rounded border border-sky-900/60 bg-[#0b1726] px-2.5 py-1 text-slate-200 outline-none"
          >
            <option value="ALL">All Cameras</option>
            {uniqueCameras.map((cam) => (
              <option key={cam} value={cam}>
                {cam}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>THREAT:</span>
          </div>
          <select
            value={filterThreat}
            onChange={(e) => setFilterThreat(e.target.value)}
            className="rounded border border-sky-900/60 bg-[#0b1726] px-2.5 py-1 text-slate-200 outline-none"
          >
            <option value="ALL">All Threats</option>
            <option value="DEFCON_4_NORMAL">Defcon 4 Normal</option>
            <option value="DEFCON_3_ELEVATED">Defcon 3 Elevated</option>
            <option value="DEFCON_2_HIGH">Defcon 2 High</option>
            <option value="DEFCON_1_CRITICAL">Defcon 1 Critical</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Showing {filteredClips.length} of {clips.length} recorded clips
        </div>
      </div>

      {/* CLIPS GRID */}
      {filteredClips.length === 0 ? (
        <div className="rounded-xl border border-sky-950 bg-[#07111c] p-12 text-center text-slate-400 font-mono-code text-xs">
          <Video className="h-10 w-10 mx-auto mb-3 text-slate-600" />
          No recorded security clips match this filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClips.map((clip) => (
            <div
              key={clip.id}
              className="flex flex-col justify-between rounded-xl border border-sky-900/40 bg-[#07111c] p-4 transition-all hover:border-sky-700/60"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-sky-950/80 px-2 py-0.5 text-[10px] font-mono-code font-bold text-sky-300 border border-sky-800/40">
                        {clip.triggerReason}
                      </span>
                      {clip.facialTag && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            clip.facialTag === 'RECOGNIZED_AUTHORIZED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {clip.personName ? `ID: ${clip.personName}` : clip.facialTag}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1 font-exo font-bold text-sm text-slate-100">{clip.cameraName}</h4>
                  </div>

                  <span className="text-[10px] font-mono-code text-slate-400">
                    {new Date(clip.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Cryptographic SHA-256 Hash Tag */}
                <div className="mt-3 rounded bg-[#030811] p-2 font-mono-code text-[10px]">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> SHA-256 AUDIT HASH:
                    </span>
                    <span className="text-slate-500">{(clip.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="truncate text-slate-300">{clip.sha256Hash}</div>
                </div>
              </div>

              {/* Action Buttons: Play & Decrypt */}
              <div className="mt-4 flex items-center justify-between border-t border-sky-950/60 pt-3">
                <button
                  onClick={() => handlePlayClip(clip)}
                  className="flex items-center gap-1.5 rounded-lg border border-sky-600 bg-sky-950/80 px-3 py-1.5 text-xs font-mono-code font-bold text-sky-200 transition-colors hover:bg-sky-800"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>DECRYPT & PLAY</span>
                </button>

                <span className="text-[10px] font-mono-code text-slate-500">
                  {new Date(clip.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIDEO PLAYER & DECRYPTION MODAL */}
      {selectedClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-xl border border-sky-500/50 bg-[#071424] p-5 font-mono-code text-slate-200 shadow-[0_0_50px_rgba(0,0,0,0.95)]">
            <div className="flex items-center justify-between border-b border-sky-900/60 pb-3">
              <div className="flex items-center gap-2 font-exo text-base font-bold text-sky-300">
                <Unlock className="h-5 w-5 text-emerald-400" />
                <span>SECURE FOOTAGE DECRYPTION & PLAYBACK</span>
              </div>
              <button
                onClick={handleClosePlayer}
                className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black flex items-center justify-center border border-sky-900/80">
                {isDecrypting ? (
                  <div className="text-center text-sky-400 text-xs animate-pulse">
                    <Lock className="h-8 w-8 mx-auto mb-2" />
                    Executing in-memory Web Crypto AES-256-GCM envelope decryption...
                  </div>
                ) : decryptedUrl ? (
                  <video
                    src={decryptedUrl}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-red-400 text-xs">Failed to load clip stream.</div>
                )}
              </div>

              {/* Clip Metadata Dossier */}
              <div className="rounded-lg border border-sky-950 bg-[#030811] p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">CAMERA:</span>
                  <span className="text-white font-bold">{selectedClip.cameraName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RECORDED AT:</span>
                  <span className="text-slate-300">{new Date(selectedClip.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TRIGGER REASON:</span>
                  <span className="text-sky-300">{selectedClip.triggerReason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SHA-256 HASH:</span>
                  <span className="text-emerald-400 truncate max-w-xs">{selectedClip.sha256Hash}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {decryptedUrl && (
                  <a
                    href={decryptedUrl}
                    download={`SENTINEL-CLIP-${selectedClip.id}.webm`}
                    className="flex items-center gap-1.5 rounded border border-sky-700 bg-sky-950 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-900"
                  >
                    <Download className="h-3.5 w-3.5" /> DOWNLOAD EVIDENCE CLIP
                  </a>
                )}
                <button
                  onClick={handleClosePlayer}
                  className="rounded border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 ml-auto"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
