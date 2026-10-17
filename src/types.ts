export type Role = 'BOSS' | 'ADMIN' | 'OPERATOR' | 'AUTHORITY' | 'VIEWER';

export type DefconLevel = 'DEFCON_4' | 'DEFCON_3' | 'DEFCON_2' | 'DEFCON_1' | 'PANIC_0';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: Role;
  title: string;
  accountId: string;
  email: string;
  phone: string;
  badgeNumber?: string;
  twoFactorEnabled: boolean;
  avatarInitials: string;
}

export type ConnectionMethod = 'USB_DIRECT' | 'BLUETOOTH_LE' | 'WIFI_HOTSPOT_CAST' | 'LOCAL_NETWORK_IP' | 'WEBRTC_P2P' | 'TV_SCREEN_DISPLAY' | 'WIRELESS_SCREEN_CAST';

export interface RealHardwareSensorInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
  groupId: string;
  facingMode?: string;
}

export interface RealUsbDeviceInfo {
  productName?: string;
  manufacturerName?: string;
  vendorIdHex: string;
  productIdHex: string;
  serialNumber?: string;
  usbVersion?: string;
}

export interface HostDeviceSettings {
  osName: string;
  osVersionDetails: string;
  browser: string;
  userAgent: string;
  deviceModel: string;
  hardwareManufacturer: string;
  ipAddress: string;
  localCandidateIps: string[];
  connectionType: string;
  downlinkSpeedMbps?: number;
  rttMs?: number;
  webUsbSupported: boolean;
  webBluetoothSupported: boolean;
  presentationSupported: boolean;
  mediaDevicesAvailable: number;
  bluetoothPairedDevicesCount: number;
  usbConnectedDevicesCount: number;
  hotspotActive: boolean;
  hotspotSsid: string;
  hotspotGatewayIp: string;

  // Real Hardware Diagnostics
  cpuCores: number;
  memoryGb?: number;
  gpuVendor?: string;
  gpuRenderer?: string;
  screenResolution: string;
  screenColorDepth: number;
  devicePixelRatio: number;
  screenOrientation?: string;
  touchPoints: number;
  architecture?: string;
  battery?: {
    levelPercent: number;
    isCharging: boolean;
    chargingTime?: number | null;
    dischargingTime?: number | null;
  };
  hasMediaPermission: boolean;
  realCameras: RealHardwareSensorInfo[];
  realMicrophones: RealHardwareSensorInfo[];
  realAudioOutputs: RealHardwareSensorInfo[];
  realUsbDevices: RealUsbDeviceInfo[];
}

export interface ConnectedDeviceSettings {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  manufacturer: string;
  osVersion: string;
  connectionMethod: ConnectionMethod;
  transportDetails: {
    usb?: {
      vendorId: number | string;
      productId: number | string;
      serialNumber?: string;
      usbVersion?: string;
      busSpeed?: string;
    };
    bluetooth?: {
      gattServerConnected: boolean;
      serviceUuids: string[];
      rssiDbm: number;
      txPower?: number;
    };
    wifiCast?: {
      ssid: string;
      localIp: string;
      subnetMask?: string;
      signalQualityPercent: number;
      castProtocol: 'PRESENTATION_API' | 'WEBRTC_HOTSPOT_P2P' | 'RTSP_DIRECT';
      port: number;
    };
  };
  cameraSpecs: {
    sensorName: string;
    resolution: string;
    fps: number;
    facingMode: 'user' | 'environment' | 'external';
    fovDegrees?: number;
    hasNightVision: boolean;
    audioInputEnabled: boolean;
  };
  powerStatus: {
    batteryLevelPercent: number;
    isCharging: boolean;
    powerSource: 'BATTERY' | 'USB_POWER' | 'AC_ADAPTER' | 'POE';
  };
  securityHandshake: {
    mutualTlsOrToken: string;
    pairingTimestamp: string;
    handshakeVerified: boolean;
    latencyMs: number;
  };
}

