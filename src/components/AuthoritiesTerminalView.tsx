import React, { useState } from 'react';
import {
  IncidentAlert,
  UserAccount,
  DefconLevel,
} from '../types';
import {
  playAlarmSiren,
  stopAlarmSiren,
  triggerDirectSOSCall,
  triggerEmergencySMS,
  triggerEmergencyWhatsApp,
} from '../utils/security';
import {
  Siren,
  ShieldAlert,
  PhoneCall,
  MessageSquare,
  Radio,
  Send,
  CheckCircle2,
  AlertOctagon,
  Clock,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
  Compass,
  FileCheck,
  Building,
  Car,
} from 'lucide-react';

interface AuthoritiesTerminalViewProps {
  currentUser: UserAccount;
  incidents: IncidentAlert[];
  onUpdateIncidentStatus: (id: string, status: IncidentAlert['status'], note?: string) => void;
  onClearAlarm: () => void;
  isAlarmActive: boolean;
  defcon: DefconLevel;
  onOpenSosModal?: () => void;
}

export const AuthoritiesTerminalView: React.FC<AuthoritiesTerminalViewProps> = ({
  currentUser,
  incidents,
  onUpdateIncidentStatus,
  onClearAlarm,
  isAlarmActive,
  defcon,
  onOpenSosModal,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentAlert | null>(
    incidents.length > 0 ? incidents[0] : null
  );
  const [authorityPhone, setAuthorityPhone] = useState<string>('911');
  const [patrolMobile, setPatrolMobile] = useState<string>('+1 555-0199');
  const [dispatchNote, setDispatchNote] = useState<string>('');
  const [isSirenMuted, setIsSirenMuted] = useState<boolean>(!isAlarmActive);

  const activeIncidents = incidents.filter((inc) => inc.status !== 'RESOLVED');

  const handleStatusChange = (status: IncidentAlert['status']) => {
    if (!selectedIncident) return;
    onUpdateIncidentStatus(selectedIncident.id, status, dispatchNote);
    setSelectedIncident({
      ...selectedIncident,
      status,
      authorityNotes: dispatchNote
        ? [...selectedIncident.authorityNotes, `[${new Date().toLocaleTimeString()}] ${currentUser.name}: ${dispatchNote}`]
        : selectedIncident.authorityNotes,
    });
    setDispatchNote('');
  };

  return (
    <div className="space-y-4">
      {/* EMERGENCY STROBE BANNER FOR ACTIVE ALARMS */}
      {isAlarmActive && (
        <div className="alarm-strobe rounded-xl border-2 border-red-500 bg-red-950/80 p-4 text-white shadow-[0_0_40px_rgba(239,68,68,0.7)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 animate-bounce">
                <Siren className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="font-exo text-lg font-extrabold tracking-wider text-red-100 uppercase">
                  🚨 ACTIVE DEFCON 1 EMERGENCY PROTOCOL ENGAGED
                </div>
                <div className="text-xs font-mono-code text-red-200">
                  Breach or Panic SOS triggered • Direct encrypted transmission to emergency responders active
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  stopAlarmSiren();
                  setIsSirenMuted(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-900/90 px-3 py-1.5 text-xs font-mono-code font-bold hover:bg-red-800"
              >
                <VolumeX className="h-4 w-4" /> SILENCE AUDIBLE SIREN
              </button>

              <button
                onClick={onClearAlarm}
                className="flex items-center gap-1.5 rounded-lg border border-white bg-white px-3 py-1.5 text-xs font-mono-code font-bold text-red-950 hover:bg-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> CLEAR EMERGENCY STATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHORITIES TERMINAL HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900/50 bg-[#12070c] px-4 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/50 bg-red-950/80 text-red-400">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-base font-bold text-slate-100">
              <span className="text-red-400">AUTHORITIES TERMINAL & SOS DISPATCH</span>
              <span className="rounded border border-red-500/40 bg-red-950/80 px-2 py-0.5 text-[10px] font-mono-code font-bold text-red-300">
                RESTRICTED: LAW ENFORCEMENT & 911 PATROL
              </span>
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Direct Phone SOS • Encrypted SMS • WhatsApp Responder Protocol • Live Suspect Biometrics
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSosModal && (
            <button
              onClick={onOpenSosModal}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-red-500/60 bg-red-950 px-3 py-1.5 text-xs font-mono-code font-bold text-red-200 hover:bg-red-900 transition-colors shadow-sm"
            >
              <Radio className="h-4 w-4 text-red-400" />
              <span>SOS & CONTACTS</span>
            </button>
          )}

          <div className="rounded border border-red-900/60 bg-[#180a10] px-3 py-1.5 text-xs font-mono-code text-red-300">
            ACTIVE ALARMS: <span className="font-bold text-white">{activeIncidents.length}</span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DISPATCH STAGE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT COLUMN: ACTIVE INCIDENTS QUEUE (5 COLS) */}
        <div className="space-y-3 lg:col-span-5">
          <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-3 font-mono-code text-xs">
            <div className="flex items-center justify-between border-b border-sky-950/60 pb-2 text-slate-400">
              <span className="font-bold uppercase text-slate-300">INCIDENT DISPATCH QUEUE</span>
              <span>{incidents.length} Records</span>
            </div>

            <div className="mt-2 divide-y divide-sky-950/60 overflow-y-auto max-h-[560px]">
              {incidents.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No emergency incidents logged. System in normal defensive perimeter posture.
                </div>
              ) : (
                incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`cursor-pointer p-3 transition-colors ${
                        isSelected
                          ? 'bg-red-950/40 border-l-4 border-red-500'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                inc.status === 'ACTIVE_ALARM'
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : inc.status === 'DISPATCHED'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-emerald-900/80 text-emerald-300'
                              }`}
                            >
                              {inc.status.replace(/_/g, ' ')}
                            </span>
                            <span className="font-exo font-bold text-sm text-slate-100">
                              {inc.cameraName}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-300 line-clamp-1">
                            {inc.details}
                          </div>
                        </div>

                        <div className="text-right text-[10px] text-slate-400">
                          {new Date(inc.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Trigger: {inc.triggerSource}</span>
                        <span className="text-red-400 font-bold">{inc.threatLevel}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INCIDENT DOSSIER & REAL ACTIONS (7 COLS) */}
        <div className="space-y-3 lg:col-span-7">
          {selectedIncident ? (
            <div className="rounded-xl border border-red-900/40 bg-[#0a0d16] p-4 font-mono-code text-xs text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-950/80 pb-3">
                <div>
                  <div className="font-exo text-base font-bold text-white">
                    INCIDENT ID: <span className="text-red-400">{selectedIncident.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Location: {selectedIncident.location.label} • {new Date(selectedIncident.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-red-950/80 px-2 py-1 text-xs font-bold text-red-300 border border-red-800/40">
                    {selectedIncident.threatLevel}
                  </span>
                </div>
              </div>

              {/* Suspect Photo & Biometric AI Analysis */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-sky-950 bg-[#05080f] p-3">
                <div className="sm:col-span-1">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Captured Frame</div>
                  {selectedIncident.snapshotBase64 ? (
                    <img
                      src={selectedIncident.snapshotBase64}
                      alt="Incident frame"
                      className="h-28 w-full rounded object-cover border border-red-900/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded bg-slate-900 text-slate-600">
                      No frame attached
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-1.5 text-xs">
                  <div className="text-[10px] text-sky-400 uppercase font-bold">Biometric Intelligence</div>
                  {selectedIncident.facialRecognitionResult ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          Status: {selectedIncident.facialRecognitionResult.status}
                        </span>
                        <span className="text-slate-400">
                          ({selectedIncident.facialRecognitionResult.confidence}% match)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {selectedIncident.facialRecognitionResult.tacticalSummary}
                      </p>
                      {selectedIncident.facialRecognitionResult.attributes?.expression && (
                        <div className="text-[10px] text-slate-400">
                          Expression: {selectedIncident.facialRecognitionResult.attributes.expression} •
                          Threat: {selectedIncident.facialRecognitionResult.threatLevel}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-400">
                      Autonomous motion sensor tripped. Intrusion analysis completed.
                    </div>
                  )}
                  <div className="text-[11px] text-red-300 mt-2">
                    Breach Details: {selectedIncident.details}
                  </div>
                </div>
              </div>

              {/* REAL PROTOCOL DISPATCH ACTIONS (SMS, WHATSAPP, CALL 911) */}
              <div className="mt-4 rounded-lg border border-red-900/60 bg-[#16060c] p-3">
                <div className="font-exo text-sm font-bold text-red-200 uppercase mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  <span>ENGAGE REAL EMERGENCY RESPONSE PROTOCOLS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* DIRECT 911 / POLICE PHONE CALL */}
                  <button
                    onClick={() => triggerDirectSOSCall(authorityPhone)}
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-500 bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>CALL 911 POLICE</span>
                  </button>

                  {/* EMERGENCY SMS TO TACTICAL PATROL */}
                  <button
                    onClick={() =>
                      triggerEmergencySMS(
                        patrolMobile,
                        selectedIncident.cameraName,
                        selectedIncident.details,
                        selectedIncident.location.label
                      )
                    }
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-950 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-900"
                  >
                    <MessageSquare className="h-4 w-4 text-sky-400" />
                    <span>DISPATCH SMS</span>
                  </button>

                  {/* EMERGENCY WHATSAPP DISPATCH */}
                  <button
                    onClick={() =>
                      triggerEmergencyWhatsApp(
                        patrolMobile,
                        selectedIncident.cameraName,
                        selectedIncident.details,
                        selectedIncident.location.label
                      )
                    }
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-950 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-900"
                  >
                    <Radio className="h-4 w-4 text-emerald-400" />
                    <span>WHATSAPP SOS</span>
                  </button>
                </div>

                {/* Editable Dispatch Contacts */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-400">Emergency 911 Line:</label>
                    <input
                      type="text"
                      value={authorityPhone}
                      onChange={(e) => setAuthorityPhone(e.target.value)}
                      className="mt-1 w-full rounded border border-red-900/60 bg-[#080205] px-2 py-1 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400">Tactical Patrol Mobile (SMS/WhatsApp):</label>
                    <input
                      type="text"
                      value={patrolMobile}
                      onChange={(e) => setPatrolMobile(e.target.value)}
                      className="mt-1 w-full rounded border border-red-900/60 bg-[#080205] px-2 py-1 text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* INCIDENT STATUS PROGRESSION PIPELINE */}
              <div className="mt-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                  Update Response Pipeline:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange('DISPATCHED')}
                    className="flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/80 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-900"
                  >
                    <Car className="h-3 w-3" /> MARK DISPATCHED
                  </button>
                  <button
                    onClick={() => handleStatusChange('EN_ROUTE')}
                    className="flex items-center gap-1 rounded border border-sky-500/50 bg-sky-950/80 px-2.5 py-1 text-[11px] text-sky-300 hover:bg-sky-900"
                  >
                    <Compass className="h-3 w-3" /> UNITS EN ROUTE
                  </button>
                  <button
                    onClick={() => handleStatusChange('ON_SCENE')}
                    className="flex items-center gap-1 rounded border border-indigo-500/50 bg-indigo-950/80 px-2.5 py-1 text-[11px] text-indigo-300 hover:bg-indigo-900"
                  >
                    <Building className="h-3 w-3" /> ON SCENE
                  </button>
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-950/80 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900"
                  >
                    <CheckCircle2 className="h-3 w-3" /> MARK RESOLVED
                  </button>
                </div>
              </div>

              {/* DISPATCH NOTES LOG */}
              <div className="mt-4 border-t border-sky-950/80 pt-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Incident Log & Authority Notes:
                </div>
                <div className="space-y-1 text-[11px] text-slate-300 max-h-24 overflow-y-auto">
                  {selectedIncident.authorityNotes.length === 0 ? (
                    <div className="text-slate-500 italic">No notes logged yet.</div>
                  ) : (
                    selectedIncident.authorityNotes.map((note, idx) => (
                      <div key={idx} className="rounded bg-[#040912] p-1.5">
                        {note}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={dispatchNote}
                    onChange={(e) => setDispatchNote(e.target.value)}
                    placeholder="Add dispatcher note or responder update..."
                    className="flex-1 rounded border border-sky-900/60 bg-[#030811] px-3 py-1 text-xs text-white outline-none"
                  />
                  <button
                    onClick={() => handleStatusChange(selectedIncident.status)}
                    className="flex items-center gap-1 rounded bg-sky-700 px-3 py-1 font-bold text-white hover:bg-sky-600"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>ADD NOTE</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-sky-950 bg-[#07111c] text-slate-500 font-mono-code text-xs">
              Select an incident from the queue to view details and dispatch responders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
