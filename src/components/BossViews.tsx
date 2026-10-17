import React, { useState } from 'react';
import {
  UserAccount,
  CameraDevice,
  AuditLogEntry,
  DefconLevel,
  AiCrimeDetectionSettings,
} from '../types';
import {
  Users,
  HardDrive,
  Sliders,
  FileCheck,
  ShieldAlert,
  Plus,
  Battery,
  Wifi,
  Shield,
  Trash2,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  Clock,
  Database,
  RefreshCw,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

// ================= ACCOUNTS & USERS =================
export const AccountsView: React.FC<{
  users: UserAccount[];
  onAddUser: (user: UserAccount) => void;
}> = ({ users, onAddUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserAccount['role']>('OPERATOR');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newUser: UserAccount = {
      id: `u-${Date.now().toString(36)}`,
      username: name.toLowerCase().replace(/\s+/g, '_'),
      name: name.trim(),
      role,
      title: `${role} Personnel`,
      accountId: 'acc-site-01',
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@sentinelarc.secure`,
      phone: '+1 555-0100',
      twoFactorEnabled: true,
      avatarInitials: name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2),
    };
    onAddUser(newUser);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-4 font-mono-code text-xs">
      <div className="flex items-center justify-between rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3">
        <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
          <Users className="h-5 w-5 text-sky-400" />
          <span>USER & ACCOUNT CREDENTIAL MANAGEMENT</span>
        </div>
        <span className="text-[11px] text-slate-400">{users.length} Active Accounts</span>
      </div>

      {/* Add User Form */}
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 rounded-xl border border-sky-950 bg-[#07111c] p-3">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-sky-900/60 bg-[#030811] px-3 py-1.5 text-white outline-none"
          required
        />
        <input
          type="email"
          placeholder="Official Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-sky-900/60 bg-[#030811] px-3 py-1.5 text-white outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="rounded border border-sky-900/60 bg-[#030811] px-3 py-1.5 text-white outline-none"
        >
          <option value="OPERATOR">Operator</option>
          <option value="ADMIN">Admin</option>
          <option value="AUTHORITY">Authority / 911</option>
          <option value="VIEWER">Viewer</option>
          <option value="BOSS">Boss</option>
        </select>
        <button type="submit" className="flex items-center gap-1 rounded bg-sky-700 px-3 py-1.5 font-bold text-white hover:bg-sky-600">
          <Plus className="h-4 w-4" /> ADD USER
        </button>
      </form>

      {/* Users Table */}
      <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-sky-950 text-[11px] text-slate-400 uppercase">
            <tr>
              <th className="py-2">NAME</th>
              <th className="py-2">ROLE</th>
              <th className="py-2">EMAIL</th>
              <th className="py-2">2FA</th>
              <th className="py-2 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-950/50 text-slate-300">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-900/40">
                <td className="py-2.5 font-bold text-white">{u.name}</td>
                <td className="py-2.5">
                  <span className="rounded bg-sky-950 px-2 py-0.5 text-[10px] text-sky-300 border border-sky-800">
                    {u.role}
                  </span>
                </td>
                <td className="py-2.5 text-slate-400">{u.email}</td>
                <td className="py-2.5">{u.twoFactorEnabled ? 'ENFORCED' : 'OPTIONAL'}</td>
                <td className="py-2.5 text-right text-emerald-400">ACTIVE</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ================= CAMERAS & HARDWARE =================
export const DevicesView: React.FC<{
  cameras: CameraDevice[];
}> = ({ cameras }) => {
  return (
    <div className="space-y-4 font-mono-code text-xs">
      <div className="flex items-center justify-between rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3">
        <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
          <HardDrive className="h-5 w-5 text-sky-400" />
          <span>CONNECTED HARDWARE SENSORS & CAMERAS</span>
        </div>
        <span className="text-[11px] text-slate-400">{cameras.length} Nodes Online</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cameras.map((cam) => (
          <div key={cam.id} className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4">
            <div className="flex items-center justify-between">
              <span className="font-exo font-bold text-sm text-slate-100">{cam.name}</span>
              <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                {cam.status}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-slate-400 text-[11px]">
              <div>Type: <span className="text-slate-200">{cam.type.replace(/_/g, ' ')}</span></div>
              <div>Location: <span className="text-slate-200">{cam.location}</span></div>
              <div>Profile: <span className="text-sky-300">{cam.resolution} • {cam.fps} FPS</span></div>
              {cam.connectedDeviceSettings && (
                <div className="rounded bg-[#040810] p-2 border border-sky-950 text-[10px] space-y-0.5 mt-1">
                  <div>Hardware Model: <span className="text-white font-bold">{cam.connectedDeviceSettings.deviceModel}</span></div>
                  <div>Manufacturer: <span className="text-sky-300">{cam.connectedDeviceSettings.manufacturer}</span></div>
                  <div>Transport: <span className="text-emerald-400">{cam.connectedDeviceSettings.connectionMethod}</span></div>
                </div>
              )}
              {cam.batteryLevel !== undefined && (
                <div className="flex items-center gap-1 text-emerald-400 pt-1">
                  <Battery className="h-3.5 w-3.5" /> Battery: {cam.batteryLevel}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================= ALARM RULES & SENSITIVITY =================
export const AlarmRulesView: React.FC<{
  aiSettings?: AiCrimeDetectionSettings;
  onNavigateToAiTraining?: () => void;
}> = ({ aiSettings, onNavigateToAiTraining }) => {
  const [motionThreshold, setMotionThreshold] = useState<number>(30);
  const [autoSiren, setAutoSiren] = useState<boolean>(true);
  const [policeRelay, setPoliceRelay] = useState<boolean>(true);

  return (
    <div className="space-y-4 font-mono-code text-xs">
      <div className="rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3">
        <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
          <Sliders className="h-5 w-5 text-sky-400" />
          <span>AUTONOMOUS ALARM & RESPONSE LOGIC</span>
        </div>
      </div>

      {/* AI Crime Training Rules Quick Callout */}
      {onNavigateToAiTraining && (
        <div className="rounded-xl border border-amber-900/60 bg-gradient-to-r from-amber-950/40 to-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2 border border-amber-500/40">
                <BrainCircuit className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <span>AI CRIME & COMMUNITY RULES ENGINE</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 border border-amber-500/30">
                    MASTER COMMANDER
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Situational Study Window: <strong className="text-amber-300">{aiSettings?.temporalStudyWindowSeconds || 4.5}s</strong> •
                  Trained Rules: <strong className="text-sky-300">{aiSettings?.trainingItems?.length || 4} modules active</strong>
                </div>
              </div>
            </div>
            <button
              onClick={onNavigateToAiTraining}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <span>CONFIGURE AI DETECTION & TRAINING</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-sky-950 bg-[#07111c] p-4 space-y-4">
        <div>
          <label className="block font-bold text-sky-400">GLOBAL MOTION TRIGGER SENSITIVITY FLOOR: {motionThreshold}%</label>
          <input
            type="range"
            min="10"
            max="60"
            value={motionThreshold}
            onChange={(e) => setMotionThreshold(Number(e.target.value))}
            className="mt-2 w-full accent-sky-400"
          />
        </div>

        <div className="flex items-center justify-between border-t border-sky-950 pt-3">
          <div>
            <div className="font-bold text-slate-200">AUTO-ENGAGE PHYSICAL SIREN ON SUSPICIOUS INTRUDER</div>
            <div className="text-[11px] text-slate-400">Fires 120dB audible deterrent when AI biometric detects threat score &gt; 80</div>
          </div>
          <input
            type="checkbox"
            checked={autoSiren}
            onChange={(e) => setAutoSiren(e.target.checked)}
            className="h-4 w-4 accent-sky-400"
          />
        </div>

        <div className="flex items-center justify-between border-t border-sky-950 pt-3">
          <div>
            <div className="font-bold text-slate-200">DIRECT ENCRYPTED RELAY TO 911 AUTHORITIES</div>
            <div className="text-[11px] text-slate-400">Transmits encrypted coordinates, clip hashes, and biometric tags to police dispatch</div>
          </div>
          <input
            type="checkbox"
            checked={policeRelay}
            onChange={(e) => setPoliceRelay(e.target.checked)}
            className="h-4 w-4 accent-sky-400"
          />
        </div>
      </div>
    </div>
  );
};

// ================= AUDIT LOG =================
export const AuditLogView: React.FC<{
  logs: AuditLogEntry[];
  onPurgeLocalData?: () => void;
}> = ({ logs, onPurgeLocalData }) => {
  return (
    <div className="space-y-4 font-mono-code text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3">
        <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
          <FileCheck className="h-5 w-5 text-emerald-400" />
          <span>CRYPTOGRAPHIC TAMPER-PROOF AUDIT TRAIL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">RFC 6962 SHA-256 Ledger ({logs.length} records)</span>
          {onPurgeLocalData && (
            <button
              onClick={onPurgeLocalData}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-950/60 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-900 transition-all"
              title="Purge audit logs and reset local storage"
            >
              <Trash2 className="h-3 w-3 text-red-400" />
              <span>PURGE LOCAL LOGS</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-sky-950 bg-[#07111c] p-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-sky-950 text-[11px] text-slate-400 uppercase">
            <tr>
              <th className="py-2">TIMESTAMP</th>
              <th className="py-2">USER / ACTOR</th>
              <th className="py-2">ACTION</th>
              <th className="py-2">TARGET</th>
              <th className="py-2">SHA-256 HASH</th>
              <th className="py-2 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-950/50 text-slate-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                  NO AUDIT RECORDS FOUND • LEDGER PRISTINE OR PURGED
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 text-slate-400">{log.timestamp}</td>
                  <td className="py-2.5 font-bold text-sky-400">{log.user}</td>
                  <td className="py-2.5">{log.action}</td>
                  <td className="py-2.5 text-slate-300">{log.target}</td>
                  <td className="py-2.5 font-mono text-[10px] text-slate-500 max-w-xs truncate">{log.hash}</td>
                  <td className="py-2.5 text-right text-emerald-400">{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ================= SECURITY CENTER & DEFCON =================
export const SecurityCenterView: React.FC<{
  defcon: DefconLevel;
  onSetDefcon: (level: DefconLevel) => void;
  onPurgeLocalData?: () => void;
  auditLogCount?: number;
  biometricCacheCount?: number;
}> = ({ defcon, onSetDefcon, onPurgeLocalData, auditLogCount = 0, biometricCacheCount = 0 }) => {
  const levels: DefconLevel[] = ['DEFCON_4', 'DEFCON_3', 'DEFCON_2', 'DEFCON_1', 'PANIC_0'];
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [purgeSuccess, setPurgeSuccess] = useState<boolean>(false);

  const handleConfirmPurge = () => {
    if (onPurgeLocalData) {
      onPurgeLocalData();
      setShowConfirmModal(false);
      setPurgeSuccess(true);
      setTimeout(() => setPurgeSuccess(false), 6000);
    }
  };

  return (
    <div className="space-y-4 font-mono-code text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3">
        <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <span>TACTICAL SECURITY CENTER & DEFCON CONTROLS</span>
        </div>

        {onPurgeLocalData && (
          <button
            onClick={() => setShowConfirmModal(true)}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-red-500/60 bg-red-950/80 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900 transition-all shadow-[0_0_12px_rgba(239,68,68,0.3)]"
            title="Purge audit logs and reset local biometric temporary cache"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            <span>PURGE LOCAL DATA</span>
          </button>
        )}
      </div>

      {purgeSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-950/90 p-4 text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-bold">System state refreshed: Audit log history cleared and local biometric temporary storage reset.</span>
        </div>
      )}

      {/* DEFCON SELECTOR MATRIX */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {levels.map((lvl) => {
          const isSelected = defcon === lvl;
          return (
            <button
              key={lvl}
              onClick={() => onSetDefcon(lvl)}
              className={`rounded-xl border p-4 text-center transition-all ${
                isSelected
                  ? lvl === 'PANIC_0'
                    ? 'border-red-500 bg-red-600 text-white font-bold animate-bounce'
                    : 'border-sky-400 bg-sky-950 text-white font-bold shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                  : 'border-sky-950 bg-[#07111c] text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="font-exo text-sm">{lvl.replace(/_/g, ' ')}</div>
            </button>
          );
        })}
      </div>

      {/* THREAT INTENSITY 24-HOUR TREND GRAPH */}
      <div className="rounded-xl border border-sky-900/50 bg-[#071322] p-5 shadow-[0_0_20px_rgba(14,165,233,0.15)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-exo text-sm font-bold text-sky-200">
            <Activity className="h-4 w-4 text-sky-400" />
            <span>THREAT INTENSITY & INCIDENT FREQUENCY (LAST 24 HOURS)</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Real-time telemetry: Motion events, Biometric Unknowns, Alarm Triggers
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={[
                { time: '00:00', motionEvents: 3, unknownDetections: 0, alarmTriggers: 0 },
                { time: '03:00', motionEvents: 1, unknownDetections: 0, alarmTriggers: 0 },
                { time: '06:00', motionEvents: 6, unknownDetections: 1, alarmTriggers: 0 },
                { time: '09:00', motionEvents: 18, unknownDetections: 3, alarmTriggers: 1 },
                { time: '12:00', motionEvents: 14, unknownDetections: 2, alarmTriggers: 0 },
                { time: '15:00', motionEvents: 22, unknownDetections: 5, alarmTriggers: 1 },
                { time: '18:00', motionEvents: 12, unknownDetections: 2, alarmTriggers: 0 },
                { time: '21:00', motionEvents: 25, unknownDetections: 7, alarmTriggers: 2 },
                { time: '24:00', motionEvents: 8, unknownDetections: 1, alarmTriggers: 0 },
              ]}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#091322', borderColor: '#0369a1', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="motionEvents" name="Motion Events" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="unknownDetections" name="Biometric Unknowns" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="alarmTriggers" name="Alarm Triggers" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SYSTEM RESILIENCE & LOCAL VOLATILE STORAGE PURGE SECTION */}
      {onPurgeLocalData && (
        <div className="rounded-xl border border-red-900/60 bg-gradient-to-r from-red-950/30 via-[#071322] to-slate-900/40 p-5 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2 font-exo text-sm font-bold text-red-400">
                <Database className="h-4 w-4 text-red-400" />
                <span>LOCAL AUDIT HISTORY & BIOMETRIC TEMPORARY STORAGE PURGE</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Clears all audit log entries, resets transient facial biometric recognition buffers, and flushes temporary memory caches to refresh the system operational state.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400">
                <span className="rounded border border-slate-800 bg-[#030912] px-2 py-0.5">
                  Audit History Entries: <strong className="text-sky-300">{auditLogCount}</strong>
                </span>
                <span className="rounded border border-slate-800 bg-[#030912] px-2 py-0.5">
                  Temporary Biometric Buffers: <strong className="text-amber-300">{biometricCacheCount}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              type="button"
              className="flex items-center gap-2 rounded-xl border border-red-500 bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              <RefreshCw className="h-4 w-4" />
              <span>PURGE LOCAL DATA</span>
            </button>
          </div>
        </div>
      )}

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
              This will refresh the system state, clear {auditLogCount} audit records, and flush temporary facial buffers.
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
    </div>
  );
};
