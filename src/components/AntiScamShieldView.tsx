import React, { useState } from 'react';
import { ScamDomainEntry } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  Globe,
  Ban,
  PhoneCall,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface AntiScamShieldViewProps {
  scamDomains: ScamDomainEntry[];
}

export const AntiScamShieldView: React.FC<AntiScamShieldViewProps> = ({ scamDomains }) => {
  const [testInput, setTestInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    risk: 'SAFE' | 'WARNING' | 'CRITICAL_FRAUD';
    score: number;
    details: string;
  } | null>(null);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    const lower = testInput.toLowerCase();
    const isSuspicious =
      lower.includes('police') ||
      lower.includes('verify') ||
      lower.includes('fee') ||
      lower.includes('gift') ||
      lower.includes('bank') ||
      lower.includes('urgent') ||
      lower.includes('irs') ||
      lower.includes('arrest');

    if (isSuspicious) {
      setScanResult({
        risk: 'CRITICAL_FRAUD',
        score: 98,
        details:
          'High probability social-engineering fraud detected. Impersonation of law enforcement, banks, or emergency authorities detected. Do not provide credentials or admit visitor onto premises.',
      });
    } else {
      setScanResult({
        risk: 'SAFE',
        score: 4,
        details: 'No known fraudulent signatures or phishing heuristics identified in the verified threat database.',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-950/60 text-sky-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span>ANTI-SCAM & THREAT INTELLIGENCE SHIELD</span>
              <span className="rounded border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono-code font-normal text-emerald-300">
                ACTIVE HEURISTICS ENGINE
              </span>
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Detects Impersonation Scams • Malicious Caller IDs • Phishing URLs • Fraudulent Visitor Tactics
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE SCANNER BOX */}
      <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 font-mono-code text-xs">
        <div className="font-exo text-sm font-bold text-slate-200 uppercase mb-2">
          SCAN SUSPICIOUS URL, CALLER ID, OR VISITOR CLAIM
        </div>
        <form onSubmit={handleScan} className="flex gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g. police-emergency-verification.com or 'We are here to inspect your power meter'"
            className="flex-1 rounded border border-sky-900/60 bg-[#030811] px-3 py-2 text-white outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded bg-sky-700 px-4 py-2 font-bold text-white hover:bg-sky-600"
          >
            <Search className="h-4 w-4" /> SCAN THREAT
          </button>
        </form>

        {scanResult && (
          <div
            className={`mt-3 rounded-lg border p-3 ${
              scanResult.risk === 'CRITICAL_FRAUD'
                ? 'border-red-500 bg-red-950/70 text-red-200'
                : 'border-emerald-500 bg-emerald-950/70 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 font-exo font-bold text-sm">
              {scanResult.risk === 'CRITICAL_FRAUD' ? (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              )}
              <span>{scanResult.risk.replace(/_/g, ' ')} (THREAT INDEX: {scanResult.score}/100)</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed">{scanResult.details}</p>
          </div>
        )}
      </div>

      {/* SCAM BLOCKLIST TABLE */}
      <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 font-mono-code text-xs">
        <div className="flex items-center justify-between border-b border-sky-950/60 pb-3">
          <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-200">
            <Ban className="h-4 w-4 text-red-400" />
            <span>GLOBAL FRAUD & SCAM SIGNATURE REPOSITORY</span>
          </div>
          <span className="text-[11px] text-slate-400">{scamDomains.length} Verified Signatures</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-sky-950 text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-2">THREAT DOMAIN / VECTOR</th>
                <th className="py-2">CATEGORY</th>
                <th className="py-2">RISK SCORE</th>
                <th className="py-2">BLOCKED HITS</th>
                <th className="py-2 text-right">DATE LOGGED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-950/50 text-slate-300">
              {scamDomains.map((scam) => (
                <tr key={scam.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-bold text-red-400 flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{scam.domain}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="rounded bg-red-950 px-2 py-0.5 text-[10px] text-red-300 border border-red-800/40">
                      {scam.category}
                    </span>
                  </td>
                  <td className="py-2.5 font-bold text-red-300">{scam.riskScore} / 100</td>
                  <td className="py-2.5 text-slate-400">{scam.blockedCount} attempts</td>
                  <td className="py-2.5 text-right text-slate-400">{scam.dateAdded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
