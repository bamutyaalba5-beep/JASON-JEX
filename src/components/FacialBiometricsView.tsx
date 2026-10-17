import React, { useState } from 'react';
import { EnrolledProfile, FacialBiometricResult } from '../types';
import {
  ScanFace,
  UserCheck,
  UserX,
  UserPlus,
  Shield,
  ShieldAlert,
  Clock,
  Sparkles,
  Camera,
  Upload,
  Check,
  Eye,
  Trash2,
} from 'lucide-react';

interface FacialBiometricsViewProps {
  enrolledProfiles: EnrolledProfile[];
  onAddProfile: (profile: EnrolledProfile) => void;
  onDeleteProfile: (id: string) => void;
  recentResults: FacialBiometricResult[];
  onTriggerAlarm: (reason: string, details?: string, facialResult?: FacialBiometricResult, snapshot?: string) => void;
}

export const FacialBiometricsView: React.FC<FacialBiometricsViewProps> = ({
  enrolledProfiles,
  onAddProfile,
  onDeleteProfile,
  recentResults,
  onTriggerAlarm,
}) => {
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<EnrolledProfile['relationship']>('Family Member');
  const [clearanceLevel, setClearanceLevel] = useState<EnrolledProfile['clearanceLevel']>('LEVEL_1_UNRESTRICTED');
  const [notes, setNotes] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ENROLLED' | 'VISITOR_LOGS'>('ENROLLED');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: EnrolledProfile = {
      id: `prof-${Date.now().toString(36)}`,
      name: name.trim(),
      relationship,
      clearanceLevel,
      enrolledAt: new Date().toISOString().split('T')[0],
      notes: notes.trim() || 'Enrolled authorized profile.',
      accessCount: 0,
      lastSeen: 'Just enrolled',
      photoBase64: photoPreview,
    };

    onAddProfile(newProfile);
    setName('');
    setNotes('');
    setPhotoPreview('');
    setShowEnrollModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-400">
            <ScanFace className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span>BIOMETRIC FACIAL INTELLIGENCE CENTER</span>
              <span className="rounded border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono-code font-normal text-emerald-300">
                POWERED BY GEMINI 2.5 FLASH VISION
              </span>
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Enrolled Authorized Individuals vs Unknown & Suspicious Visitors • Real-time Classification
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600/80 bg-emerald-950/80 px-3 py-1.5 text-xs font-mono-code font-bold text-emerald-200 transition-colors hover:bg-emerald-800 hover:text-white"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>ENROLL NEW INDIVIDUAL</span>
          </button>
        </div>
      </div>

      {/* TABS: ENROLLED PROFILES vs VISITOR DETECTION LOGS */}
      <div className="flex items-center gap-2 border-b border-sky-900/40 pb-2">
        <button
          onClick={() => setActiveTab('ENROLLED')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono-code font-semibold transition-colors ${
            activeTab === 'ENROLLED'
              ? 'bg-sky-900/60 text-sky-200 border border-sky-500/50'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>ENROLLED RECOGNIZED INDIVIDUALS ({enrolledProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VISITOR_LOGS')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono-code font-semibold transition-colors ${
            activeTab === 'VISITOR_LOGS'
              ? 'bg-sky-900/60 text-sky-200 border border-sky-500/50'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>REAL-TIME VISITOR LOGS ({recentResults.length})</span>
        </button>
      </div>

      {/* ENROLLED PROFILES GRID */}
      {activeTab === 'ENROLLED' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledProfiles.map((prof) => (
            <div
              key={prof.id}
              className="flex flex-col justify-between rounded-xl border border-sky-900/40 bg-[#07111c] p-4 transition-all hover:border-sky-700/60"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-sky-800/40 bg-[#0a1829] text-sky-300 font-bold font-exo text-sm overflow-hidden">
                      {prof.photoBase64 ? (
                        <img
                          src={prof.photoBase64}
                          alt={prof.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        prof.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      )}
                    </div>
                    <div>
                      <h4 className="font-exo font-bold text-sm text-slate-100">{prof.name}</h4>
                      <div className="text-[11px] font-mono-code text-sky-400">{prof.relationship}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteProfile(prof.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Remove enrolled individual"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 space-y-1.5 text-xs font-mono-code">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">CLEARANCE:</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        prof.clearanceLevel === 'LEVEL_1_UNRESTRICTED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                      }`}
                    >
                      {prof.clearanceLevel.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ACCESS COUNT:</span>
                    <span className="text-slate-200">{prof.accessCount} visits logged</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">LAST SEEN:</span>
                    <span className="text-slate-300">{prof.lastSeen || 'Active'}</span>
                  </div>
                  {prof.notes && (
                    <div className="mt-2 rounded bg-[#040912] p-2 text-[11px] text-slate-400 leading-snug">
                      "{prof.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-sky-950/60 pt-2 text-[10px] font-mono-code text-slate-500">
                <span>ENROLLED: {prof.enrolledAt}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="h-3 w-3" /> VERIFIED
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISITOR DETECTION LOGS (RECOGNIZED vs UNKNOWN vs SUSPICIOUS) */}
      {activeTab === 'VISITOR_LOGS' && (
        <div className="space-y-3">
          {recentResults.length === 0 ? (
            <div className="rounded-xl border border-sky-950 bg-[#07111c] p-8 text-center text-slate-400 font-mono-code text-xs">
              <Eye className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              No visitor events registered yet. Point the live camera towards a face or click "SCAN BIOMETRICS" in the monitor tab.
            </div>
          ) : (
            recentResults.map((result, idx) => (
              <div
                key={idx}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border p-4 font-mono-code text-xs ${
                  result.status === 'RECOGNIZED_AUTHORIZED'
                    ? 'border-emerald-900/50 bg-[#061413]'
                    : result.status === 'SUSPICIOUS_INTRUDER'
                    ? 'border-red-600/70 bg-[#1d070d] shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'border-amber-900/50 bg-[#141207]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.snapshotBase64 ? (
                    <img
                      src={result.snapshotBase64}
                      alt="Visitor"
                      className="h-16 w-16 rounded-lg object-cover border border-sky-800/40"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-700 bg-slate-800">
                      <ScanFace className="h-8 w-8 text-slate-400" />
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          result.status === 'RECOGNIZED_AUTHORIZED'
                            ? 'bg-emerald-900/80 text-emerald-300'
                            : result.status === 'SUSPICIOUS_INTRUDER'
                            ? 'bg-red-900 text-red-200'
                            : 'bg-amber-900/80 text-amber-300'
                        }`}
                      >
                        {result.status.replace(/_/g, ' ')}
                      </span>
                      <span className="font-exo font-bold text-sm text-white">
                        {result.recognizedPersonName || 'Unknown Individual'}
                      </span>
                      <span className="text-slate-400">• Match Confidence: {result.confidence}%</span>
                    </div>

                    <p className="mt-1 text-slate-300 leading-snug">{result.tacticalSummary}</p>

                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-400">
                      {result.attributes?.expression && <span>Expression: {result.attributes.expression}</span>}
                      {result.attributes?.estimatedAgeRange && <span>• Age: {result.attributes.estimatedAgeRange}</span>}
                      {result.attributes?.clothingDescription && (
                        <span>• Attire: {result.attributes.clothingDescription}</span>
                      )}
                      <span>• Timestamp: {new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tactical Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {result.status !== 'RECOGNIZED_AUTHORIZED' && (
                    <>
                      <button
                        onClick={() => {
                          setName(result.recognizedPersonName || 'Visitor');
                          setPhotoPreview(result.snapshotBase64 || '');
                          setShowEnrollModal(true);
                        }}
                        className="rounded border border-sky-700 bg-sky-950/80 px-2.5 py-1 text-[11px] text-sky-300 hover:bg-sky-900"
                      >
                        ENROLL FACE
                      </button>
                      <button
                        onClick={() =>
                          onTriggerAlarm(
                            'UNKNOWN_VISITOR_FLAG',
                            `Operator raised alarm for visitor: ${result.tacticalSummary}`,
                            result,
                            result.snapshotBase64
                          )
                        }
                        className="rounded border border-red-600 bg-red-950 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-900"
                      >
                        ALERT AUTHORITIES
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ENROLLMENT MODAL */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-sky-500/40 bg-[#071424] p-5 font-mono-code text-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-sky-900/60 pb-3">
              <div className="flex items-center gap-2 font-exo text-base font-bold text-emerald-400">
                <UserPlus className="h-5 w-5" />
                <span>ENROLL NEW AUTHORIZED INDIVIDUAL</span>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEnrollment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-sky-400">FULL NAME:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="mt-1 w-full rounded border border-sky-900/60 bg-[#030811] px-3 py-2 text-white outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-sky-400">RELATIONSHIP / ROLE:</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as any)}
                    className="mt-1 w-full rounded border border-sky-900/60 bg-[#030811] px-3 py-2 text-white outline-none"
                  >
                    <option value="Family Member">Family Member</option>
                    <option value="Resident">Resident</option>
                    <option value="Security Staff">Security Staff</option>
                    <option value="Authorized Visitor">Authorized Visitor</option>
                    <option value="Delivery/Courier">Delivery / Courier</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-sky-400">CLEARANCE LEVEL:</label>
                  <select
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(e.target.value as any)}
                    className="mt-1 w-full rounded border border-sky-900/60 bg-[#030811] px-3 py-2 text-white outline-none"
                  >
                    <option value="LEVEL_1_UNRESTRICTED">Level 1 - Unrestricted</option>
                    <option value="LEVEL_2_ESCORT_REQUIRED">Level 2 - Escort Required</option>
                    <option value="LEVEL_3_LIMITED_HOURS">Level 3 - Limited Hours (Daytime)</option>
                    <option value="RESTRICTED">Restricted (Flag on sight)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-400">PHOTO ENROLLMENT:</label>
                <div className="mt-1 flex items-center gap-3">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-16 w-16 rounded-lg object-cover border border-emerald-500/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-700 bg-[#030912] text-slate-500">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-sky-800 bg-[#030811] p-2 text-center text-[11px] text-sky-300 hover:border-sky-500">
                      <Upload className="h-4 w-4" />
                      <span>Upload reference portrait photo</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-400">SECURITY NOTES / PROTOCOL:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Authorized keyholder. Chime greeting on arrival."
                  className="mt-1 w-full rounded border border-sky-900/60 bg-[#030811] px-3 py-2 text-white outline-none focus:border-sky-400"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-sky-950/80 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="rounded border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-300 hover:bg-slate-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  SAVE ENROLLMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
