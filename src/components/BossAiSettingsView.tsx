import React, { useState, useEffect, useRef } from 'react';
import {
  AiCrimeDetectionSettings,
  AiTrainingContentItem,
  TrainingMethod,
  BehaviorCategory,
} from '../types';
import {
  BrainCircuit,
  Sliders,
  Clock,
  Video,
  FileText,
  Activity,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Play,
  Pause,
  UploadCloud,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Zap,
  Sparkles,
  RefreshCw,
  Layers,
  Timer,
  Info,
  Check,
} from 'lucide-react';

interface BossAiSettingsViewProps {
  settings: AiCrimeDetectionSettings;
  onUpdateSettings: (newSettings: AiCrimeDetectionSettings) => void;
  onLogAudit: (action: string, target: string, details: string) => void;
  activeCameraName?: string;
  isContinuousSentryActive?: boolean;
}

export const BossAiSettingsView: React.FC<BossAiSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onLogAudit,
  activeCameraName = 'Master Commander Primary Cam',
  isContinuousSentryActive = true,
}) => {
  // Local working copy for settings
  const [currentSettings, setCurrentSettings] = useState<AiCrimeDetectionSettings>(settings);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRIME' | 'NORMAL' | 'VIDEO' | 'GESTURE' | 'TEXT' | 'ACOUSTIC'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Live Study Timer Simulator for UI feedback
  const [simulatedTimeElapsed, setSimulatedTimeElapsed] = useState<number>(0);
  const [simulatedVerdict, setSimulatedVerdict] = useState<'STUDYING' | 'NORMAL_VERIFIED' | 'CRIME_CONFIRMED'>('STUDYING');
  const [simulatedConfidence, setSimulatedConfidence] = useState<number>(94);
  const [simulatedMatchedRule, setSimulatedMatchedRule] = useState<string>('Casual Community Transit');
  const timerIntervalRef = useRef<number | null>(null);

  // New Training Item Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMethod, setFormMethod] = useState<TrainingMethod>('VIDEO_DEMO');
  const [formCategory, setFormCategory] = useState<BehaviorCategory>('CRIME_UNACCEPTABLE');
  const [formCrimeType, setFormCrimeType] = useState('BURGLARY_FORCED_BREACH');
  const [formSeverity, setFormSeverity] = useState<'BENIGN_NORMAL' | 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL_EMERGENCY'>('CRITICAL_EMERGENCY');
  const [formDescription, setFormDescription] = useState('');
  const [formDistinction, setFormDistinction] = useState('');
  const [formStudyTime, setFormStudyTime] = useState<number>(2.5);
  const [formStanceName, setFormStanceName] = useState('Aggressive Body Stance');
  const [formKineticIntensity, setFormKineticIntensity] = useState<'LOW_REST' | 'MODERATE_NORMAL' | 'HIGH_SUDDEN' | 'VIOLENT_EXPLOSIVE'>('VIOLENT_EXPLOSIVE');
  const [formVideoFileName, setFormVideoFileName] = useState('');
  const [formSoundType, setFormSoundType] = useState('GLASS_BREAK');

  // Video playback preview state
  const [activePreviewVideo, setActivePreviewVideo] = useState<string | null>(null);

  // Sync props if changed externally
  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  // Live Study Timer loop to simulate the AI continuously studying the monitored area over time
  useEffect(() => {
    const targetStudy = currentSettings.temporalStudyWindowSeconds || 4.5;
    let elapsed = 0;
    const interval = window.setInterval(() => {
      elapsed += 0.2;
      if (elapsed >= targetStudy) {
        setSimulatedTimeElapsed(Number(targetStudy.toFixed(1)));
        setSimulatedVerdict('NORMAL_VERIFIED');
        setSimulatedConfidence(96.2);
        setSimulatedMatchedRule('Community Paved Sidewalk Transit (Acceptable)');
        setTimeout(() => {
          elapsed = 0;
          setSimulatedVerdict('STUDYING');
        }, 3000);
      } else {
        setSimulatedTimeElapsed(Number(elapsed.toFixed(1)));
        setSimulatedVerdict('STUDYING');
      }
    }, 200);

    return () => clearInterval(interval);
  }, [currentSettings.temporalStudyWindowSeconds]);

  // Handle save & push to active engine
  const handleSaveSettings = () => {
    onUpdateSettings(currentSettings);
    onLogAudit(
      'AI_TRAINING_SETTINGS_UPDATED',
      'Gemini Vision & Neural Engine',
      `Study window: ${currentSettings.temporalStudyWindowSeconds}s. Active rules: ${currentSettings.trainingItems.length}. Continuous Sentry: ACTIVE.`
    );
    setSaveSuccessNotice('AI Crime Detection Engine & Community Rules updated successfully! Changes actively enforced on live streams.');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Add new item to training library
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newItem: AiTrainingContentItem = {
      id: `TRN-${Date.now().toString(36).toUpperCase()}`,
      title: formTitle.trim(),
      method: formMethod,
      category: formCategory,
      crimeType: formCategory === 'CRIME_UNACCEPTABLE' ? formCrimeType : undefined,
      severity: formCategory === 'COMMUNITY_NORMAL_ACCEPTABLE' ? 'BENIGN_NORMAL' : formSeverity,
      description: formDescription.trim() || 'Custom training input provided by Master Commander.',
      distinctionCriteria:
        formDistinction.trim() ||
        (formCategory === 'CRIME_UNACCEPTABLE'
          ? 'Distinguished by anomalous trajectory, weapon silhouette, or hostile kinetics.'
          : 'Distinguished by peaceful speed, non-threatening open posture, and normal community routine.'),
      studyTimeRequirementSeconds: Number(formStudyTime) || 2.5,
      dateAdded: new Date().toLocaleString(),
      addedBy: 'Master Commander',
      status: 'ACTIVE_ENFORCED',
      gestureKinematics:
        formMethod === 'GESTURE_MOVEMENT'
          ? {
              stanceName: formStanceName,
              bodyPostures: [formStanceName, 'Limb trajectory tracking', 'Biomechanical kinetic analysis'],
              intensity: formKineticIntensity,
            }
          : undefined,
      videoDemo:
        formMethod === 'VIDEO_DEMO'
          ? {
              fileName: formVideoFileName || 'custom_cctv_demonstration.mp4',
              durationSeconds: Math.round(formStudyTime * 4),
              annotatedKeyframesCount: Math.round(formStudyTime * 12),
              sampleClipType: formCategory === 'CRIME_UNACCEPTABLE' ? 'BREAK_IN' : 'NORMAL_DELIVERY',
              taggedCrimeMoments: [
                `00:01.0 - Movement entered study window`,
                `00:${formStudyTime.toFixed(1)} - Evaluated as ${formCategory.replace(/_/g, ' ')}`,
              ],
            }
          : undefined,
      audioAcoustic:
        formMethod === 'ACOUSTIC_SIGNATURE'
          ? {
              soundType: formSoundType,
              decibelThreshold: 80,
              frequencyPattern: 'Acoustic envelope threshold matched to incident profile',
            }
          : undefined,
    };

    const updatedItems = [newItem, ...currentSettings.trainingItems];
    const updated = {
      ...currentSettings,
      trainingItems: updatedItems,
    };

    setCurrentSettings(updated);
    onUpdateSettings(updated);
    onLogAudit(
      'AI_TRAINING_ITEM_ADDED',
      newItem.title,
      `Method: ${newItem.method} | Category: ${newItem.category} | Study Time: ${newItem.studyTimeRequirementSeconds}s`
    );

    // Reset form
    setFormTitle('');
    setFormDescription('');
    setFormDistinction('');
    setFormVideoFileName('');
    setIsAddModalOpen(false);

    setSaveSuccessNotice(`Added new training content: "${newItem.title}". Active on live AI vision.`);
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Toggle item active/standby
  const handleToggleStatus = (id: string) => {
    const updatedItems = currentSettings.trainingItems.map((item) => {
      if (item.id === id) {
        const nextStatus: AiTrainingContentItem['status'] =
          item.status === 'ACTIVE_ENFORCED' ? 'STANDBY' : 'ACTIVE_ENFORCED';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    const updated = { ...currentSettings, trainingItems: updatedItems };
    setCurrentSettings(updated);
    onUpdateSettings(updated);
  };

  // Delete training item
  const handleDeleteItem = (id: string, title: string) => {
    const updatedItems = currentSettings.trainingItems.filter((i) => i.id !== id);
    const updated = { ...currentSettings, trainingItems: updatedItems };
    setCurrentSettings(updated);
    onUpdateSettings(updated);
    onLogAudit('AI_TRAINING_ITEM_DELETED', title, `Removed rule ${id}`);
  };

  // Filter items
  const filteredItems = currentSettings.trainingItems.filter((item) => {
    if (selectedFilter === 'CRIME') return item.category === 'CRIME_UNACCEPTABLE';
    if (selectedFilter === 'NORMAL') return item.category === 'COMMUNITY_NORMAL_ACCEPTABLE';
    if (selectedFilter === 'VIDEO') return item.method === 'VIDEO_DEMO';
    if (selectedFilter === 'GESTURE') return item.method === 'GESTURE_MOVEMENT';
    if (selectedFilter === 'TEXT') return item.method === 'TEXT_DESCRIPTION' || item.method === 'COMMUNITY_NORM_RULE';
    if (selectedFilter === 'ACOUSTIC') return item.method === 'ACOUSTIC_SIGNATURE';
    return true;
  });

  return (
    <div className="space-y-5 font-mono-code text-xs">
      {/* Top Banner: Real-time Continuity & Commander Authority */}
      <div className="rounded-xl border border-sky-900/50 bg-[#061220] p-4 shadow-lg shadow-sky-950/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-950/80 text-sky-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-exo text-sm font-bold text-white tracking-wide">
                <span>MASTER COMMANDER: AI CRIME DETECTION & COMMUNITY BEHAVIORAL SETTINGS</span>
                <span className="rounded border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] text-emerald-300">
                  REAL-TIME ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Train AI with crime demonstration videos, body gestures, text rules, and configure situational study time.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-sky-400/60 bg-sky-600 px-3.5 py-2 font-bold text-white hover:bg-sky-500 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)]"
            >
              <Plus className="h-4 w-4" /> ADD CONTENT / TRAIN AI
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-700 px-3.5 py-2 font-bold text-white hover:bg-emerald-600 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Check className="h-4 w-4" /> APPLY & PUSH TO AI
            </button>
          </div>
        </div>

        {/* Real-time Continuity Guarantee Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-950 bg-[#030913] px-3 py-2 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold">CONTINUAL SENTRY ACTIVE:</span>
            <span className="text-slate-300">
              Live surveillance on "{activeCameraName}" continues running without interruption while Master Commander updates AI rules.
            </span>
          </div>
          <div className="text-slate-400">
            Trained Rules in Memory: <span className="font-bold text-sky-300">{currentSettings.trainingItems.length}</span>
          </div>
        </div>

        {saveSuccessNotice && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-950/80 px-3 py-2 text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* Temporal Study & Detection Time Gauges (Requested: Time for detection to study the situation at a given time) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Detection Time Settings Panel */}
        <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-950 pb-2.5">
            <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
              <Timer className="h-4 w-4 text-amber-400" />
              <span>SITUATIONAL STUDY TIME & TEMPORAL DETECTION WINDOW</span>
            </div>
            <span className="text-[10px] text-slate-400">Defeats false alarms via continuous dwell study</span>
          </div>

          <div className="space-y-4">
            {/* Primary Study Window Slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-300">
                  GLOBAL OBSERVATION STUDY WINDOW: {currentSettings.temporalStudyWindowSeconds.toFixed(1)} SECONDS
                </span>
                <span className="text-slate-400">
                  {currentSettings.temporalStudyWindowSeconds < 2.0
                    ? 'Ultra-Fast Response'
                    : currentSettings.temporalStudyWindowSeconds <= 5.0
                    ? 'Balanced Verification'
                    : 'Deep Forensic Observation'}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.5"
                value={currentSettings.temporalStudyWindowSeconds}
                onChange={(e) =>
                  setCurrentSettings({
                    ...currentSettings,
                    temporalStudyWindowSeconds: parseFloat(e.target.value),
                  })
                }
                className="mt-2 w-full accent-sky-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>1.0s (Fast Tactical)</span>
                <span>4.5s (Recommended Standard)</span>
                <span>10.0s</span>
                <span>15.0s (High Precision Dwell)</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                The duration the AI camera stream must continuously monitor body motion kinetics, object trajectories, and environmental context before delivering a definitive normal vs. criminal verdict.
              </p>
            </div>

            {/* Granular Detection Time Controls */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-sky-950 pt-3">
              <div className="rounded-lg border border-sky-950 bg-[#030913] p-2.5">
                <div className="text-red-400 font-bold text-[11px]">URGENT VIOLENT CRIME</div>
                <div className="text-slate-400 text-[10px] mt-0.5">Weapons / Physical Assault</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="number"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={currentSettings.studyTimeForUrgentCrimeSeconds}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        studyTimeForUrgentCrimeSeconds: parseFloat(e.target.value) || 1.0,
                      })
                    }
                    className="w-16 rounded border border-red-900/60 bg-[#07111c] px-2 py-1 text-white font-bold text-xs"
                  />
                  <span className="text-slate-300 text-xs">sec</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Immediate siren trigger threshold</div>
              </div>

              <div className="rounded-lg border border-sky-950 bg-[#030913] p-2.5">
                <div className="text-amber-400 font-bold text-[11px]">LOITERING & PROWLING</div>
                <div className="text-slate-400 text-[10px] mt-0.5">Perimeter boundary lurking</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="number"
                    min="3.0"
                    max="60.0"
                    step="1.0"
                    value={currentSettings.studyTimeForLoiteringSeconds}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        studyTimeForLoiteringSeconds: parseFloat(e.target.value) || 15.0,
                      })
                    }
                    className="w-16 rounded border border-amber-900/60 bg-[#07111c] px-2 py-1 text-white font-bold text-xs"
                  />
                  <span className="text-slate-300 text-xs">sec</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Allows deliveries without alarm</div>
              </div>

              <div className="rounded-lg border border-sky-950 bg-[#030913] p-2.5">
                <div className="text-emerald-400 font-bold text-[11px]">COMMUNITY NORMAL VERIFY</div>
                <div className="text-slate-400 text-[10px] mt-0.5">Walking / Peaceful activity</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="number"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={currentSettings.studyTimeForNormalVerificationSeconds}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        studyTimeForNormalVerificationSeconds: parseFloat(e.target.value) || 3.0,
                      })
                    }
                    className="w-16 rounded border border-emerald-900/60 bg-[#07111c] px-2 py-1 text-white font-bold text-xs"
                  />
                  <span className="text-slate-300 text-xs">sec</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Time to verify acceptable state</div>
              </div>
            </div>

            {/* Checkbox settings */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-950 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.autoDispatchOnConfirmedCrime}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      autoDispatchOnConfirmedCrime: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-sky-400 rounded"
                />
                <span className="text-slate-200">Automatically notify authorities when crime is confirmed after study time</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.continuousRealTimeObservation}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      continuousRealTimeObservation: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-sky-400 rounded"
                />
                <span className="text-slate-200">Non-stop background sentry observation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Detection Latency & Analysis Clock Visualizer */}
        <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sky-950 pb-2.5">
              <div className="flex items-center gap-1.5 font-exo text-sm font-bold text-slate-100">
                <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>LIVE STUDY TIMER & VERDICT</span>
              </div>
              <span className="text-[10px] text-emerald-400">ACTIVE</span>
            </div>

            {/* Time Taken Counter Display */}
            <div className="mt-4 rounded-xl border border-sky-950 bg-[#030913] p-4 text-center">
              <div className="text-[10px] font-mono-code uppercase tracking-wider text-slate-400">
                TIME TAKEN TO STUDY SITUATION
              </div>
              <div className="mt-1 flex items-baseline justify-center gap-1 font-exo text-3xl font-extrabold text-sky-400">
                <span>{simulatedTimeElapsed.toFixed(1)}</span>
                <span className="text-sm font-mono-code text-slate-400">
                  / {currentSettings.temporalStudyWindowSeconds.toFixed(1)}s
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-200 ${
                    simulatedVerdict === 'CRIME_CONFIRMED'
                      ? 'bg-red-500'
                      : simulatedVerdict === 'NORMAL_VERIFIED'
                      ? 'bg-emerald-400'
                      : 'bg-sky-400'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (simulatedTimeElapsed / currentSettings.temporalStudyWindowSeconds) * 100
                    )}%`,
                  }}
                />
              </div>

              {/* Current Status Badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold">
                {simulatedVerdict === 'STUDYING' ? (
                  <span className="border-sky-500/40 bg-sky-950/60 text-sky-300 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin text-sky-400" />
                    STUDYING SITUATION IN AREA...
                  </span>
                ) : simulatedVerdict === 'NORMAL_VERIFIED' ? (
                  <span className="border-emerald-500/40 bg-emerald-950/60 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    NORMAL COMMUNITY STATE CONFIRMED
                  </span>
                ) : (
                  <span className="border-red-500/40 bg-red-950/60 text-red-300 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    UNACCEPTABLE CRIME DETECTED
                  </span>
                )}
              </div>
            </div>

            {/* Matched Community Pattern Metric */}
            <div className="mt-3 rounded-lg border border-sky-950 bg-[#040a14] p-3 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Evaluated Pattern:</span>
                <span className="font-bold text-slate-200">{simulatedMatchedRule}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>AI Confidence:</span>
                <span className="font-bold text-emerald-400">{simulatedConfidence}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Confirmation Latency:</span>
                <span className="font-bold text-sky-300">
                  {simulatedTimeElapsed < currentSettings.temporalStudyWindowSeconds
                    ? 'In Progress'
                    : `${simulatedTimeElapsed}s achieved`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-500 italic">
            * The AI continuously verifies motion velocity and posture consistency over this temporal window to prevent false triggers.
          </div>
        </div>
      </div>

      {/* Methods to Add Content & Training Library Filter */}
      <div className="rounded-xl border border-sky-900/40 bg-[#07111c] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-950 pb-3">
          <div>
            <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
              <Layers className="h-4 w-4 text-sky-400" />
              <span>TRAINING KNOWLEDGE BASE: CRIMES VS. NORMAL COMMUNITY BEHAVIORS</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Multi-modal content library: Demonstration Videos, Body Gesture Kinetics, Legal Text Statutes, & Acoustic Patterns.
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: `ALL (${currentSettings.trainingItems.length})` },
              { id: 'CRIME', label: 'CRIMES (UNACCEPTABLE)' },
              { id: 'NORMAL', label: 'COMMUNITY NORMAL' },
              { id: 'VIDEO', label: 'VIDEOS' },
              { id: 'GESTURE', label: 'BODY GESTURES' },
              { id: 'TEXT', label: 'TEXT & RULES' },
              { id: 'ACOUSTIC', label: 'ACOUSTIC' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-mono-code transition-all ${
                  selectedFilter === tab.id
                    ? 'bg-sky-600 font-bold text-white shadow-sm'
                    : 'bg-[#030913] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-sky-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Training Content Cards Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const isCrime = item.category === 'CRIME_UNACCEPTABLE';
            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isCrime
                    ? 'border-red-900/50 bg-gradient-to-b from-[#140609] to-[#0a0508]'
                    : 'border-emerald-900/50 bg-gradient-to-b from-[#051410] to-[#040c0a]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.method === 'VIDEO_DEMO' && <Video className="h-4 w-4 text-sky-400" />}
                      {item.method === 'GESTURE_MOVEMENT' && <Activity className="h-4 w-4 text-purple-400" />}
                      {item.method === 'TEXT_DESCRIPTION' && <FileText className="h-4 w-4 text-amber-400" />}
                      {item.method === 'COMMUNITY_NORM_RULE' && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                      {item.method === 'ACOUSTIC_SIGNATURE' && <Volume2 className="h-4 w-4 text-orange-400" />}

                      <span className="rounded bg-black/40 px-1.5 py-0.2 text-[9px] font-mono-code text-slate-300 border border-slate-700/50">
                        {item.method.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                        isCrime
                          ? 'border-red-500/40 bg-red-950/80 text-red-300'
                          : 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300'
                      }`}
                    >
                      {isCrime ? 'CRIME / UNACCEPTABLE' : 'COMMUNITY NORMAL'}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="mt-2 font-exo text-sm font-bold text-white leading-tight">
                    {item.title}
                  </h4>

                  {/* Description */}
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  {/* Distinction Criteria (How AI Distinguishes it) */}
                  <div className="mt-2 rounded bg-black/50 p-2 border border-slate-800 text-[10px] text-slate-300 space-y-1">
                    <div className="font-bold text-sky-400 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>HOW AI DISTINGUISHES THIS:</span>
                    </div>
                    <div className="text-slate-400 italic leading-tight">
                      "{item.distinctionCriteria}"
                    </div>
                  </div>

                  {/* Gesture or Video specific preview box */}
                  {item.gestureKinematics && (
                    <div className="mt-2 rounded border border-purple-900/40 bg-purple-950/20 p-2 text-[10px] text-purple-300">
                      <span className="font-bold">Kinetic Signature:</span> {item.gestureKinematics.stanceName} • Intensity: {item.gestureKinematics.intensity}
                    </div>
                  )}

                  {item.videoDemo && (
                    <div className="mt-2 flex items-center justify-between rounded border border-sky-900/40 bg-sky-950/20 p-2 text-[10px] text-sky-300">
                      <div className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">{item.videoDemo.fileName}</span>
                      </div>
                      <button
                        onClick={() => setActivePreviewVideo(item.videoDemo?.fileName || 'training_demo.mp4')}
                        className="rounded bg-sky-800 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-sky-700"
                      >
                        PLAY CLIP
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer of Card */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
                  <div className="flex items-center gap-1 text-amber-300 font-bold">
                    <Clock className="h-3 w-3" />
                    <span>Study Time: {item.studyTimeRequirementSeconds}s</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`rounded px-1.5 py-0.5 text-[9px] border ${
                        item.status === 'ACTIVE_ENFORCED'
                          ? 'border-emerald-500/40 bg-emerald-950 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {item.status === 'ACTIVE_ENFORCED' ? 'ACTIVE' : 'STANDBY'}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                      title="Delete training item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add New Content / Train AI on Crime & Normal Behaviors */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-sky-500/50 bg-[#071322] p-6 shadow-[0_0_30px_rgba(56,189,248,0.2)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sky-900 pb-3">
              <div className="flex items-center gap-2 font-exo text-base font-bold text-white">
                <BrainCircuit className="h-5 w-5 text-sky-400" />
                <span>ADD AI TRAINING CONTENT & COMMUNITY NORMS</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="mt-4 space-y-4 text-xs">
              {/* Category: Crime vs Community Normal */}
              <div>
                <label className="block font-bold text-sky-300 mb-1">CLASSIFICATION CATEGORY</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormCategory('CRIME_UNACCEPTABLE')}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 font-bold transition-all ${
                      formCategory === 'CRIME_UNACCEPTABLE'
                        ? 'border-red-500 bg-red-950 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'border-slate-800 bg-[#030913] text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                    <span>UNACCEPTABLE CRIME IN COMMUNITY</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormCategory('COMMUNITY_NORMAL_ACCEPTABLE')}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 font-bold transition-all ${
                      formCategory === 'COMMUNITY_NORMAL_ACCEPTABLE'
                        ? 'border-emerald-500 bg-emerald-950 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'border-slate-800 bg-[#030913] text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>COMMUNITY NORMAL & ACCEPTABLE</span>
                  </button>
                </div>
              </div>

              {/* Training Input Method */}
              <div>
                <label className="block font-bold text-sky-300 mb-1">TRAINING METHOD / INPUT TYPE</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'VIDEO_DEMO' as TrainingMethod, label: 'SHOW VIDEO', icon: Video },
                    { id: 'GESTURE_MOVEMENT' as TrainingMethod, label: 'BODY GESTURE', icon: Activity },
                    { id: 'TEXT_DESCRIPTION' as TrainingMethod, label: 'TEXT RULE', icon: FileText },
                    { id: 'COMMUNITY_NORM_RULE' as TrainingMethod, label: 'COMMUNITY NORM', icon: ShieldCheck },
                    { id: 'ACOUSTIC_SIGNATURE' as TrainingMethod, label: 'ACOUSTIC', icon: Volume2 },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormMethod(m.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all ${
                          formMethod === m.id
                            ? 'border-sky-400 bg-sky-950 text-white font-bold'
                            : 'border-slate-800 bg-[#030913] text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <Icon className="h-4 w-4 text-sky-400" />
                        <span className="text-[10px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Basic Details */}
              <div>
                <label className="block font-bold text-slate-200 mb-1">RULE / DEMONSTRATION TITLE</label>
                <input
                  type="text"
                  placeholder="e.g., Nighttime Fence Climbing with Backpack"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-sky-900 bg-[#030811] px-3 py-2 text-white outline-none focus:border-sky-400"
                  required
                />
              </div>

              {/* Specific Method Fields */}
              {formMethod === 'VIDEO_DEMO' && (
                <div className="rounded-xl border border-sky-900/60 bg-[#030811] p-3 space-y-3">
                  <div className="font-bold text-sky-400 flex items-center gap-1.5">
                    <Video className="h-4 w-4" />
                    <span>DEMONSTRATION VIDEO UPLOAD & KEYFRAME TAGGING</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Upload recorded footage or CCTV clips to train the AI's visual neural model on how this specific crime or normal event appears on camera.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormVideoFileName(e.target.files[0].name);
                        }
                      }}
                      className="hidden"
                      id="video-upload-input"
                    />
                    <label
                      htmlFor="video-upload-input"
                      className="flex items-center gap-2 rounded-lg border border-sky-600 bg-sky-950 px-3 py-2 cursor-pointer font-bold text-sky-200 hover:bg-sky-900"
                    >
                      <UploadCloud className="h-4 w-4" />
                      <span>{formVideoFileName ? `SELECTED: ${formVideoFileName}` : 'CHOOSE VIDEO FILE (.MP4, .WEBM)'}</span>
                    </label>
                    <span className="text-slate-500 text-[10px]">{formVideoFileName || 'No file selected'}</span>
                  </div>
                </div>
              )}

              {formMethod === 'GESTURE_MOVEMENT' && (
                <div className="rounded-xl border border-purple-900/60 bg-[#030811] p-3 space-y-3">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <Activity className="h-4 w-4" />
                    <span>BODY GESTURE & KINETIC MOVEMENT SIGNATURE</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-bold mb-1">STANCE / POSE TEMPLATE</label>
                      <select
                        value={formStanceName}
                        onChange={(e) => setFormStanceName(e.target.value)}
                        className="w-full rounded border border-purple-900/60 bg-[#06101d] px-2.5 py-1.5 text-white"
                      >
                        <option value="Combat Tactical Draw & Extension">Combat Tactical Draw & Extension</option>
                        <option value="Leverage Prying / Door Forcing Stance">Leverage Prying / Door Forcing Stance</option>
                        <option value="Aggressive Lunge / Striking Stance">Aggressive Lunge / Striking Stance</option>
                        <option value="Low-Crouch Stealth Prowling">Low-Crouch Stealth Prowling</option>
                        <option value="Surrender Hands-Up Distress">Surrender Hands-Up Distress</option>
                        <option value="Casual Upright Transit Stroll">Casual Upright Transit Stroll (Normal)</option>
                        <option value="Open-Palm Friendly Greeting">Open-Palm Friendly Greeting (Normal)</option>
                        <option value="Key Insertion at Lock">Key Insertion at Lock (Normal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-bold mb-1">KINETIC INTENSITY LEVEL</label>
                      <select
                        value={formKineticIntensity}
                        onChange={(e) => setFormKineticIntensity(e.target.value as any)}
                        className="w-full rounded border border-purple-900/60 bg-[#06101d] px-2.5 py-1.5 text-white"
                      >
                        <option value="VIOLENT_EXPLOSIVE">VIOLENT_EXPLOSIVE (Immediate Attack)</option>
                        <option value="HIGH_SUDDEN">HIGH_SUDDEN (Prowling/Prying)</option>
                        <option value="MODERATE_NORMAL">MODERATE_NORMAL (Everyday routine)</option>
                        <option value="LOW_REST">LOW_REST (Peaceful standing/sitting)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Time for Detection / Situational Study Requirement */}
              <div className="rounded-xl border border-amber-900/60 bg-[#030811] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>TIME FOR DETECTION / STUDY DURATION: {formStudyTime.toFixed(1)} SECONDS</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Time AI must study this action</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.5"
                  value={formStudyTime}
                  onChange={(e) => setFormStudyTime(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="text-[10px] text-slate-400">
                  Controls how long the AI accumulates video frames before declaring whether this specific movement is acceptable or a crime.
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  BEHAVIORAL DESCRIPTION & SENSORY ATTRIBUTES
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the visual, postural, and behavioral signs the AI should look for..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg border border-sky-900 bg-[#030811] px-3 py-2 text-white outline-none focus:border-sky-400"
                  required
                />
              </div>

              {/* Distinction Criteria */}
              <div>
                <label className="block font-bold text-sky-400 mb-1">
                  DISTINCTION CRITERIA (HOW TO DISTINGUISH FROM NORMAL / INNOCENT ACTION)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain exactly how the AI differentiates this from benign everyday community behavior (e.g. key vs lockpick, phone vs weapon)..."
                  value={formDistinction}
                  onChange={(e) => setFormDistinction(e.target.value)}
                  className="w-full rounded-lg border border-sky-900 bg-[#030811] px-3 py-2 text-white outline-none focus:border-sky-400"
                  required
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-sky-900 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>SAVE & TRAIN AI ENGINE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Demonstration Playback Preview Modal */}
      {activePreviewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-sky-500/50 bg-[#071322] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sky-900 pb-3">
              <div className="flex items-center gap-2 font-exo text-sm font-bold text-white">
                <Video className="h-4 w-4 text-sky-400" />
                <span>TRAINING CLIP PLAYBACK: {activePreviewVideo}</span>
              </div>
              <button
                onClick={() => setActivePreviewVideo(null)}
                className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="mt-4 rounded-xl overflow-hidden border border-sky-950 bg-black aspect-video flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-transparent to-black/40">
                <div className="text-center p-4">
                  <div className="h-12 w-12 rounded-full border border-sky-400/50 bg-sky-950/80 flex items-center justify-center mx-auto text-sky-400 mb-2">
                    <Play className="h-6 w-6 ml-1" />
                  </div>
                  <div className="font-bold text-white text-sm">CCTV TRAINING KEYFRAME STREAM</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Simulated high-framerate kinetic breakdown with edge detection & thermal overlay
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-sky-300 font-mono-code bg-black/70 px-2 py-1 rounded">
                <span>TAGGED FRAMES: 36/36</span>
                <span>STATUS: PARSED BY AI VISION ENGINE</span>
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                onClick={() => setActivePreviewVideo(null)}
                className="rounded-lg border border-sky-600 bg-sky-950 px-4 py-1.5 text-xs font-bold text-sky-200"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
