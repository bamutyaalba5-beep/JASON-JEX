import React from 'react';
import { Role } from '../types';
import {
  Video,
  Clock,
  ScanFace,
  Siren,
  LayoutGrid,
  Database,
  ShieldCheck,
  Users,
  FileText,
  Sliders,
  HardDrive,
  FileCheck,
  ShieldAlert,
  Radio,
  BrainCircuit,
  Tv,
  Cast,
  Bot,
} from 'lucide-react';

export type ViewTab =
  | 'camera'
  | 'tv-mode'
  | 'cast-mode'
  | 'ai-chat'
  | 'hardware-link'
  | 'events'
  | 'biometrics'
  | 'authorities'
  | 'matrix'
  | 'vault'
  | 'scam'
  | 'roles'
  | 'docs'
  | 'boss-ai-settings'
  | 'boss-accounts'
  | 'boss-devices'
  | 'boss-rules'
  | 'boss-audit'
  | 'boss-security';

interface NavigationProps {
  currentView: ViewTab;
  onSelectView: (view: ViewTab) => void;
  userRole: Role;
  eventCount: number;
  activeAlarmCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  userRole,
  eventCount,
  activeAlarmCount,
}) => {
  const isBossOrAdmin = userRole === 'BOSS' || userRole === 'ADMIN' || userRole === 'AUTHORITY';
  const [showBossMenu, setShowBossMenu] = React.useState(true);

  const mainNavItems = [
    {
      id: 'camera' as ViewTab,
      label: 'MY CAMERA MONITOR',
      icon: Video,
    },
    {
      id: 'tv-mode' as ViewTab,
      label: 'TV MODE MATRIX',
      icon: Tv,
      badge: 'ALL-CAM AI',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
    },
    {
      id: 'cast-mode' as ViewTab,
      label: 'SCREEN CAST MODE',
      icon: Cast,
      badge: 'WIRELESS CAST',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      id: 'ai-chat' as ViewTab,
      label: 'TACTICAL AI OPERATOR',
      icon: Bot,
      badge: 'GEMINI / MAPS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold',
    },
    {
      id: 'hardware-link' as ViewTab,
      label: 'HARDWARE LINK & SETTINGS',
      icon: Radio,
      badge: 'USB • BT • CAST',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'events' as ViewTab,
      label: 'MY EVENTS',
      icon: Clock,
      badge: eventCount > 0 ? String(eventCount) : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    },
    {
      id: 'biometrics' as ViewTab,
      label: 'FACIAL BIOMETRICS',
      icon: ScanFace,
      badge: 'AI LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    },
    {
      id: 'authorities' as ViewTab,
      label: 'AUTHORITIES & SOS',
      icon: Siren,
      badge: activeAlarmCount > 0 ? `ALARM (${activeAlarmCount})` : 'SECURE',
      badgeColor: activeAlarmCount > 0 ? 'bg-red-500 text-white font-bold animate-pulse' : 'bg-red-950/60 text-red-400 border-red-500/40',
      highlight: true,
    },
    {
      id: 'matrix' as ViewTab,
      label: 'AI CRIME MATRIX',
      icon: LayoutGrid,
    },
    {
      id: 'vault' as ViewTab,
      label: 'STORAGE VAULT',
      icon: Database,
    },
    {
      id: 'scam' as ViewTab,
      label: 'ANTI-SCAM SHIELD',
      icon: ShieldCheck,
    },
    {
      id: 'roles' as ViewTab,
      label: 'ROLE & PERMISSION MATRIX',
      icon: Users,
    },
    {
      id: 'docs' as ViewTab,
      label: 'DOCUMENTATION',
      icon: FileText,
    },
  ];

  const bossNavItems = [
    {
      id: 'boss-ai-settings' as ViewTab,
      label: 'AI CRIME & COMMUNITY RULES',
      icon: BrainCircuit,
      badge: 'TRAIN & TIME',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    },
    {
      id: 'boss-accounts' as ViewTab,
      label: 'ACCOUNTS & USERS',
      icon: Users,
    },
    {
      id: 'boss-devices' as ViewTab,
      label: 'CAMERAS & HARDWARE',
      icon: HardDrive,
    },
    {
      id: 'boss-rules' as ViewTab,
      label: 'ALARM RULES',
      icon: Sliders,
    },
    {
      id: 'boss-security' as ViewTab,
      label: 'SECURITY CENTER',
      icon: ShieldAlert,
    },
    {
      id: 'boss-audit' as ViewTab,
      label: 'TAMPER-PROOF AUDIT LOG',
      icon: FileCheck,
    },
  ];

  return (
    <nav className="border-b border-sky-950/70 bg-[#060e18] px-3 py-1.5 overflow-x-auto">
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 whitespace-nowrap">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono-code transition-all ${
                isActive
                  ? item.highlight
                    ? 'bg-red-900/60 text-red-200 border border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                    : 'bg-sky-900/50 text-sky-200 border border-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : item.highlight
                  ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? (item.highlight ? 'text-red-400' : 'text-sky-400') : ''}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`ml-1 rounded border px-1.5 py-0.2 text-[10px] ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* BOSS & ADMIN MENU EXPANSION */}
        {isBossOrAdmin && (
          <>
            <div className="mx-1 h-5 w-[1px] bg-slate-800" />
            <button
              onClick={() => setShowBossMenu(!showBossMenu)}
              className="rounded bg-sky-950/60 px-2 py-1 text-[10px] font-mono-code text-sky-400 border border-sky-800/40 hover:bg-sky-900/40"
            >
              {showBossMenu ? 'BOSS MENU ▼' : 'BOSS MENU ▶'}
            </button>

            {showBossMenu &&
              bossNavItems.map((bItem) => {
                const BIcon = bItem.icon;
                const isBActive = currentView === bItem.id;
                return (
                  <button
                    key={bItem.id}
                    onClick={() => onSelectView(bItem.id)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono-code transition-all ${
                      isBActive
                        ? 'bg-sky-950 text-sky-300 border border-sky-400/50'
                        : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <BIcon className="h-3.5 w-3.5" />
                    <span>{bItem.label}</span>
                    {bItem.badge && (
                      <span className={`ml-1 rounded border px-1.5 py-0.2 text-[9px] ${bItem.badgeColor || 'bg-sky-950 text-sky-400 border-sky-800'}`}>
                        {bItem.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </>
        )}
      </div>
    </nav>
  );
};
