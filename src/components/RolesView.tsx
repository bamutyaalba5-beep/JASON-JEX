import React from 'react';
import { Role } from '../types';
import { Users, Shield, Check, X, ShieldAlert, Key } from 'lucide-react';

export const RolesView: React.FC = () => {
  const rolesData: {
    role: Role;
    title: string;
    description: string;
    permissions: { [key: string]: boolean };
  }[] = [
    {
      role: 'BOSS',
      title: 'Site Owner & Master Commander',
      description: 'Supreme clearance. Manages all accounts, billing, encryption keys, and system purge protocols.',
      permissions: {
        'Live Camera Monitoring': true,
        'PTT Two-Way Intercom': true,
        'Biometric Profile Enrollment': true,
        'Vault Cryptographic Key Management': true,
        'Trigger Emergency SOS & Sirens': true,
        'Authority Incident Dispatch': true,
        'Audit Log Inspection': true,
        'System Hardware & Device Management': true,
      },
    },
    {
      role: 'AUTHORITY',
      title: 'Law Enforcement & 911 Dispatch',
      description: 'Emergency responder tier. Receives instant SOS alerts, live tactical feeds, and dispatches patrol units.',
      permissions: {
        'Live Camera Monitoring': true,
        'PTT Two-Way Intercom': true,
        'Biometric Profile Enrollment': false,
        'Vault Cryptographic Key Management': false,
        'Trigger Emergency SOS & Sirens': true,
        'Authority Incident Dispatch': true,
        'Audit Log Inspection': true,
        'System Hardware & Device Management': false,
      },
    },
    {
      role: 'ADMIN',
      title: 'Security Operations Administrator',
      description: 'Configures sensitivity thresholds, adds cameras, manages facial biometrics, and reviews events.',
      permissions: {
        'Live Camera Monitoring': true,
        'PTT Two-Way Intercom': true,
        'Biometric Profile Enrollment': true,
        'Vault Cryptographic Key Management': false,
        'Trigger Emergency SOS & Sirens': true,
        'Authority Incident Dispatch': true,
        'Audit Log Inspection': true,
        'System Hardware & Device Management': true,
      },
    },
    {
      role: 'OPERATOR',
      title: 'Surveillance Operator & Patrol',
      description: 'Daily guard watch. Tracks live camera feeds, communicates through PTT intercom, and flags unknown visitors.',
      permissions: {
        'Live Camera Monitoring': true,
        'PTT Two-Way Intercom': true,
        'Biometric Profile Enrollment': false,
        'Vault Cryptographic Key Management': false,
        'Trigger Emergency SOS & Sirens': true,
        'Authority Incident Dispatch': false,
        'Audit Log Inspection': false,
        'System Hardware & Device Management': false,
      },
    },
    {
      role: 'VIEWER',
      title: 'Household Member / Resident',
      description: 'Read-only access to authorized cameras and doorbell chimes. Cannot modify security configurations.',
      permissions: {
        'Live Camera Monitoring': true,
        'PTT Two-Way Intercom': false,
        'Biometric Profile Enrollment': false,
        'Vault Cryptographic Key Management': false,
        'Trigger Emergency SOS & Sirens': false,
        'Authority Incident Dispatch': false,
        'Audit Log Inspection': false,
        'System Hardware & Device Management': false,
      },
    },
  ];

  return (
    <div className="space-y-4 font-mono-code text-xs">
      {/* HEADER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span>ROLE-BASED ACCESS CONTROL (RBAC) MATRIX</span>
              <span className="rounded border border-sky-500/40 bg-sky-950/60 px-2 py-0.5 text-[10px] font-normal text-sky-300">
                5-TIER CLEARANCE
              </span>
            </div>
            <div className="text-slate-400">
              Enforces Zero-Trust Security Across Operators, Residents, Administrators, and 911 Authorities
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX CARDS */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rolesData.map((r) => (
          <div
            key={r.role}
            className="flex flex-col justify-between rounded-xl border border-sky-900/40 bg-[#07111c] p-4 transition-all hover:border-sky-700/60"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    r.role === 'BOSS'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : r.role === 'AUTHORITY'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-sky-950 text-sky-300 border border-sky-800'
                  }`}
                >
                  {r.role}
                </span>
                <Shield className="h-4 w-4 text-sky-400" />
              </div>

              <h3 className="mt-2 font-exo text-sm font-bold text-slate-100">{r.title}</h3>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">{r.description}</p>

              <div className="mt-4 border-t border-sky-950/80 pt-3 space-y-1.5 text-[11px]">
                {Object.entries(r.permissions).map(([perm, allowed]) => (
                  <div key={perm} className="flex items-center justify-between">
                    <span className="text-slate-300">{perm}</span>
                    {allowed ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <X className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