export interface CameraDevice {
  id: string;
  name: string;
  type: 'HARDWARE_WEBCAM' | 'PHONE_NODE' | 'WEBRTC_PHONE_STREAM' | 'RTSP_STREAM' | 'IP_SECURITY_CAM' | 'DOORBELL' | 'USB_CAM' | 'BLUETOOTH_CAM' | 'WIFI_CAST_CAM';
  resolution: string;
  fps: number;
  status: 'ONLINE' | 'STANDBY' | 'RECORDING' | 'OFFLINE';
  location: string;
  isArmed: boolean;
  sensitivity: 'Low' | 'Medium' | 'High' | 'Armed';
  streamUrl?: string;
  pairingCode?: string;
  batteryLevel?: number;
  deviceId?: string;
  connectionMethod?: ConnectionMethod;
  connectedDeviceSettings?: ConnectedDeviceSettings;
  webRtcSessionId?: string;
  webRtcMetrics?: {
    latencyMs: number;
    fps: number;
    networkType: 'CELLULAR_DATA' | 'WIFI' | 'ETHERNET';
    encryption: string;
    bitrateKbps: number;
    iceState: string;
  };
}

export interface WebRtcPeerSession {
  roomId: string;
  cameraName: string;
  createdAt: number;
  lastActive: number;
  senderConnected: boolean;
  receiverConnected: boolean;
  deviceInfo?: {
    model: string;
    batteryLevel?: number;
    isCharging?: boolean;
    networkType?: string;
    facingMode?: string;
    resolution?: string;
    fps?: number;
  };
  hasRelayFrame: boolean;
}

export interface TvScreenConfig {
  id: string;
  name: string;
  ip: string;
  lastSeen: number;
  resolution: string;
  activeLayout: '2x2' | '3x3' | '1+5' | '4x2' | 'FULL_PATROL';
  autoPatrol: boolean;
  displayAiOverlays: boolean;
}

export interface EnrolledProfile {
  id: string;
  name: string;
  relationship: 'Family Member' | 'Resident' | 'Security Staff' | 'Authorized Visitor' | 'Delivery/Courier' | 'Contractor';
  clearanceLevel: 'LEVEL_1_UNRESTRICTED' | 'LEVEL_2_ESCORT_REQUIRED' | 'LEVEL_3_LIMITED_HOURS' | 'RESTRICTED';
  photoBase64: string;
  enrolledAt: string;
  notes?: string;
  accessCount: number;
  lastSeen?: string;
}

export interface FacialBiometricResult {
  personDetected: boolean;
  faceCount: number;
  status: 'RECOGNIZED_AUTHORIZED' | 'UNKNOWN_VISITOR' | 'SUSPICIOUS_INTRUDER';
  recognizedPersonName?: string;
  clearanceLevel?: string;
  confidence: number;
  attributes?: {
    estimatedAgeRange?: string;
    faceCovering?: string;
    eyewear?: string;
    expression?: string;
    clothingDescription?: string;
  };
  threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  threatIndicators: string[];
  recommendedAction: 'LOG_ONLY' | 'CHIME_GREETING' | 'WARN_INTERCOM' | 'DISPATCH_AUTHORITY' | 'ENGAGE_SIREN';
  tacticalSummary: string;
  snapshotBase64?: string;
  timestamp: string;

  // Ultra-sensitive Blur & Crime Vision Attributes
  crimeDetected?: boolean;
  crimeType?: string;
  weaponsVisible?: string[];
  isBlurryOrLowLight?: boolean;
  imageQualityAssessment?: string;
  immediateAlarmDispatchRequired?: boolean;
  visionMode?: 'STANDARD' | 'BLUR_ENHANCED' | 'LOW_LIGHT' | 'CRIME_GUARD';
  visionSensorMode?: 'NORMAL_HD' | 'NIGHT_VISION' | 'THERMAL_FLIR';

