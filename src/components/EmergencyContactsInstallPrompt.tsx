import React, { useState, useEffect } from 'react';
import { EmergencyContact } from '../types';
import {
  isContactsApiSupported,
  requestDeviceContacts,
  playAlarmSiren,
} from '../utils/security';
import {
  Shield,
  ShieldAlert,
  Smartphone,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Lock,
  Download,
  Info,
  ChevronRight,
} from 'lucide-react';

interface EmergencyContactsInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  isInstalled: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isInstallable: boolean;
  onInstallApp: () => Promise<boolean>;
}

export const EmergencyContactsInstallPrompt: React.FC<EmergencyContactsInstallPromptProps> = ({
  isOpen,
  onClose,
  contacts,
  onUpdateContacts,
  isInstalled,
  isMobile,
  isIOS,
  isInstallable,
  onInstallApp,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualRelation, setManualRelation] = useState<EmergencyContact['relationship']>('Family');
  const [manualPriority, setManualPriority] = useState<EmergencyContact['priority']>('PRIMARY');
  const [showManualForm, setShowManualForm] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  const supportsContacts = isContactsApiSupported();

  // Pick Emergency Contacts from Device Address Book
  const handlePickDeviceEmergencyContacts = async () => {
    setIsRequesting(true);
    setStatusMessage(null);

    try {
      if (!supportsContacts) {
        setStatusMessage({
          type: 'info',
          text: 'The Contact Picker API is supported on mobile devices (e.g. Chrome on Android). On other devices, add your emergency numbers using the quick-entry form below.',
        });
        setShowManualForm(true);
        setIsRequesting(false);
        return;
      }

      const picked = await requestDeviceContacts();
      if (!picked || picked.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'No contacts selected. You can select emergency contacts anytime or add them manually.',
        });
        setIsRequesting(false);
        return;
      }

      const formatted: EmergencyContact[] = picked.map((c, idx) => ({
        id: `ice-dev-${Date.now()}-${idx}`,
        name: c.name || 'Emergency Contact',
        phone: c.phone || '',
        email: c.email || undefined,
        relationship: 'Emergency Contact',
        priority: 'PRIMARY',
        notifySms: true,
        notifyCall: true,
        deviceImported: true,
      }));

      // Filter duplicates
      const existingPhones = new Set(contacts.map((c) => c.phone.replace(/[^0-9]/g, '')));
      const newItems = formatted.filter((c) => !existingPhones.has(c.phone.replace(/[^0-9]/g, '')));

      if (newItems.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'Selected contact(s) are already registered in the emergency dispatch roster.',
        });
      } else {
        const merged = [...newItems, ...contacts];
        onUpdateContacts(merged);
        playAlarmSiren('CHIME_GREETING', 30);
        setStatusMessage({
          type: 'success',
          text: `Successfully authorized and imported ${newItems.length} emergency contact(s) into your SOS alert matrix!`,
        });
        localStorage.setItem('sentinel_emergency_contacts_authorized', 'true');
      }
    } catch (err: any) {
      console.warn('Contacts selection error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message === 'DEVICE_CONTACTS_API_NOT_SUPPORTED'
          ? 'Device contacts picker is not enabled in this browser. Please use the quick emergency entry below.'
          : 'Could not complete contacts request. Please add your emergency numbers manually.',
      });
      setShowManualForm(true);
    } finally {
      setIsRequesting(false);
    }
  };

  // Add Manual Quick Emergency Number
  const handleAddQuickEmergency = (preset: { name: string; phone: string; relation: EmergencyContact['relationship'] }) => {
    const existing = contacts.some((c) => c.phone.replace(/[^0-9]/g, '') === preset.phone.replace(/[^0-9]/g, ''));
    if (existing) {
      setStatusMessage({ type: 'info', text: `${preset.name} (${preset.phone}) is already in your emergency roster.` });
      return;
    }

    const newContact: EmergencyContact = {
      id: `ice-preset-${Date.now()}`,
      name: preset.name,
      phone: preset.phone,
      relationship: preset.relation,
      priority: 'PRIMARY',
      notifySms: true,
      notifyCall: true,
      deviceImported: false,
    };

    onUpdateContacts([newContact, ...contacts]);
    playAlarmSiren('CHIME_GREETING', 25);
    setStatusMessage({
      type: 'success',
      text: `Added ${preset.name} (${preset.phone}) as verified emergency dispatch contact.`,
    });
    localStorage.setItem('sentinel_emergency_contacts_authorized', 'true');
  };

  // Add Custom Manual Emergency Number
  const handleSaveManualEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide both a contact name and valid phone number.' });
      return;
    }

    const newContact: EmergencyContact = {
      id: `ice-manual-${Date.now()}`,
      name: manualName.trim(),
      phone: manualPhone.trim(),
      relationship: manualRelation,
      priority: manualPriority,
      notifySms: true,
      notifyCall: true,
      deviceImported: false,
    };

    onUpdateContacts([newContact, ...contacts]);
    playAlarmSiren('CHIME_GREETING', 25);
    setManualName('');
    setManualPhone('');
    setStatusMessage({
      type: 'success',
      text: `Added emergency contact ${newContact.name} (${newContact.phone}).`,
    });
    localStorage.setItem('sentinel_emergency_contacts_authorized', 'true');
    setShowManualForm(false);
  };

  const handleDismiss = (neverAskAgain = false) => {
    if (neverAskAgain) {
      localStorage.setItem('sentinel_emergency_contacts_dismissed', 'true');
    }
    localStorage.setItem('sentinel_emergency_contacts_prompted', Date.now().toString());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md overflow-y-auto">
      <div className="relative my-6 w-full max-w-2xl rounded-2xl border border-sky-500/50 bg-[#06111f] p-5 sm:p-6 text-slate-100 shadow-[0_0_50px_rgba(14,165,233,0.3)]">
        {/* Close Button */}
        <button
          onClick={() => handleDismiss(false)}
          className="absolute right-4 top-4 rounded-lg border border-slate-700 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-500 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-950/80 px-3 py-0.5 text-xs font-mono-code font-bold text-red-300">
            <ShieldAlert className="h-3.5 w-3.5 text-red-400 animate-pulse" />
            EMERGENCY NUMBERS ONLY
          </span>

          {isInstalled ? (
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-950/80 px-2.5 py-0.5 text-xs font-mono-code text-emerald-300">
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              INSTALLED TO DEVICE
            </span>
          ) : isMobile ? (
            <span className="flex items-center gap-1 rounded-full border border-sky-500/50 bg-sky-950/80 px-2.5 py-0.5 text-xs font-mono-code text-sky-300">
              <Smartphone className="h-3.5 w-3.5 text-sky-400" />
              MOBILE DEVICE DETECTED
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs font-mono-code text-slate-400">
              DEVICE HARDWARE READY
            </span>
          )}

          <span className="rounded-full border border-cyan-500/30 bg-cyan-950/50 px-2.5 py-0.5 text-xs font-mono-code text-cyan-300">
            ENCRYPTED SOS DISPATCH
          </span>
        </div>

        {/* Title */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-500/50 bg-sky-950/60 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <PhoneCall className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h2 className="font-exo text-xl font-bold text-white tracking-wide">
              Authorize Device Contacts Access
            </h2>
            <p className="text-xs font-mono-code text-sky-400 mt-0.5">
              Protocol: Strictly Emergency &amp; Next-of-Kin (ICE) Contacts
            </p>
          </div>
        </div>

        {/* Core Privacy & Operational Mandate Box */}
        <div className="mt-4 rounded-xl border border-sky-900/60 bg-[#030914] p-4 text-xs font-mono-code text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sky-300">
            <Lock className="h-4 w-4 text-sky-400" />
            <span>STRICT PRIVACY MANDATE: ZERO NON-EMERGENCY ACCESS</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            Sentinel Arc requests permission to access your device address book <strong className="text-white">strictly to select emergency response contacts</strong>. When an alarm or DEFCON 1 breach is triggered, an instant encrypted SOS payload (with camera snapshot and GPS location) is dispatched to these selected numbers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-sky-950/60 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Only emergency numbers you select are saved</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>No personal or non-emergency contacts synced</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>One-tap WhatsApp, SMS &amp; Phone call SOS</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Full user revocation &amp; deletion at any time</span>
            </div>
          </div>
        </div>

        {/* Status / Feedback Banner */}
        {statusMessage && (
          <div
            className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs font-mono-code ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'border-red-500/60 bg-red-950/80 text-red-200'
                : 'border-sky-500/60 bg-sky-950/80 text-sky-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
            )}
            <div className="flex-1">{statusMessage.text}</div>
          </div>
        )}

        {/* Primary Contact Picker Action */}
        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-950/60 via-[#07172d] to-sky-950/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-sky-400" />
                  Select Emergency Contacts from Phone / Device
                </div>
                <p className="text-xs text-slate-300 font-mono-code mt-0.5">
                  {supportsContacts
                    ? 'Opens your phone address book. Tap and select only your emergency or ICE contacts.'
                    : 'Device Contact Picker API active on mobile browsers (Android Chrome). Use manual entry below on this device.'}
                </p>
              </div>

              <button
                onClick={handlePickDeviceEmergencyContacts}
                disabled={isRequesting}
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-blue-500 active:scale-98 transition-all disabled:opacity-50 shrink-0"
              >
                {isRequesting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>OPENING ADDRESS BOOK...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="h-4 w-4" />
                    <span>AUTHORIZE &amp; SELECT EMERGENCY NUMBERS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Pre-fill Emergency Templates */}
          <div className="rounded-xl border border-slate-800 bg-[#040c17] p-3.5">
            <div className="text-xs font-mono-code font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>QUICK-ADD ESSENTIAL EMERGENCY SERVICES:</span>
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="text-sky-400 hover:text-sky-300 text-[11px] underline"
              >
                {showManualForm ? 'Hide Custom Entry' : '+ Enter Custom Number'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-code">
              <button
                onClick={() =>
                  handleAddQuickEmergency({
                    name: 'Metro Police Emergency (911)',
                    phone: '911',
                    relation: 'Local Police',
                  })
                }
                className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/40 p-2 text-left hover:bg-red-950 hover:border-red-500 transition-colors"
              >
                <div>
                  <div className="font-bold text-red-300">Metro Police &amp; 911</div>
                  <div className="text-[11px] text-slate-400">Direct Authority Dispatch</div>
                </div>
                <span className="rounded bg-red-900/80 px-2 py-1 text-[11px] font-bold text-white">911</span>
              </button>

              <button
                onClick={() =>
                  handleAddQuickEmergency({
                    name: 'Family Primary Next-of-Kin (ICE)',
                    phone: '+1 (555) 019-2834',
                    relation: 'Family',
                  })
                }
                className="flex items-center justify-between rounded-lg border border-sky-900/50 bg-sky-950/40 p-2 text-left hover:bg-sky-950 hover:border-sky-500 transition-colors"
              >
                <div>
                  <div className="font-bold text-sky-300">Family Next-of-Kin (ICE)</div>
                  <div className="text-[11px] text-slate-400">Immediate Breach SMS &amp; Call</div>
                </div>
                <span className="rounded bg-sky-900/80 px-2 py-1 text-[11px] font-bold text-white">+1 (555)</span>
              </button>

              <button
                onClick={() =>
                  handleAddQuickEmergency({
                    name: 'Facility Armed Patrol Guard',
                    phone: '+1 (555) 911-8844',
                    relation: 'Security Officer',
                  })
                }
                className="flex items-center justify-between rounded-lg border border-amber-900/50 bg-amber-950/40 p-2 text-left hover:bg-amber-950 hover:border-amber-500 transition-colors"
              >
                <div>
                  <div className="font-bold text-amber-300">Armed Security Patrol</div>
                  <div className="text-[11px] text-slate-400">On-Site First Responders</div>
                </div>
                <span className="rounded bg-amber-900/80 px-2 py-1 text-[11px] font-bold text-white">+1 (555)</span>
              </button>

              <button
                onClick={() =>
                  handleAddQuickEmergency({
                    name: 'Medical / Fire Rescue Dispatch',
                    phone: '911',
                    relation: 'Doctor',
                  })
                }
                className="flex items-center justify-between rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-2 text-left hover:bg-emerald-950 hover:border-emerald-500 transition-colors"
              >
                <div>
                  <div className="font-bold text-emerald-300">Medical / Fire Rescue</div>
                  <div className="text-[11px] text-slate-400">Paramedic Immediate Alert</div>
                </div>
                <span className="rounded bg-emerald-900/80 px-2 py-1 text-[11px] font-bold text-white">EMS</span>
              </button>
            </div>
          </div>

          {/* Custom Manual Input Form (Collapsible) */}
          {showManualForm && (
            <form
              onSubmit={handleSaveManualEmergency}
              className="rounded-xl border border-sky-500/30 bg-[#071322] p-4 text-xs font-mono-code space-y-3"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-sky-400" />
                Add Custom Emergency Number
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">CONTACT NAME / TITLE</label>
                  <input
                    type="text"
                    placeholder="e.g. Chief Henderson / Mom ICE"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full rounded-lg border border-sky-900/70 bg-[#030914] px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">EMERGENCY PHONE NUMBER</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 012-3456"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full rounded-lg border border-sky-900/70 bg-[#030914] px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">RELATIONSHIP / ROLE</label>
                  <select
                    value={manualRelation}
                    onChange={(e) => setManualRelation(e.target.value as any)}
                    className="w-full rounded-lg border border-sky-900/70 bg-[#030914] px-3 py-2 text-white outline-none focus:border-sky-500"
                  >
                    <option value="Family">Family / Next-of-Kin (ICE)</option>
                    <option value="Security Officer">Security / Armed Response</option>
                    <option value="Local Police">Authorities / Police Dispatch</option>
                    <option value="Doctor">Medical / Emergency Physician</option>
                    <option value="Neighbor">Facility Neighbor / Custodian</option>
                    <option value="Emergency Contact">Emergency Contact</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">DISPATCH PRIORITY</label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-sky-900/70 bg-[#030914] px-3 py-2 text-white outline-none focus:border-sky-500"
                  >
                    <option value="PRIMARY">PRIMARY (Instant DEFCON 1 Dispatch)</option>
                    <option value="SECONDARY">SECONDARY (Escalation)</option>
                    <option value="STANDBY">STANDBY (Informational)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-sky-400"
                >
                  Save Emergency Contact
                </button>
              </div>
            </form>
          )}

          {/* Current Enrolled Emergency Contacts Summary */}
          <div className="rounded-xl border border-sky-950 bg-[#020710] p-3.5 text-xs font-mono-code">
            <div className="flex items-center justify-between text-slate-300 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-sky-400" />
                ACTIVE EMERGENCY NUMBERS ({contacts.length}):
              </span>
              <span className="text-[11px] text-emerald-400">ARMED FOR SOS BROADCAST</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {contacts.length === 0 ? (
                <div className="text-slate-500 py-3 text-center">
                  No emergency numbers registered yet. Click &quot;Authorize &amp; Select Emergency Numbers&quot; above to add contacts from your phone.
                </div>
              ) : (
                contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#061220] px-3 py-1.5 text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white">{c.name}</span>
                      <span className="text-slate-400 text-[11px]">({c.phone})</span>
                      <span className="rounded bg-sky-950 px-1.5 py-0.2 text-[10px] text-sky-300 border border-sky-800/40">
                        {c.relationship}
                      </span>
                    </div>

                    <span className="text-[10px] text-emerald-300 font-bold">
                      {c.priority} DISPATCH
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* PWA Phone Installation Prompt / Guide if not installed */}
        {!isInstalled && (
          <div className="mt-4 rounded-xl border border-blue-900/50 bg-[#040e1d] p-3.5 text-xs font-mono-code">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Download className="h-4 w-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Install Sentinel Arc to Phone / Home Screen:</span>{' '}
                  Enables native contacts access, persistent background surveillance, and immediate SOS siren.
                </div>
              </div>

              {isInstallable ? (
                <button
                  onClick={onInstallApp}
                  type="button"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-500 transition-colors shrink-0"
                >
                  INSTALL TO PHONE
                </button>
              ) : isIOS ? (
                <button
                  onClick={() => setShowIOSInstallGuide(true)}
                  type="button"
                  className="rounded-lg border border-blue-500/60 bg-blue-950 px-3 py-1.5 font-bold text-blue-200 hover:bg-blue-900 transition-colors shrink-0"
                >
                  HOW TO INSTALL ON iOS
                </button>
              ) : null}
            </div>

            {showIOSInstallGuide && (
              <div className="mt-3 rounded-lg border border-blue-800 bg-[#020710] p-3 text-slate-300 space-y-1">
                <div className="font-bold text-white">Install on iPhone / iPad:</div>
                <div>1. Tap the <strong className="text-sky-400">Share</strong> button in the Safari toolbar at the bottom.</div>
                <div>2. Scroll down and tap <strong className="text-sky-400">Add to Home Screen</strong>.</div>
                <div>3. Launch Sentinel Arc from your home screen for full native phone contacts access!</div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-950">
          <button
            onClick={() => handleDismiss(true)}
            type="button"
            className="text-[11px] font-mono-code text-slate-500 hover:text-slate-300 underline"
          >
            Don&apos;t prompt on startup
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDismiss(false)}
              type="button"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-mono-code text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              Close / Remind Later
            </button>

            <button
              onClick={() => {
                localStorage.setItem('sentinel_emergency_contacts_authorized', 'true');
                onClose();
              }}
              type="button"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Emergency Numbers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
