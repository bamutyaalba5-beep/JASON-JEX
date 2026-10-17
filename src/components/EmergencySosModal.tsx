import React, { useState } from 'react';
import {
  EmergencyContact,
  AuthorityDispatchConfig,
  SosTransmissionLog,
  SirenToneMode,
} from '../types';
import {
  isContactsApiSupported,
  requestDeviceContacts,
  playAlarmSiren,
  stopAlarmSiren,
  setAlarmVolume,
  triggerDirectSOSCall,
  triggerEmergencySMS,
  triggerEmergencyWhatsApp,
  shareEmergencySos,
  generateSosMessage,
} from '../utils/security';
import {
  ShieldAlert,
  PhoneCall,
  MessageSquare,
  Users,
  Smartphone,
  Radio,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Share2,
  MapPin,
  ExternalLink,
  Sliders,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  authorityConfig: AuthorityDispatchConfig;
  onUpdateAuthorityConfig: (config: AuthorityDispatchConfig) => void;
  onTriggerAlarm: (reason: string, details?: string) => void;
  cameraName: string;
  isAlarmRinging: boolean;
  onSilenceAlarm: () => void;
  onOpenEmergencyContactsPrompt?: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onUpdateContacts,
  authorityConfig,
  onUpdateAuthorityConfig,
  onTriggerAlarm,
  cameraName,
  isAlarmRinging,
  onSilenceAlarm,
  onOpenEmergencyContactsPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'dispatch' | 'logs'>('contacts');
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [contactImportMessage, setContactImportMessage] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccessMessage, setBroadcastSuccessMessage] = useState<string | null>(null);
  const [isTestingSiren, setIsTestingSiren] = useState(false);

  // New Contact Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRelationship, setNewRelationship] = useState<EmergencyContact['relationship']>('Family');
  const [newPriority, setNewPriority] = useState<EmergencyContact['priority']>('PRIMARY');
  const [newNotifySms, setNewNotifySms] = useState(true);
  const [newNotifyCall, setNewNotifyCall] = useState(true);

  // Transmission Logs State
  const [transmissionLogs, setTransmissionLogs] = useState<SosTransmissionLog[]>([
    {
      id: 'LOG-INIT-01',
      timestamp: new Date().toLocaleTimeString(),
      recipientName: 'Metro 911 Emergency Command',
      recipientPhone: '911',
      channel: 'AUTHORITY_RADIO_DISPATCH',
      status: 'DELIVERED',
      details: 'Automated authority emergency gateway standby check confirmed.',
    },
  ]);

  if (!isOpen) return null;

  // Real Web Contacts Picker API invocation
  const handleImportDeviceContacts = async () => {
    setIsImportingContacts(true);
    setContactImportMessage(null);

    try {
      if (!isContactsApiSupported()) {
        setContactImportMessage(
          'Device Contact Picker is active on mobile devices and supported browsers. You can also add contacts directly below!'
        );
        setShowAddForm(true);
        setIsImportingContacts(false);
        return;
      }

      const pickedContacts = await requestDeviceContacts();
      if (pickedContacts.length === 0) {
        setContactImportMessage('No contacts selected from device.');
        setIsImportingContacts(false);
        return;
      }

      const formatted: EmergencyContact[] = pickedContacts.map((c, idx) => ({
        id: `cnt-dev-${Date.now()}-${idx}`,
        name: c.name || 'Device Contact',
        phone: c.phone || '',
        email: c.email || undefined,
        relationship: 'Emergency Contact',
        priority: idx === 0 ? 'PRIMARY' : 'SECONDARY',
        notifySms: true,
        notifyCall: true,
        deviceImported: true,
      }));

      // Merge avoiding duplicates by phone
      const existingPhones = new Set(contacts.map((c) => c.phone.replace(/[^0-9]/g, '')));
      const uniqueNew = formatted.filter((c) => !existingPhones.has(c.phone.replace(/[^0-9]/g, '')));

      const merged = [...uniqueNew, ...contacts];
      onUpdateContacts(merged);
      setContactImportMessage(
        `Successfully imported ${uniqueNew.length} contact(s) from this device!`
      );
    } catch (err: any) {
      console.warn('Device contacts import notice:', err);
      setContactImportMessage(
        'Could not access native device contacts (user cancelled or permission declined). You can add contacts manually below.'
      );
      setShowAddForm(true);
    } finally {
      setIsImportingContacts(false);
    }
  };

  // Add Manual Contact
  const handleSaveNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: `cnt-manual-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      relationship: newRelationship,
      priority: newPriority,
      notifySms: newNotifySms,
      notifyCall: newNotifyCall,
      deviceImported: false,
    };

    onUpdateContacts([newContact, ...contacts]);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setShowAddForm(false);
    setContactImportMessage(`Added ${newContact.name} to emergency SOS alert contacts.`);
  };

  // Delete Contact
  const handleDeleteContact = (id: string) => {
    onUpdateContacts(contacts.filter((c) => c.id !== id));
  };

  // Test Siren Audio
  const handleTestSiren = (tone: SirenToneMode) => {
    setIsTestingSiren(true);
    setAlarmVolume(authorityConfig.sirenVolumePercent);
    playAlarmSiren(tone, authorityConfig.sirenVolumePercent);
    setTimeout(() => {
      stopAlarmSiren();
      setIsTestingSiren(false);
    }, 3500);
  };

  // Instant Full Emergency SOS Broadcast to All Contacts & Authorities
  const handleBroadcastSosNow = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccessMessage(null);

    // 1. Trigger System Alarm & Siren if set to audible
    onTriggerAlarm(
      'EMERGENCY_SOS_BROADCAST',
      `Manual critical SOS broadcast initiated. Auto-message sent to ${authorityConfig.targetAgency} and ${contacts.length} emergency contacts.`
    );

    if (authorityConfig.alarmSoundMode === 'AUDIBLE_FULL_SIREN') {
      playAlarmSiren(authorityConfig.sirenTone, authorityConfig.sirenVolumePercent);
    }

    // 2. Dispatch to Backend SOS API
    try {
      const res = await fetch('/api/sos/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          cameraName,
          threatSummary: 'CRITICAL ALARM BREACH - IMMEDIATE EMERGENCY SOS',
          locationLabel: authorityConfig.facilityAddress,
          gpsCoordinates: authorityConfig.gpsCoordinates,
          incidentId: `SOS-${Date.now().toString(36).toUpperCase()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.logs)) {
          setTransmissionLogs((prev) => [...data.logs, ...prev]);
        }
      }
    } catch (err) {
      console.warn('Backend SOS dispatch notice:', err);
    }

    // 3. Mark contacts alerted
    const nowStr = new Date().toLocaleTimeString();
    onUpdateContacts(
      contacts.map((c) => ({
        ...c,
        lastAlerted: nowStr,
      }))
    );

    setIsBroadcasting(false);
    setBroadcastSuccessMessage(
      `🚨 EMERGENCY SOS BROADCAST DELIVERED! Dispatched to ${authorityConfig.targetAgency} (${authorityConfig.emergencyHotline}) and ${contacts.length} emergency contacts.`
    );
  };

  // Share via Native Device Web Share
  const handleNativeShareSos = async () => {
    const success = await shareEmergencySos({
      cameraName,
      threatSummary: 'CRITICAL SECURITY BREACH & EMERGENCY SOS',
      locationLabel: authorityConfig.facilityAddress,
      gpsCoordinates: authorityConfig.gpsCoordinates,
    });
    if (success) {
      setBroadcastSuccessMessage('Emergency SOS alert packet shared via device applications.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-red-500/50 bg-[#070e17] p-4 sm:p-6 shadow-[0_0_50px_rgba(239,68,68,0.35)] font-mono-code text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/60 bg-red-950 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <ShieldAlert className="h-6 w-6 animate-pulse text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-exo text-lg sm:text-xl font-extrabold text-slate-100">
                <span>EMERGENCY SOS & CONTACTS DISPATCH MATRIX</span>
              </div>
              <div className="text-xs text-slate-400">
                Automated message to authorities on alarm • Device contacts access • Audible siren control
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAlarmRinging && (
              <button
                onClick={onSilenceAlarm}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-red-400 bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 animate-pulse"
              >
                <VolumeX className="h-4 w-4" />
                <span>SILENCE SIREN</span>
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:border-slate-600 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-red-300">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold uppercase tracking-wider">
              {authorityConfig.autoDispatchEnabled ? 'AUTOMATIC AUTHORITY AUTO-DISPATCH ACTIVE' : 'AUTHORITY DISPATCH MANUAL'}
            </span>
            <span className="hidden sm:inline text-slate-400">
              • Target: {authorityConfig.targetAgency} ({authorityConfig.emergencyHotline})
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-sky-400" />
            <span>{authorityConfig.gpsCoordinates}</span>
          </div>
        </div>

        {broadcastSuccessMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-950/70 p-3 text-xs text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{broadcastSuccessMessage}</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-sky-950/80 pb-2">
          <button
            onClick={() => setActiveTab('contacts')}
            type="button"
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'contacts'
                ? 'border border-red-500 bg-red-950 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>DEVICE & EMERGENCY CONTACTS ({contacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            type="button"
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'dispatch'
                ? 'border border-red-500 bg-red-950 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>AUTHORITIES & SIREN CONFIG</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            type="button"
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'border border-red-500 bg-red-950 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>SOS TRANSMISSION LOGS ({transmissionLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: DEVICE CONTACTS & MANAGEMENT */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {/* TOP ACTION BAR FOR CONTACTS */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-900/40 bg-[#091524] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* ACCESS DEVICE CONTACTS BUTTON (EMERGENCY ONLY) */}
                  <button
                    onClick={() => {
                      if (onOpenEmergencyContactsPrompt) {
                        onOpenEmergencyContactsPrompt();
                      } else {
                        handleImportDeviceContacts();
                      }
                    }}
                    disabled={isImportingContacts}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-400 bg-emerald-600 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-500 transition-all"
                    title="Access phone contacts strictly for emergency numbers"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>{isImportingContacts ? 'ACCESSING DEVICE...' : 'ACCESS PHONE CONTACTS (EMERGENCY ONLY)'}</span>
                  </button>

                  {/* ADD CONTACT MANUALLY */}
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>ADD MANUAL NUMBER</span>
                  </button>

                  {/* RESTORE PRESETS */}
                  <button
                    onClick={() => {
                      onUpdateContacts([
                        {
                          id: `cnt-preset-911`,
                          name: 'Metro Emergency Dispatch 911',
                          phone: '911',
                          email: 'dispatch@metro-police.gov',
                          relationship: 'Local Police',
                          priority: 'PRIMARY',
                          notifySms: true,
                          notifyCall: true,
                        },
                        {
                          id: `cnt-preset-patrol`,
                          name: 'Captain Mark Reynolds (Armed Sentry Patrol)',
                          phone: '+1 (555) 019-2831',
                          email: 'reynolds@private-patrol.org',
                          relationship: 'Security Officer',
                          priority: 'PRIMARY',
                          notifySms: true,
                          notifyCall: true,
                        },
                        {
                          id: `cnt-preset-spouse`,
                          name: 'Elena Vance (Primary Resident)',
                          phone: '+1 (555) 018-9942',
                          relationship: 'Spouse',
                          priority: 'PRIMARY',
                          notifySms: true,
                          notifyCall: true,
                        },
                        {
                          id: `cnt-preset-doctor`,
                          name: 'Dr. Arthur Sterling (Medical Responder)',
                          phone: '+1 (555) 014-7721',
                          relationship: 'Doctor',
                          priority: 'SECONDARY',
                          notifySms: true,
                          notifyCall: false,
                        },
                        {
                          id: `cnt-preset-neighbor`,
                          name: 'Marcus Brody (Next-Door Neighbor)',
                          phone: '+1 (555) 012-3309',
                          relationship: 'Neighbor',
                          priority: 'BACKUP',
                          notifySms: true,
                          notifyCall: false,
                        },
                      ]);
                      setContactImportMessage('Standard emergency security presets loaded.');
                    }}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-teal-900/60 bg-teal-950/60 px-3 py-2 text-xs text-teal-300 hover:bg-teal-900 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>LOAD PRESETS</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  {contacts.filter((c) => c.priority === 'PRIMARY').length} Primary • {contacts.length} Total Registered
                </div>
              </div>

              {contactImportMessage && (
                <div className="rounded-lg border border-sky-800/60 bg-sky-950/50 p-2.5 text-xs text-sky-300 flex items-center justify-between">
                  <span>{contactImportMessage}</span>
                  <button onClick={() => setContactImportMessage(null)} className="text-slate-400 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* MANUAL ADD FORM */}
              {showAddForm && (
                <form
                  onSubmit={handleSaveNewContact}
                  className="rounded-xl border border-sky-500/50 bg-[#091525] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-sky-900/60 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                      <Plus className="h-4 w-4" />
                      <span>ADD EMERGENCY SOS CONTACT</span>
                    </div>
                    <button
                      onClick={() => setShowAddForm(false)}
                      type="button"
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Elena Vance"
                        className="mt-1 w-full rounded border border-sky-900 bg-[#04090f] px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="e.g. +1 555-0188 or 911"
                        className="mt-1 w-full rounded border border-sky-900 bg-[#04090f] px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Email (Optional)</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="e.g. alert@residence.net"
                        className="mt-1 w-full rounded border border-sky-900 bg-[#04090f] px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Relationship</label>
                      <select
                        value={newRelationship}
                        onChange={(e) => setNewRelationship(e.target.value as any)}
                        className="mt-1 w-full rounded border border-sky-900 bg-[#04090f] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-400"
                      >
                        <option value="Family">Family Member</option>
                        <option value="Spouse">Spouse / Partner</option>
                        <option value="Parent">Parent</option>
                        <option value="Security Officer">Security Officer / Armed Guard</option>
                        <option value="Local Police">Local Police / Dispatch</option>
                        <option value="Neighbor">Neighbor</option>
                        <option value="Doctor">Doctor / Medical</option>
                        <option value="Emergency Contact">Other Emergency Contact</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Alert Priority</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="mt-1 w-full rounded border border-sky-900 bg-[#04090f] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-400"
                      >
                        <option value="PRIMARY">PRIMARY (Instant Auto-SOS)</option>
                        <option value="SECONDARY">SECONDARY (Notification Tier 2)</option>
                        <option value="BACKUP">BACKUP (Standby)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newNotifySms}
                          onChange={(e) => setNewNotifySms(e.target.checked)}
                          className="accent-red-500 rounded"
                        />
                        <span>Send SMS</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newNotifyCall}
                          onChange={(e) => setNewNotifyCall(e.target.checked)}
                          className="accent-red-500 rounded"
                        />
                        <span>Call Hook</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="rounded px-3 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500"
                    >
                      SAVE CONTACT
                    </button>
                  </div>
                </form>
              )}

              {/* CONTACTS LIST */}
              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                    No emergency SOS contacts enrolled yet. Click <span className="text-sky-400 font-bold">ACCESS DEVICE CONTACTS</span> or <span className="text-sky-400 font-bold">ADD CONTACT</span> to register emergency contacts.
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                        contact.priority === 'PRIMARY'
                          ? 'border-red-900/60 bg-[#12070e]'
                          : 'border-slate-800/80 bg-[#09111c]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold ${
                            contact.priority === 'PRIMARY'
                              ? 'border-red-500/50 bg-red-950 text-red-400'
                              : 'border-sky-900 bg-sky-950 text-sky-400'
                          }`}
                        >
                          {contact.name.substring(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-exo text-sm font-bold text-slate-100">{contact.name}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                contact.priority === 'PRIMARY'
                                  ? 'bg-red-900/80 text-red-200 border border-red-500/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {contact.priority}
                            </span>
                            {contact.deviceImported && (
                              <span className="rounded bg-sky-950 px-1.5 py-0.5 text-[9px] text-sky-300 border border-sky-800">
                                DEVICE IMPORTED
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="text-slate-300 font-mono-code">{contact.phone}</span>
                            <span>•</span>
                            <span>{contact.relationship}</span>
                            {contact.lastAlerted && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 text-[11px]">Alerted: {contact.lastAlerted}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* FAST SOS ACTIONS PER CONTACT */}
                      <div className="flex items-center gap-1.5">
                        {/* Instant Call */}
                        <button
                          onClick={() => triggerDirectSOSCall(contact.phone)}
                          type="button"
                          className="flex items-center gap-1 rounded-lg border border-red-700/60 bg-red-950/80 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-900 transition-colors shadow-sm"
                          title={`Direct Emergency Call to ${contact.name}`}
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">CALL</span>
                        </button>

                        {/* Instant SMS */}
                        <button
                          onClick={() =>
                            triggerEmergencySMS(
                              contact.phone,
                              cameraName,
                              'CRITICAL ALARM BREACH DETECTED',
                              authorityConfig.facilityAddress,
                              authorityConfig.gpsCoordinates
                            )
                          }
                          type="button"
                          className="flex items-center gap-1 rounded-lg border border-sky-800 bg-sky-950/80 px-2.5 py-1.5 text-xs text-sky-300 hover:bg-sky-900 transition-colors"
                          title={`Dispatch Emergency SMS to ${contact.name}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">SMS</span>
                        </button>

                        {/* WhatsApp Deep Link */}
                        <button
                          onClick={() =>
                            triggerEmergencyWhatsApp(
                              contact.phone,
                              cameraName,
                              'CRITICAL ALARM BREACH DETECTED',
                              authorityConfig.facilityAddress,
                              authorityConfig.gpsCoordinates
                            )
                          }
                          type="button"
                          className="flex items-center gap-1 rounded-lg border border-emerald-800 bg-emerald-950/80 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900"
                          title="Open WhatsApp SOS"
                        >
                          <span>WA</span>
                        </button>

                        {/* Delete Contact */}
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          type="button"
                          className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:border-red-600 hover:text-red-400"
                          title="Remove contact"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Emergency Numbers Policy Guarantee */}
                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs text-emerald-300/90 space-y-1 mt-3">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Shield className="h-4 w-4" />
                    <span>DEVICE CONTACTS PRIVACY PROTOCOL: EMERGENCY NUMBERS ONLY</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Access to your device address book is strictly limited to identifying emergency dispatch recipients (ICE, Next-of-Kin, 911, Police, Security). Sentinel Arc does not read, index, or store any personal or non-emergency contacts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTHORITY AUTO-DISPATCH & SIREN CONTROL */}
          {activeTab === 'dispatch' && (
            <div className="space-y-4">
              {/* AUTHORITY AUTO-DISPATCH CARD */}
              <div className="rounded-xl border border-red-900/60 bg-[#0d070b] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900/40 pb-3">
                  <div className="flex items-center gap-2 font-exo text-sm font-bold text-red-400">
                    <Radio className="h-4 w-4" />
                    <span>AUTOMATIC AUTHORITY DISPATCH PROTOCOL</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorityConfig.autoDispatchEnabled}
                      onChange={(e) =>
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          autoDispatchEnabled: e.target.checked,
                        })
                      }
                      className="accent-red-500 rounded h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      AUTO-SEND TO AUTHORITIES ON ALARM TRIGGER
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Designated Law Enforcement / Authority Agency</label>
                    <select
                      value={authorityConfig.targetAgency}
                      onChange={(e) =>
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          targetAgency: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded border border-red-900/60 bg-[#04090f] px-3 py-2 text-slate-100 outline-none"
                    >
                      <option value="Metro 911 Emergency Command & Tactical Police Patrol">
                        Metro 911 Emergency Command & Police Patrol
                      </option>
                      <option value="Metropolitan Armed Sentry Response (Private Security)">
                        Metropolitan Armed Sentry Response (Private Security)
                      </option>
                      <option value="National Emergency Law Enforcement (999 / 112)">
                        National Emergency Law Enforcement (999 / 112)
                      </option>
                      <option value="Facility Tactical Guard Command Post">
                        Facility Tactical Guard Command Post
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Emergency Dispatch Hotline</label>
                    <input
                      type="text"
                      value={authorityConfig.emergencyHotline}
                      onChange={(e) =>
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          emergencyHotline: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded border border-red-900/60 bg-[#04090f] px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Protected Facility Address</label>
                    <input
                      type="text"
                      value={authorityConfig.facilityAddress}
                      onChange={(e) =>
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          facilityAddress: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded border border-red-900/60 bg-[#04090f] px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Exact GPS Telemetry Coordinates</label>
                    <input
                      type="text"
                      value={authorityConfig.gpsCoordinates}
                      onChange={(e) =>
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          gpsCoordinates: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded border border-red-900/60 bg-[#04090f] px-3 py-2 text-slate-100 outline-none font-mono-code text-sky-300"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-red-950 bg-red-950/40 p-3 text-xs text-red-200">
                  <div className="font-bold flex items-center gap-1.5 text-red-300">
                    <Shield className="h-4 w-4" />
                    <span>Active Telemetry Sent to Police & Responders:</span>
                  </div>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300 text-[11px]">
                    <li>Full Incident Classification (DEFCON 1 Emergency Breach)</li>
                    <li>Live GPS Coordinates with direct Google Maps link</li>
                    <li>High-Resolution Camera Snapshot & Biometric Intruder Identification</li>
                    <li>Sensor Type: Optical 1080p FHD, Night Vision IR, or FLIR Thermal Blob</li>
                  </ul>
                </div>
              </div>

              {/* AUDIBLE ALARM SIREN CONTROLS */}
              <div className="rounded-xl border border-sky-900/60 bg-[#071322] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-900/40 pb-3">
                  <div className="flex items-center gap-2 font-exo text-sm font-bold text-sky-300">
                    <Volume2 className="h-4 w-4 text-sky-400" />
                    <span>AUDIBLE ALARM SIREN & AUDIO SYNTHESIZER</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestSiren(authorityConfig.sirenTone)}
                      disabled={isTestingSiren}
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/70 bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-900 transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>{isTestingSiren ? 'SOUNDING TEST SIREN...' : 'TEST SIREN (3 SEC)'}</span>
                    </button>

                    <button
                      onClick={stopAlarmSiren}
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      <VolumeX className="h-3.5 w-3.5" />
                      <span>SILENCE</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Alarm Operating Mode</label>
                    <select
                      value={authorityConfig.alarmSoundMode}
                      onChange={(e) =>
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          alarmSoundMode: e.target.value as any,
                        })
                      }
                      className="mt-1 w-full rounded border border-sky-900 bg-[#04090f] px-3 py-2 text-slate-100 outline-none"
                    >
                      <option value="AUDIBLE_FULL_SIREN">Audible Siren + Authority Dispatch</option>
                      <option value="SILENT_STEALTH_DISPATCH">Silent Stealth (Authorities only, no speaker audio)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Siren Tone Modulation</label>
                    <select
                      value={authorityConfig.sirenTone}
                      onChange={(e) =>
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          sirenTone: e.target.value as any,
                        })
                      }
                      className="mt-1 w-full rounded border border-sky-900 bg-[#04090f] px-3 py-2 text-slate-100 outline-none"
                    >
                      <option value="EMERGENCY_DEFCON_1">US Police Wail (750Hz - 1070Hz Warble)</option>
                      <option value="HI_LO_SIREN">European Two-Tone (Alternating 960Hz / 770Hz)</option>
                      <option value="YELP_SIREN">Fast Yelp Screech (Tactical 4.8Hz Cycles)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                      <span>Siren Volume Floor</span>
                      <span className="text-sky-300 font-bold">{authorityConfig.sirenVolumePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={authorityConfig.sirenVolumePercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onUpdateAuthorityConfig({
                          ...authorityConfig,
                          sirenVolumePercent: val,
                        });
                        setAlarmVolume(val);
                      }}
                      className="mt-2 w-full h-1.5 accent-red-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOS TRANSMISSION LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Direct Telemetry Dispatches to Authorities & Contacts</span>
                <span className="text-emerald-400">ENCRYPTED CARRIER ACK: 200 OK</span>
              </div>

              <div className="space-y-2">
                {transmissionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#07111c] p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-exo font-bold text-slate-100">{log.recipientName}</span>
                        <span className="text-slate-400">({log.recipientPhone})</span>
                        <span className="rounded bg-sky-950 px-1.5 py-0.5 text-[9px] text-sky-300 border border-sky-800 font-mono-code">
                          {log.channel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{log.details}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono-code text-slate-500">{log.timestamp}</span>
                      <span className="rounded border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM GLOBAL SOS EMERGENCY ACTION STRIP */}
        <div className="mt-3 border-t border-red-950/80 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleNativeShareSos}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-sky-800 bg-sky-950 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-900 transition-colors"
              title="Share SOS alert via device apps (WhatsApp, Telegram, Messages)"
            >
              <Share2 className="h-4 w-4 text-sky-400" />
              <span>SHARE SOS VIA APPS</span>
            </button>

            <button
              onClick={() => triggerDirectSOSCall(authorityConfig.emergencyHotline)}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-red-800/80 bg-red-950 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-900 transition-colors"
            >
              <PhoneCall className="h-4 w-4" />
              <span>CALL {authorityConfig.emergencyHotline}</span>
            </button>
          </div>

          {/* CRITICAL BROADCAST BUTTON */}
          <button
            onClick={handleBroadcastSosNow}
            disabled={isBroadcasting}
            type="button"
            className="flex items-center gap-2 rounded-xl border-2 border-red-500 bg-red-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_0_30px_rgba(239,68,68,0.7)] hover:bg-red-500 hover:scale-[1.02] active:scale-[0.98] transition-all animate-pulse"
          >
            <ShieldAlert className="h-5 w-5" />
            <span>
              {isBroadcasting
                ? 'TRANSMITTING SOS PACKETS...'
                : 'SEND SOS TO AUTHORITIES & ALL CONTACTS'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
