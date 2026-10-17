import React from 'react';
import { UserAccount, DefconLevel } from '../types';
import { Shield, ShieldAlert, Lock, LogOut, Radio, Copy, Check, PhoneCall, Smartphone, Download, Cast } from 'lucide-react';

interface TopBarProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  defcon: DefconLevel;
  onTriggerPanic: () => void;
  isAlarmRinging: boolean;
  onToggleSilenceAlarm: () => void;
  isCurtainLocked: boolean;
  onToggleCurtainLock: () => void;
  onOpenSosModal?: () => void;
  onOpenCastMode?: () => void;
  contactsCount?: number;
  onOpenEmergencyContactsPrompt?: () => void;
  isInstalled?: boolean;
  isInstallable?: boolean;
  onInstallApp?: () => Promise<boolean>;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  defcon,
  onTriggerPanic,
  isAlarmRinging,
  onToggleSilenceAlarm,
  isCurtainLocked,
  onToggleCurtainLock,
  onOpenSosModal,
  onOpenCastMode,
  contactsCount = 0,
  onOpenEmergencyContactsPrompt,
  isInstalled = false,
  isInstallable = false,
  onInstallApp,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const defconDisplay = {
    DEFCON_4: { label: 'DEFCON 4 / NORMAL', color: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' },
    DEFCON_3: { label: 'DEFCON 3 / ELEVATED', color: 'bg-amber-950/80 border-amber-500/40 text-amber-400' },
    DEFCON_2: { label: 'DEFCON 2 / HIGH', color: 'bg-orange-950/80 border-orange-500/40 text-orange-400' },
    DEFCON_1: { label: 'DEFCON 1 / CRITICAL', color: 'bg-red-950/90 border-red-500/60 text-red-400 font-bold animate-pulse' },
    PANIC_0: { label: 'PANIC 0 / ACTIVE EMERGENCY', color: 'bg-red-600 text-white font-bold animate-bounce' },
  }[defcon];

  return (
    <header className="border-b border-sky-950/60 bg-[#04090f] text-slate-200">
      {/* Top Universal Access Strip */}
      <div className="border-b border-sky-900/30 bg-[#02060b] px-3 py-1.5 text-[11px] font-mono-code tracking-wider text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 text-sky-400">
              <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
              UNIVERSAL ACCESS: PHONES • TABLETS • CCTV • HARDWARE
            </span>
            <span className="hidden text-slate-700 sm:inline">|</span>
            <span className="hidden text-slate-300 md:inline">
              SECURITY LAYER: 5 ROLES • AES-256-GCM • SHA-256 AUDIT
            </span>
            <span className="hidden text-slate-700 md:inline">|</span>
            <span className="text-emerald-400">LIVE SURVEILLANCE ACTIVE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              type="button"
              className="flex items-center gap-1 rounded bg-sky-950/80 px-2 py-0.5 text-[10px] text-sky-300 transition-colors hover:bg-sky-900 hover:text-white"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? 'LINK COPIED' : 'COPY APP LINK'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tactical Header */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-gradient-to-br from-sky-950 via-[#071322] to-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Shield className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-exo text-lg font-extrabold tracking-wider">
              <span className="text-sky-400">SENTINEL</span>
              <span className="text-slate-100">ARC</span>
              <span className="rounded border border-sky-500/30 bg-sky-950/60 px-1.5 py-0.2 text-[10px] font-mono-code font-normal text-sky-300">
                v5.2
              </span>
            </div>
            <div className="text-[11px] font-mono-code tracking-tight text-slate-400">
              Live Surveillance Matrix & Biometric Shield
            </div>
          </div>
        </div>

        {/* Tactical Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* DEFCON Level Badge */}
          <div className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-mono-code uppercase ${defconDisplay.color}`}>
            <span className="h-2 w-2 rounded-full bg-current animate-ping" />
            {defconDisplay.label}
          </div>

          {/* Role Badge */}
          <div className="rounded border border-sky-500/30 bg-[#071424] px-2.5 py-1 text-[11px] font-mono-code text-sky-300">
            ROLE: <span className="font-bold text-white">{currentUser.role}</span>
          </div>

          {/* Siren Indicator Button */}
          {isAlarmRinging && (
            <button
              onClick={onToggleSilenceAlarm}
              className="flex items-center gap-1 rounded border border-red-500 bg-red-600 px-2 py-1 text-[11px] font-mono-code font-bold text-white animate-pulse"
              title="Click to silence active alarm siren"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              SILENCE SIREN
            </button>
          )}
        </div>

        {/* Account Switcher & Panic SOS */}
        <div className="flex items-center gap-2">
          {/* Account Picker */}
          <div className="flex items-center rounded-lg border border-sky-900/50 bg-[#081320] px-2 py-1 text-xs">
            <span className="mr-1.5 text-[10px] font-mono-code uppercase text-slate-400">ACC:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = allUsers.find((u) => u.id === e.target.value);
                if (user) onSelectUser(user);
              }}
              className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
            >
              {allUsers.map((user) => (
                <option key={user.id} value={user.id} className="bg-[#0c1929] text-slate-200">
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* Lock Screen Curtain Button */}
          <button
            onClick={onToggleCurtainLock}
            type="button"
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-mono-code transition-colors ${
              isCurtainLocked
                ? 'border-amber-500 bg-amber-950/80 text-amber-300'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
            }`}
            title="Curtain privacy lock"
          >
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isCurtainLocked ? 'UNMASK' : 'LOCK'}</span>
          </button>

          {/* PWA Phone Install Button */}
          {isInstallable && onInstallApp && (
            <button
              onClick={onInstallApp}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/60 bg-blue-950 px-2.5 py-1.5 text-xs font-mono-code font-bold text-blue-200 hover:bg-blue-900 transition-colors shadow-sm"
              title="Install Sentinel Arc to Phone / Device"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden md:inline">INSTALL TO PHONE</span>
            </button>
          )}

          {/* Emergency Contacts Access (Emergency Numbers Only) Button */}
          {onOpenEmergencyContactsPrompt && (
            <button
              onClick={onOpenEmergencyContactsPrompt}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/80 px-2.5 py-1.5 text-xs font-mono-code font-bold text-emerald-200 hover:bg-emerald-900 transition-colors shadow-sm"
              title="Authorize & Select Device Emergency Numbers"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">PHONE CONTACTS</span>
              <span className="rounded bg-emerald-900/90 px-1 py-0.2 text-[9px] text-emerald-200 uppercase font-mono-code border border-emerald-700/50">
                EMERGENCY ONLY
              </span>
            </button>
          )}

          {/* Wireless Screen Cast Button */}
          {onOpenCastMode && (
            <button
              onClick={onOpenCastMode}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950/80 px-2.5 py-1.5 text-xs font-mono-code font-bold text-cyan-300 hover:bg-cyan-900 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              title="Cast live surveillance feed to Smart TVs, phones, or monitors"
            >
              <Cast className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden lg:inline">CAST</span>
            </button>
          )}

          {/* SOS & CONTACTS DISPATCH BUTTON */}
          {onOpenSosModal && (
            <button
              onClick={onOpenSosModal}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-sky-500/50 bg-sky-950/80 px-2.5 py-1.5 text-xs font-mono-code font-bold text-sky-200 hover:bg-sky-900 transition-colors shadow-sm"
              title="Open Emergency SOS & Contacts Matrix"
            >
              <Radio className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">SOS & CONTACTS</span>
              {contactsCount > 0 && (
                <span className="rounded-full bg-sky-500/30 px-1.5 py-0.2 text-[10px] text-sky-300">
                  {contactsCount}
                </span>
              )}
            </button>
          )}

          {/* EMERGENCY PANIC BUTTON */}
          <button
            onClick={onTriggerPanic}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-red-600/80 bg-red-950 px-3 py-1.5 text-xs font-mono-code font-bold tracking-wider text-red-200 transition-all hover:bg-red-600 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            <PhoneCall className="h-3.5 w-3.5 animate-pulse text-red-400" />
            <span>PANIC / SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