  // Kinetic Body Action & Triggering Factors Analysis
  bodyActionAnalysis?: {
    actionName: string;
    isNormalLifeEvent: boolean;
    confidence: number;
    kineticIntensity: 'LOW_REST' | 'MODERATE_NORMAL' | 'HIGH_SUDDEN' | 'VIOLENT_EXPLOSIVE';
    description: string;
    triggeringFactorsDetected: string[];
  };

  // Thermal Heat Detection Signature
  thermalSignature?: {
    heatAnomalyDetected: boolean;
    coreTempReadingCelsius: number;
    heatDistribution: string;
    coldConcealmentDetected: boolean;
  };

  // Temporal Study & Community Norms Evaluation
  timeTakenSeconds?: number;
  temporalStudyWindowSeconds?: number;
  communityStatus?: 'ACCEPTABLE_NORMAL' | 'COMMUNITY_VIOLATION_CRIME' | 'INCONCLUSIVE_STUDYING';
  matchedTrainingRules?: string[];
}

export type TrainingMethod =
  | 'VIDEO_DEMO'
  | 'TEXT_DESCRIPTION'
  | 'GESTURE_MOVEMENT'
  | 'ACOUSTIC_SIGNATURE'
  | 'COMMUNITY_NORM_RULE';

export type BehaviorCategory = 'CRIME_UNACCEPTABLE' | 'COMMUNITY_NORMAL_ACCEPTABLE';

export interface AiTrainingContentItem {
  id: string;
  title: string;
  method: TrainingMethod;
  category: BehaviorCategory;
  crimeType?: string;
  severity: 'BENIGN_NORMAL' | 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL_EMERGENCY';
  description: string;
  distinctionCriteria: string; // Explains how AI distinguishes this from normal/crime
  studyTimeRequirementSeconds: number; // Duration AI studies scene before confirming this pattern
  dateAdded: string;
  addedBy: string;
  status: 'ACTIVE_ENFORCED' | 'TRAINING_SYNTHESIZING' | 'STANDBY';
  gestureKinematics?: {
    stanceName: string;
    bodyPostures: string[];
    intensity: 'LOW_REST' | 'MODERATE_NORMAL' | 'HIGH_SUDDEN' | 'VIOLENT_EXPLOSIVE';
  };
  videoDemo?: {
    videoUrl?: string;
    fileName?: string;
    durationSeconds?: number;
    annotatedKeyframesCount?: number;
    taggedCrimeMoments?: string[];
    sampleClipType?: 'BREAK_IN' | 'ASSAULT' | 'NORMAL_DELIVERY' | 'NORMAL_WALK' | 'CUSTOM_UPLOAD';
  };
  audioAcoustic?: {
    soundType: string;
    decibelThreshold: number;
    frequencyPattern: string;
  };
}

export interface AiCrimeDetectionSettings {
  temporalStudyWindowSeconds: number; // e.g., 4.5 seconds default observation window
  minimumCrimeConfidenceThreshold: number; // e.g., 80%
  minimumNormalConfidenceThreshold: number; // e.g., 75%
  studyTimeForUrgentCrimeSeconds: number; // fast 1.2s detection for weapons / physical violence
  studyTimeForLoiteringSeconds: number; // 15.0s to 30.0s for subtle loitering/prowling
  studyTimeForNormalVerificationSeconds: number; // 3.0s continuous normal verification
  autoDispatchOnConfirmedCrime: boolean;
  continuousRealTimeObservation: boolean;
  activeStudyTimerSeconds?: number;
  lastDetectionLatencyMs?: number;
  trainingItems: AiTrainingContentItem[];
}

export interface EncryptedVideoClip {
  id: string;
  accountId: string;
  cameraName: string;
  timestamp: string;
  durationMs: number;
  mimeType: string;
  dataBase64: string; // AES-GCM Encrypted payload
  ivHex: string;
  sha256Hash: string;
  prevHash: string;
  triggerReason: string;
  threatLevel: string;
  sizeBytes: number;
  facialTag?: string;
  personName?: string;
  isVerified?: boolean;
}

