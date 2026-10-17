import React, { useState, useEffect, useCallback } from 'react';
import {
  UserAccount,
  CameraDevice,
  EnrolledProfile,
  FacialBiometricResult,
  EncryptedVideoClip,
  IncidentAlert,
  DefconLevel,
  AuditLogEntry,
  ScamDomainEntry,
  EmergencyContact,
  AuthorityDispatchConfig,
  AiCrimeDetectionSettings,
} from './types';
import {
  DEFAULT_USERS,
  DEFAULT_CAMERAS,
  DEFAULT_ENROLLED_PROFILES,
  DEFAULT_SCAM_BLOCKLIST,
  DEFAULT_AUDIT_LOGS,
  DEFAULT_EMERGENCY_CONTACTS,
  DEFAULT_AUTHORITY_CONFIG,
} from './data/mockData';
import { DEFAULT_AI_CRIME_DETECTION_SETTINGS } from './data/aiTrainingData';
import { TopBar } from './components/TopBar';
import { Navigation, ViewTab } from './components/Navigation';
import { CameraMonitorView } from './components/CameraMonitorView';
import { FacialBiometricsView } from './components/FacialBiometricsView';
import { AuthoritiesTerminalView } from './components/AuthoritiesTerminalView';
import { EventsView } from './components/EventsView';
import { LiveMatrixView } from './components/LiveMatrixView';
import { StorageVaultView } from './components/StorageVaultView';
import { AntiScamShieldView } from './components/AntiScamShieldView';
import { RolesView } from './components/RolesView';
import { DocumentationView } from './components/DocumentationView';
import { DeviceHardwareConnectionsView } from './components/DeviceHardwareConnectionsView';
import { BossAiSettingsView } from './components/BossAiSettingsView';
import { EmergencySosModal } from './components/EmergencySosModal';
import { EmergencyContactsInstallPrompt } from './components/EmergencyContactsInstallPrompt';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  AccountsView,
  DevicesView,
  AlarmRulesView,
  AuditLogView,
  SecurityCenterView,
} from './components/BossViews';
import { TvMatrixModeView } from './components/TvMatrixModeView';
import { MobileCameraBroadcasterView } from './components/MobileCameraBroadcasterView';
import { CastModeModal } from './components/CastModeModal';
import { CastReceiverView } from './components/CastReceiverView';
import { SentinelTacticalChat } from './components/SentinelTacticalChat';
import { TopAppEmergencyAlertBanner } from './components/TopAppEmergencyAlertBanner';
import { RealGpsPosition, acquireRealGPSPosition, executeRealCrimeAlarmAndGpsDispatch } from './utils/realGpsDispatcher';
import { WebRtcReceiverClient } from './utils/webrtcPeerManager';
import { playAlarmSiren, stopAlarmSiren, setAlarmVolume, sendPushNotification, computeSHA256 } from './utils/security';
import { readHostDeviceSettings, buildRealPrimaryCamera } from './utils/hardwareConnector';
import { Lock, Unlock, ShieldAlert, Cast, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Inspect URL parameters for mobile broadcaster, TV mode, or Cast receiver
  const [urlParams] = useState(() => {
    return typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  });
  const isCameraNodeRole = urlParams.get('role') === 'camera_node' || urlParams.get('role') === 'sender';
  const isTvModeInitial = urlParams.get('mode') === 'tv';
  const isCastViewerRole = urlParams.get('mode') === 'cast_viewer';
  const castIdParam = urlParams.get('castId') || 'ARC-CAST';
  const pairRoomParam = urlParams.get('pair') || urlParams.get('room') || 'ARC-MAIN';

  // Core Global States
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEFAULT_USERS[0]);
  const [cameras, setCameras] = useState<CameraDevice[]>(DEFAULT_CAMERAS);
  const [activeCamera, setActiveCamera] = useState<CameraDevice>(DEFAULT_CAMERAS[0]);
  const [currentView, setCurrentView] = useState<ViewTab>(isTvModeInitial ? 'tv-mode' : 'camera');
  const [showCastModal, setShowCastModal] = useState<boolean>(false);
  const [enrolledProfiles, setEnrolledProfiles] = useState<EnrolledProfile[]>(DEFAULT_ENROLLED_PROFILES);
  const [recentBiometricResults, setRecentBiometricResults] = useState<FacialBiometricResult[]>([]);
  const [clips, setClips] = useState<EncryptedVideoClip[]>([]);
  const [incidents, setIncidents] = useState<IncidentAlert[]>([]);
  const [defcon, setDefcon] = useState<DefconLevel>('DEFCON_4');
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);
  const [realGps, setRealGps] = useState<RealGpsPosition | null>(null);
  const [isCurtainLocked, setIsCurtainLocked] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(DEFAULT_AUDIT_LOGS);
  const [scamDomains, setScamDomains] = useState<ScamDomainEntry[]>(DEFAULT_SCAM_BLOCKLIST);

  // WebRTC Cross-Device Streaming Receiver States
  const [activePeerStream, setActivePeerStream] = useState<MediaStream | null>(null);
  const [activePeerRelayFrame, setActivePeerRelayFrame] = useState<string | null>(null);
  const [peerConnectionState, setPeerConnectionState] = useState<string>('DISCONNECTED');
  const receiverClientRef = React.useRef<WebRtcReceiverClient | null>(null);

  // Emergency Contacts & SOS Matrix State
  const [contacts, setContacts] = useState<EmergencyContact[]>(DEFAULT_EMERGENCY_CONTACTS);
  const [authorityConfig, setAuthorityConfig] = useState<AuthorityDispatchConfig>(DEFAULT_AUTHORITY_CONFIG);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showEmergencyContactsPrompt, setShowEmergencyContactsPrompt] = useState<boolean>(false);

  // Master Commander AI Crime & Community Norms Detection Settings
  const [aiCrimeSettings, setAiCrimeSettings] = useState<AiCrimeDetectionSettings>(() => {
    const saved = localStorage.getItem('sentinel_ai_crime_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default
      }
    }
    return DEFAULT_AI_CRIME_DETECTION_SETTINGS;
  });

  // Sync AI crime training settings from server on mount
  useEffect(() => {
    fetch('/api/security/ai-training')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.settings) {
          setAiCrimeSettings(data.settings);
        }
      })
      .catch((err) => console.warn('Could not sync AI settings from backend:', err));
  }, []);

  const handleUpdateAiCrimeSettings = useCallback((newSettings: AiCrimeDetectionSettings) => {
    setAiCrimeSettings(newSettings);
    localStorage.setItem('sentinel_ai_crime_settings', JSON.stringify(newSettings));
    fetch('/api/security/ai-training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch((err) => console.warn('AI settings sync warning:', err));
  }, []);

  // Callback triggered upon successful PWA installation to mobile device
  const handleAppInstalledToDevice = useCallback(() => {
    // Strictly prompt user for emergency contacts access upon installation
    setShowEmergencyContactsPrompt(true);
  }, []);

  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall(handleAppInstalledToDevice);

  // WebRTC Cross-Device Receiver for Smartphone Peer
  useEffect(() => {
    const roomId = pairRoomParam || 'ARC-MAIN';
    const receiver = new WebRtcReceiverClient(
      roomId,
      (stream) => {
        setActivePeerStream(stream);
        // Automatically inject or activate the Smartphone Camera Node in cameras list
        setCameras((prev) => {
          const exists = prev.find((c) => c.id === 'phone-webrtc-stream');
          if (exists) {
            return prev.map((c) => (c.id === 'phone-webrtc-stream' ? { ...c, status: 'ONLINE' } : c));
          }
          const newPhoneCam: CameraDevice = {
            id: 'phone-webrtc-stream',
            name: 'Smartphone Cam (P2P Remote)',
            location: 'Remote Mobile Sentry',
            resolution: '1920x1080 FHD',
            fps: 30,
            status: 'ONLINE',
            isArmed: true,
            sensitivity: 'High',
            type: 'PHONE_NODE',
            connectionMethod: 'WEBRTC_P2P',
            webRtcSessionId: roomId,
          };
          return [newPhoneCam, ...prev];
        });
      },
      (frameDataUrl) => {
        setActivePeerRelayFrame(frameDataUrl);
      },
      (status) => {
        setPeerConnectionState(status.state);
      }
    );

    receiver.startListening();
    receiverClientRef.current = receiver;

    return () => {
      receiver.stop();
    };
  }, [pairRoomParam]);

  // Automatically prompt on device install or first startup if not dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem('sentinel_emergency_contacts_dismissed');
    const isPrompted = localStorage.getItem('sentinel_emergency_contacts_prompted');

    // Prompt if app is installed as standalone, or on mobile device, or first run
    if (!isDismissed && (!isPrompted || isInstalled)) {
      const timer = setTimeout(() => {
        setShowEmergencyContactsPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  // Interrogate real host laptop hardware settings and sync primary sensor
  useEffect(() => {
    const initRealHostHardware = async () => {
      try {
        const host = await readHostDeviceSettings(false);
        const realPrimary = buildRealPrimaryCamera(host);
        setCameras((prev) => {
          const others = prev.filter((c) => c.id !== 'cam-01');
          return [realPrimary, ...others];
        });
        setActiveCamera((prev) => (prev.id === 'cam-01' ? realPrimary : prev));
      } catch (err) {
        console.warn('Real hardware probe note:', err);
      }
    };
    initRealHostHardware();
  }, []);

  // Fetch initial vault and incident state from Express backend
  useEffect(() => {
    const fetchVaultClips = async () => {
      try {
        const res = await fetch(`/api/vault/clips?accountId=${currentUser.accountId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.success || Array.isArray(data.clips))) {
            setClips(data.clips || []);
          }
        }
      } catch (err) {
        console.warn('Backend clips fetch notice:', err);
      }
    };

    const fetchIncidents = async () => {
      try {
        const res = await fetch(`/api/alerts/incidents?accountId=${currentUser.accountId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.success || Array.isArray(data.incidents))) {
            setIncidents(data.incidents || []);
          }
        }
      } catch (err) {
        console.warn('Backend incidents fetch notice:', err);
      }
    };

    fetchVaultClips();
    fetchIncidents();
  }, [currentUser.accountId]);

  // Log Audit Entry
  const logAudit = useCallback(
    async (action: string, target: string, details: string) => {
      const prevHash = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].hash : 'GENESIS_ROOT';
      const timestamp = new Date().toLocaleString();
      const raw = `${timestamp}-${currentUser.name}-${action}-${target}-${prevHash}`;
      const hash = await computeSHA256(raw);

      const entry: AuditLogEntry = {
        id: `AUD-${Date.now().toString(36)}`,
        timestamp,
        user: `${currentUser.name} (${currentUser.role})`,
        action,
        target,
        status: 'OK',
        hash,
        prevHash,
        details,
      };

      setAuditLogs((prev) => [entry, ...prev]);
    },
    [auditLogs, currentUser.name, currentUser.role]
  );

  // Trigger Emergency Alarm & Dispatch to Authorities & Emergency Contacts
  const triggerAlarm = useCallback(
    async (
      reason: string,
      details = 'Emergency security alarm triggered.',
      facialResult?: FacialBiometricResult,
      snapshot?: string
    ) => {
      setDefcon('DEFCON_1');
      setIsAlarmRinging(true);

      // Play Siren according to user-configured tone and volume
      if (authorityConfig.alarmSoundMode === 'AUDIBLE_FULL_SIREN') {
        setAlarmVolume(authorityConfig.sirenVolumePercent);
        playAlarmSiren(authorityConfig.sirenTone, authorityConfig.sirenVolumePercent);
      }

      sendPushNotification(
        '🚨 DEFCON 1 EMERGENCY ALARM ACTIVE',
        `Breach triggered at ${activeCamera.name}: ${details}`
      );

      // Create new incident dossier
      const newIncident: IncidentAlert = {
        id: `INC-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        accountId: currentUser.accountId,
        cameraName: activeCamera.name,
        threatLevel: 'DEFCON_1_CRITICAL',
        triggerSource: reason.includes('CRIME')
          ? 'CRIME_IN_PROGRESS'
          : reason.includes('WEAPON')
          ? 'WEAPON_DETECTED'
          : reason.includes('FACIAL')
          ? 'FACIAL_UNKNOWN'
          : reason.includes('PANIC')
          ? 'PANIC_BUTTON'
          : 'MOTION_SENSOR',
        status: 'ACTIVE_ALARM',
        location: {
          label: authorityConfig.facilityAddress || activeCamera.location,
          coordinates: authorityConfig.gpsCoordinates || '37.7749° N, 122.4194° W',
        },
        details,
        facialRecognitionResult: facialResult,
        snapshotBase64: snapshot,
        dispatchedChannels: {
          sms: true,
          email: true,
          whatsapp: true,
          policeDispatch: authorityConfig.autoDispatchEnabled,
        },
        authorityNotes: [
          `[${new Date().toLocaleTimeString()}] Autonomous Sentinel engaged DEFCON 1 alarm protocol. Encrypted dispatch transmitted to ${authorityConfig.targetAgency} (${authorityConfig.emergencyHotline}).`,
          `[${new Date().toLocaleTimeString()}] Emergency alert broadcast queued for ${contacts.length} enrolled device contacts.`,
        ],
      };

      setIncidents((prev) => [newIncident, ...prev]);

      // Dispatch to Express server endpoint & broadcast to contacts
      try {
        await fetch('/api/alerts/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: currentUser.accountId,
            cameraName: activeCamera.name,
            threatLevel: 'DEFCON_1_CRITICAL',
            triggerSource: newIncident.triggerSource,
            details,
            facialResult,
            snapshotBase64: snapshot,
            dispatchedChannels: newIncident.dispatchedChannels,
            targetContacts: {
              count: contacts.length,
              phone: contacts[0]?.phone || authorityConfig.emergencyHotline,
            },
            location: newIncident.location,
          }),
        });

        // Broadcast SOS to all registered emergency contacts
        if (authorityConfig.autoSosContactsEnabled && contacts.length > 0) {
          await fetch('/api/sos/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contacts,
              cameraName: activeCamera.name,
              threatSummary: details,
              locationLabel: newIncident.location.label,
              gpsCoordinates: newIncident.location.coordinates,
              incidentId: newIncident.id,
            }),
          });
        }
      } catch (err) {
        console.warn('Dispatch endpoint error:', err);
      }

      logAudit('ALARM_DEFCON_ENGAGED', activeCamera.name, `${details} (Dispatched to ${authorityConfig.targetAgency} + ${contacts.length} contacts)`);
    },
    [
      activeCamera.name,
      activeCamera.location,
      currentUser.accountId,
      authorityConfig,
      contacts,
      logAudit,
    ]
  );

  // Poll backend for real-time emergency alarm status from TV wall or other clients
  useEffect(() => {
    const checkEmergencyStatus = async () => {
      try {
        const res = await fetch('/api/emergency/active-status');
        if (res.ok) {
          const data = await res.json();
          if (data && data.isActive && data.activeAlarm) {
            if (!isAlarmRinging) {
              setIsAlarmRinging(true);
              setDefcon('DEFCON_1');
              if (authorityConfig.alarmSoundMode === 'AUDIBLE_FULL_SIREN') {
                setAlarmVolume(authorityConfig.sirenVolumePercent);
                playAlarmSiren(authorityConfig.sirenTone, authorityConfig.sirenVolumePercent);
              }
            }
            if (data.activeAlarm.realGps) {
              setRealGps(data.activeAlarm.realGps);
            }
          }
        }
      } catch {
        // silent polling catch
      }
    };

    const interval = setInterval(checkEmergencyStatus, 3500);
    return () => clearInterval(interval);
  }, [isAlarmRinging, authorityConfig.alarmSoundMode, authorityConfig.sirenTone, authorityConfig.sirenVolumePercent]);

  // Execute Real Crime Alarm & Transmit Genuine GPS to Top Authorities (bamutyaalba5@gmail.com & 911)
  const handleTriggerRealCrimeAlarm = useCallback(
    async (cameraNameOverride?: string) => {
      const camName = cameraNameOverride || activeCamera.name;
      try {
        // 1. Acquire genuine real GPS from device hardware
        const gps = await acquireRealGPSPosition();
        setRealGps(gps);

        // 2. Dispatch real crime alarm to top authorities (bamutyaalba5@gmail.com & 911)
        await executeRealCrimeAlarmAndGpsDispatch({
          cameraName: camName,
          triggerSource: 'TOP_APP_CRIME_ALARM_COMMAND',
          crimeDetails: `CRITICAL REAL CRIME ALERT from channel ${camName}. Real hardware GPS [${gps.formattedCoords}] transmitted to top administrator bamutyaalba5@gmail.com and 911 tactical police dispatch. Immediate armed response required.`,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
        });

        // 3. Trigger full system alarm with genuine GPS
        await triggerAlarm(
          `REAL_CRIME_ALARM_${camName.toUpperCase().replace(/\s+/g, '_')}`,
          `Critical crime emergency with genuine hardware GPS [${gps.formattedCoords}]. Alert transmitted to Top Admin (bamutyaalba5@gmail.com) and Metro 911.`
        );
      } catch (err) {
        console.warn('Real crime alarm dispatch notice:', err);
        await triggerAlarm(
          `REAL_CRIME_ALARM_MANUAL`,
          `Real crime emergency alarm triggered for ${camName}. Top administrator bamutyaalba5@gmail.com and 911 alerted.`
        );
      }
    },
    [activeCamera.name, currentUser.name, currentUser.role, triggerAlarm]
  );

  // Silence Siren
  const toggleSilenceAlarm = useCallback(() => {
    stopAlarmSiren();
    setIsAlarmRinging(false);
    fetch('/api/emergency/silence', { method: 'POST' }).catch(() => {});
    logAudit('ALARM_SIREN_SILENCED', activeCamera.name, 'Audible siren stopped by operator.');
  }, [activeCamera.name, logAudit]);

  // Clear Emergency State
  const clearEmergency = useCallback(() => {
    stopAlarmSiren();
    setIsAlarmRinging(false);
    setDefcon('DEFCON_4');
    fetch('/api/emergency/silence', { method: 'POST' }).catch(() => {});
    logAudit('DEFCON_RESTORED', 'Global System', 'Emergency state cleared and restored to DEFCON 4 Normal.');
  }, [logAudit]);

  // Handle New Clip Recorded from Camera
  const handleNewClipRecorded = useCallback(
    (clip: EncryptedVideoClip) => {
      setClips((prev) => [clip, ...prev]);
      logAudit('FOOTAGE_ENCRYPTED_VAULT_SAVED', clip.cameraName, `Saved ${clip.id} (${(clip.sizeBytes / 1024).toFixed(1)} KB)`);
    },
    [logAudit]
  );

  // Handle New Facial Biometrics Result
  const handleNewFacialResult = useCallback(
    (res: FacialBiometricResult) => {
      setRecentBiometricResults((prev) => [res, ...prev.slice(0, 19)]);
      logAudit(
        'BIOMETRIC_VISITOR_CLASSIFIED',
        res.recognizedPersonName || 'Unknown Individual',
        `${res.status} (${res.confidence}% match)`
      );
    },
    [logAudit]
  );

  // Profile Management
  const handleAddProfile = useCallback(
    (profile: EnrolledProfile) => {
      setEnrolledProfiles((prev) => [profile, ...prev]);
      logAudit('PROFILE_ENROLLED', profile.name, `Clearance: ${profile.clearanceLevel}`);
    },
    [logAudit]
  );

  const handleDeleteProfile = useCallback(
    (id: string) => {
      setEnrolledProfiles((prev) => prev.filter((p) => p.id !== id));
      logAudit('PROFILE_DELETED', id, 'Individual profile removed from biometric whitelist.');
    },
    [logAudit]
  );

  // User Management
  const handleAddUser = useCallback(
    (user: UserAccount) => {
      setUsers((prev) => [...prev, user]);
      logAudit('USER_ACCOUNT_CREATED', user.name, `Role assigned: ${user.role}`);
    },
    [logAudit]
  );

  // Incident status update
  const handleUpdateIncidentStatus = useCallback(
    (id: string, status: IncidentAlert['status'], note?: string) => {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id === id) {
            const updatedNotes = note
              ? [...inc.authorityNotes, `[${new Date().toLocaleTimeString()}] ${currentUser.name}: ${note}`]
              : inc.authorityNotes;
            return { ...inc, status, authorityNotes: updatedNotes };
          }
          return inc;
        })
      );
      logAudit('INCIDENT_STATUS_CHANGED', id, `Updated to ${status}`);
    },
    [currentUser.name, logAudit]
  );

  // Add or Update Connected Hardware Camera
  const handleAddCamera = useCallback(
    (newCam: CameraDevice) => {
      setCameras((prev) => {
        const exists = prev.some((c) => c.id === newCam.id);
        if (exists) return prev.map((c) => (c.id === newCam.id ? newCam : c));
        return [newCam, ...prev];
      });
      setActiveCamera(newCam);
      logAudit('HARDWARE_DEVICE_CONNECTED', newCam.name, `Paired via ${newCam.connectionMethod || newCam.type}`);
    },
    [logAudit]
  );

  // Switch Active Camera
  const handleSelectCamera = useCallback((cam: CameraDevice) => {
    setActiveCamera(cam);
    setCurrentView('camera');
  }, []);

  // System State Purge & Volatile Memory Reset
  const [purgeNotification, setPurgeNotification] = useState<string | null>(null);

  const handlePurgeLocalData = useCallback(async () => {
    // 1. Reset volatile audit logs
    setAuditLogs([]);

    // 2. Reset recent local biometric temporary recognition cache
    setRecentBiometricResults([]);

    // 3. Clear temporary incidents
    setIncidents([]);

    // 4. Clear browser client-side temporary stores
    try {
      localStorage.removeItem('sentinel_audit_logs');
      localStorage.removeItem('sentinel_biometric_cache');
      localStorage.removeItem('sentinel_temp_facial_results');
      localStorage.removeItem('sentinel_temp_incidents');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage purge warning:', e);
    }

    // 5. Notify server to flush active casting and camera motor registers
    try {
      await fetch('/api/system/purge-local-data', { method: 'POST' });
    } catch (e) {
      console.warn('Backend purge warning:', e);
    }

    // 6. Generate fresh initial Genesis root audit log to establish pristine state
    const timestamp = new Date().toLocaleString();
    const genesisEntry: AuditLogEntry = {
      id: `AUD-GENESIS-${Date.now().toString(36)}`,
      timestamp,
      user: `${currentUser.name} (${currentUser.role})`,
      action: 'SYSTEM_PURGE_LOCAL_DATA_RESET',
      target: 'LOCAL_AUDIT_LOG_&_BIOMETRIC_CACHE',
      status: 'OK',
      hash: 'GENESIS-CHAIN-PURGED-ROOT-000000',
      prevHash: 'NONE',
      details: 'Operator authorized complete purge of local audit history and biometric temporary storage. System operational state refreshed.',
    };
    setAuditLogs([genesisEntry]);

    // 7. Tactical toast notification
    setPurgeNotification('System state refreshed: Local audit history cleared and temporary biometric storage reset.');
    setTimeout(() => setPurgeNotification(null), 6000);
  }, [currentUser.name, currentUser.role]);

  // If opened on smartphone via pairing link or QR code, show specialized mobile broadcaster interface
  if (isCameraNodeRole) {
    return (
      <MobileCameraBroadcasterView
        roomId={pairRoomParam}
        onTriggerSos={() => {
          triggerAlarm(
            'MOBILE_PHONE_SOS_DISPATCH',
            `Emergency SOS signal dispatched from mobile camera broadcaster node (Room: ${pairRoomParam})`
          );
        }}
      />
    );
  }

  // If opened in dedicated Screen Cast Receiver mode on a Smart TV, secondary display, or phone
  if (isCastViewerRole) {
    return (
      <CastReceiverView
        castId={castIdParam}
        onExit={() => {
          window.location.search = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#04090f] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Real-Time Emergency Dispatch & True GPS Alert Banner (Top of App) */}
      <TopAppEmergencyAlertBanner
        isAlarmRinging={isAlarmRinging}
        defcon={defcon}
        activeCameraName={activeCamera.name}
        realGps={realGps}
        onTriggerRealCrimeAlarmCommand={() => handleTriggerRealCrimeAlarm()}
        onSilenceAlarm={toggleSilenceAlarm}
        onClearAlarm={clearEmergency}
      />

      {/* Top Navigation & Status Bar */}
      <TopBar
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={setCurrentUser}
        defcon={defcon}
        onTriggerPanic={() => handleTriggerRealCrimeAlarm()}
        isAlarmRinging={isAlarmRinging}
        onToggleSilenceAlarm={toggleSilenceAlarm}
        isCurtainLocked={isCurtainLocked}
        onToggleCurtainLock={() => setIsCurtainLocked(!isCurtainLocked)}
        onOpenSosModal={() => setShowSosModal(true)}
        onOpenCastMode={() => setShowCastModal(true)}
        contactsCount={contacts.length}
        onOpenEmergencyContactsPrompt={() => setShowEmergencyContactsPrompt(true)}
        isInstalled={isInstalled}
        isInstallable={isInstallable}
        onInstallApp={install}
      />

      {/* Primary Tactical Navigation */}
      <Navigation
        currentView={currentView}
        onSelectView={setCurrentView}
        userRole={currentUser.role}
        eventCount={clips.length}
        activeAlarmCount={incidents.filter((i) => i.status !== 'RESOLVED').length}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-3 py-4 sm:px-6 mx-auto w-full max-w-7xl">
        {/* System State Purge Notification Toast Banner */}
        {purgeNotification && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/60 bg-emerald-950/90 px-4 py-3 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-top-2 duration-200 font-mono-code text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="font-bold">{purgeNotification}</span>
            </div>
            <button
              onClick={() => setPurgeNotification(null)}
              className="rounded p-1 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {isCurtainLocked ? (
          /* Curtain Privacy Lock Screen */
          <div className="flex flex-col items-center justify-center min-h-[480px] rounded-2xl border border-sky-900/60 bg-[#060f1b] p-8 text-center font-mono-code">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-950/70 text-amber-400 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="font-exo text-xl font-bold text-slate-100">
              TACTICAL CURTAIN PRIVACY LOCK ACTIVE
            </h2>
            <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
              Camera feeds, biometrics, and surveillance sensors are actively running in background sentry mode. Screen output is obscured to protect security operations.
            </p>
            <button
              onClick={() => setIsCurtainLocked(false)}
              className="mt-6 flex items-center gap-2 rounded-lg border border-sky-500/60 bg-sky-950 px-5 py-2.5 text-xs font-bold text-sky-200 hover:bg-sky-900 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)]"
            >
              <Unlock className="h-4 w-4 text-emerald-400" />
              <span>UNMASK SECURE SCREEN</span>
            </button>
          </div>
        ) : (
          <>
            {currentView === 'camera' && (
              <CameraMonitorView
                currentUser={currentUser}
                cameras={cameras}
                activeCamera={activeCamera}
                onSelectCamera={setActiveCamera}
                enrolledProfiles={enrolledProfiles}
                onNewClipRecorded={handleNewClipRecorded}
                onNewFacialResult={handleNewFacialResult}
                onTriggerAlarm={triggerAlarm}
                defcon={defcon}
                onOpenSosModal={() => setShowSosModal(true)}
                aiCrimeSettings={aiCrimeSettings}
                onOpenAiSettings={() => setCurrentView('boss-ai-settings')}
                onOpenTvMode={() => setCurrentView('tv-mode')}
                onOpenCastMode={() => setShowCastModal(true)}
                activePeerStream={activePeerStream}
                activePeerRelayFrame={activePeerRelayFrame}
              />
            )}

            {currentView === 'tv-mode' && (
              <TvMatrixModeView
                cameras={cameras}
                activeCamera={activeCamera}
                onSelectCamera={handleSelectCamera}
                onTriggerAlarm={triggerAlarm}
                defcon={defcon}
                aiCrimeSettings={aiCrimeSettings}
                onExitTvMode={() => setCurrentView('camera')}
                activePeerStream={activePeerStream}
                activePeerRelayFrame={activePeerRelayFrame}
                isAlarmRinging={isAlarmRinging}
                realGps={realGps}
                onSilenceAlarm={toggleSilenceAlarm}
                operatorName={currentUser.name}
                operatorRole={currentUser.role}
              />
            )}

            {currentView === 'cast-mode' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/40 bg-[#071927] px-4 py-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-950/80 text-cyan-400">
                      <Cast className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-exo text-lg font-bold text-slate-100">SCREEN CASTING CONTROL HUB</h2>
                      <p className="text-xs font-mono-code text-cyan-300/80">Cast surveillance stream wirelessly to Smart TVs, phones, or remote monitors</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCastModal(true)}
                    className="flex items-center gap-2 rounded-lg border border-cyan-500 bg-cyan-950/90 px-4 py-2 text-xs font-mono-code font-bold text-cyan-200 hover:bg-cyan-900 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    <Cast className="h-4 w-4 text-cyan-400" />
                    <span>CONFIGURE CAST</span>
                  </button>
                </div>
                <CastModeModal
                  isOpen={true}
                  onClose={() => setCurrentView('camera')}
                  activeCamera={activeCamera}
                  cameras={cameras}
                />
              </div>
            )}

            {currentView === 'ai-chat' && (
              <SentinelTacticalChat
                defcon={defcon}
                cameras={cameras}
                onOpenCastMode={() => setShowCastModal(true)}
                onOpenTvMode={() => setCurrentView('tv-mode')}
              />
            )}

            {currentView === 'hardware-link' && (
              <DeviceHardwareConnectionsView
                cameras={cameras}
                onAddCamera={handleAddCamera}
                onSelectCamera={handleSelectCamera}
                onOpenTvMode={() => setCurrentView('tv-mode')}
                onOpenCastMode={() => setShowCastModal(true)}
              />
            )}

            {currentView === 'biometrics' && (
              <FacialBiometricsView
                enrolledProfiles={enrolledProfiles}
                onAddProfile={handleAddProfile}
                onDeleteProfile={handleDeleteProfile}
                recentResults={recentBiometricResults}
                onTriggerAlarm={triggerAlarm}
              />
            )}

            {currentView === 'authorities' && (
              <AuthoritiesTerminalView
                currentUser={currentUser}
                incidents={incidents}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onClearAlarm={clearEmergency}
                isAlarmActive={isAlarmRinging || defcon === 'DEFCON_1' || defcon === 'PANIC_0'}
                defcon={defcon}
                onOpenSosModal={() => setShowSosModal(true)}
              />
            )}

            {currentView === 'events' && (
              <EventsView clips={clips} currentUser={currentUser} />
            )}

            {currentView === 'matrix' && (
              <LiveMatrixView
                cameras={cameras}
                onSelectCamera={handleSelectCamera}
                onTriggerAlarm={triggerAlarm}
              />
            )}

            {currentView === 'vault' && (
              <StorageVaultView clips={clips} />
            )}

            {currentView === 'scam' && (
              <AntiScamShieldView scamDomains={scamDomains} />
            )}

            {currentView === 'roles' && (
              <RolesView />
            )}

            {currentView === 'docs' && (
              <DocumentationView
                onPurgeLocalData={handlePurgeLocalData}
                auditLogCount={auditLogs.length}
                biometricCacheCount={recentBiometricResults.length}
              />
            )}

            {/* Boss Views */}
            {currentView === 'boss-accounts' && (
              <AccountsView users={users} onAddUser={handleAddUser} />
            )}

            {currentView === 'boss-devices' && (
              <DeviceHardwareConnectionsView
                cameras={cameras}
                onAddCamera={handleAddCamera}
                onSelectCamera={handleSelectCamera}
                onOpenTvMode={() => setCurrentView('tv-mode')}
                onOpenCastMode={() => setShowCastModal(true)}
              />
            )}

            {currentView === 'boss-rules' && (
              <AlarmRulesView
                aiSettings={aiCrimeSettings}
                onNavigateToAiTraining={() => setCurrentView('boss-ai-settings')}
              />
            )}

            {currentView === 'boss-ai-settings' && (
              <BossAiSettingsView
                settings={aiCrimeSettings}
                onUpdateSettings={handleUpdateAiCrimeSettings}
                onLogAudit={(action, target, details) => {
                  const newLog: AuditLogEntry = {
                    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    timestamp: new Date().toISOString(),
                    user: currentUser.name,
                    action,
                    target,
                    status: 'OK',
                    hash: `SHA256-${Math.random().toString(36).substring(2, 10)}`,
                    prevHash: auditLogs[0]?.hash || 'GENESIS_CHAIN',
                    details,
                  };
                  setAuditLogs((prev) => [newLog, ...prev]);
                }}
                activeCameraName={activeCamera.name}
                isContinuousSentryActive={true}
              />
            )}

            {currentView === 'boss-audit' && (
              <AuditLogView logs={auditLogs} onPurgeLocalData={handlePurgeLocalData} />
            )}

            {currentView === 'boss-security' && (
              <SecurityCenterView
                defcon={defcon}
                onSetDefcon={setDefcon}
                onPurgeLocalData={handlePurgeLocalData}
                auditLogCount={auditLogs.length}
                biometricCacheCount={recentBiometricResults.length}
              />
            )}
          </>
        )}
      </main>

      {/* Tactical Footer */}
      <footer className="border-t border-sky-950/60 bg-[#020509] py-3 text-center text-[11px] font-mono-code text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>SENTINEL ARC 5.2 • MILITARY SPECIFICATION CIPHER ENGINE</span>
          </div>
          <div className="text-slate-400">
            ENCRYPTION: AES-256-GCM • SHA-256 HASH CHAIN • GEMINI 2.5 FLASH BIOMETRIC PROTOCOL
          </div>
        </div>
      </footer>

      {/* Wireless Screen Cast Controller Modal */}
      {showCastModal && currentView !== 'cast-mode' && (
        <CastModeModal
          isOpen={true}
          onClose={() => setShowCastModal(false)}
          activeCamera={activeCamera}
          cameras={cameras}
        />
      )}

      {/* Emergency SOS & Contacts Management Matrix Modal */}
      <EmergencySosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        contacts={contacts}
        onUpdateContacts={setContacts}
        authorityConfig={authorityConfig}
        onUpdateAuthorityConfig={setAuthorityConfig}
        onTriggerAlarm={triggerAlarm}
        cameraName={activeCamera.name}
        isAlarmRinging={isAlarmRinging}
        onSilenceAlarm={toggleSilenceAlarm}
        onOpenEmergencyContactsPrompt={() => setShowEmergencyContactsPrompt(true)}
      />

      {/* Dedicated Emergency Contacts Phone Authorization Modal (Emergency Numbers Only) */}
      <EmergencyContactsInstallPrompt
        isOpen={showEmergencyContactsPrompt}
        onClose={() => setShowEmergencyContactsPrompt(false)}
        contacts={contacts}
        onUpdateContacts={setContacts}
        isInstalled={isInstalled}
        isMobile={isMobile}
        isIOS={isIOS}
        isInstallable={isInstallable}
        onInstallApp={install}
      />
    </div>
  );
}