export interface IncidentAlert {
  id: string;
  timestamp: string;
  accountId: string;
  cameraName: string;
  threatLevel: 'DEFCON_4_NORMAL' | 'DEFCON_3_ELEVATED' | 'DEFCON_2_HIGH' | 'DEFCON_1_CRITICAL' | 'PANIC_SOS';
  triggerSource: 'MOTION_SENSOR' | 'FACIAL_UNKNOWN' | 'PANIC_BUTTON' | 'MANUAL_DISPATCH' | 'TAMPER_ALARM' | 'CRIME_IN_PROGRESS' | 'WEAPON_DETECTED';
  status: 'ACTIVE_ALARM' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED';
  location: {
    label: string;
    coordinates?: string;
  };
  details: string;
  facialRecognitionResult?: FacialBiometricResult;
  snapshotBase64?: string;
  dispatchedChannels: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    policeDispatch: boolean;
    targetPhone?: string;
  };
  authorityNotes: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  status: 'OK' | 'WARN' | 'TAMPER_DETECTED';
  hash: string;
  prevHash: string;
  details: string;
}

export interface ScamDomainEntry {
  id: string;
  domain: string;
  category: 'Phishing' | 'Fake Authority' | 'Credential Stealer' | 'Fraud Call Center';
  riskScore: number;
  blockedCount: number;
  dateAdded: string;
}

export type SirenToneMode = 'EMERGENCY_DEFCON_1' | 'HI_LO_SIREN' | 'YELP_SIREN' | 'CHIME_GREETING' | 'PTT_ROGER';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: 'Family' | 'Spouse' | 'Parent' | 'Security Officer' | 'Neighbor' | 'Doctor' | 'Local Police' | 'Emergency Contact';
  priority: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
  notifySms: boolean;
  notifyCall: boolean;
  deviceImported?: boolean;
  lastAlerted?: string;
}

export interface AuthorityDispatchConfig {
  autoDispatchEnabled: boolean;
  targetAgency: string;
  emergencyHotline: string;
  patrolUnitSector: string;
  facilityAddress: string;
  gpsCoordinates: string;
  alarmSoundMode: 'AUDIBLE_FULL_SIREN' | 'SILENT_STEALTH_DISPATCH';
  sirenTone: SirenToneMode;
  sirenVolumePercent: number;
  autoSosContactsEnabled: boolean;
}

export interface SosTransmissionLog {
  id: string;
  timestamp: string;
  recipientName: string;
  recipientPhone: string;
  channel: 'SMS_GATEWAY' | 'DIRECT_CALL' | 'WHATSAPP' | 'AUTHORITY_RADIO_DISPATCH' | 'NATIVE_DEVICE_SHARE';
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'QUEUED';
  details: string;
}

export interface ScreenCastSession {
  id: string;
  sourceType: 'ENTIRE_SCREEN' | 'APPLICATION_WINDOW' | 'BROWSER_TAB' | 'SURVEILLANCE_MATRIX';
  status: 'IDLE' | 'CASTING' | 'PAUSED' | 'DISCONNECTED';
  targetDeviceName: string;
  targetDeviceType: 'SMART_TV' | 'MOBILE_DEVICE' | 'COMMAND_MONITOR' | 'AIRPLAY_RECEIVER' | 'CHROMECAST_DISPLAY';
  resolution: string;
  framerate: number;
  bitrateKbps: number;
  audioIncluded: boolean;
  startedAt?: number;
  castCode: string;
  castViewerUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingUrls?: Array<{ uri: string; title: string; snippet?: string }>;
}

export interface EmergencyLocationGrounding {
  query: string;
  places: Array<{
    title: string;
    uri: string;
    snippet?: string;
    category?: string;
  }>;
  summaryText: string;
}

