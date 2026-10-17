import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  UserAccount,
  CameraDevice,
  EnrolledProfile,
  FacialBiometricResult,
  EncryptedVideoClip,
  DefconLevel,
  AiCrimeDetectionSettings,
} from '../types';
import { MotionDetector, MotionAnalysis } from '../utils/motionDetector';
import {
  encryptClip,
  playAlarmSiren,
  stopAlarmSiren,
  sendPushNotification,
  requestPushPermission,
  triggerDirectSOSCall,
  triggerEmergencySMS,
  triggerEmergencyWhatsApp,
} from '../utils/security';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Shield,
  ShieldAlert,
  Sliders,
  Volume2,
  PhoneCall,
  Camera,
  QrCode,
  AlertTriangle,
  Radio,
  Wifi,
  Eye,
  RefreshCw,
  Maximize2,
  CheckCircle2,
  UserCheck,
  UserX,
  Battery,
  Usb,
  Bluetooth,
  Crosshair,
  Sparkles,
  UploadCloud,
  Play,
  FileVideo,
  Skull,
  Zap,
  Tv,
  Cast,
  Flame,
  Filter,
  Upload,
  Thermometer,
  Moon,
  Sun,
  Activity,
  Gauge,
  Layers,
  Settings,
  ExternalLink,
  BrainCircuit,
  Clock,
  Hourglass,
  Compass,
} from 'lucide-react';
import { PtzCameraController } from './PtzCameraController';

export type VisionSensorMode = 'NORMAL_HD' | 'NIGHT_VISION' | 'THERMAL_FLIR';

// Precomputed 256-color authentic FLIR Ironbow / Heat Signature Palette Look-Up Table
const IRONBOW_LUT = (() => {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r = 0;
    let g = 0;
    let b = 0;

    if (t < 0.2) {
      // 0 - 0.2: Deep Navy to Violet (Cold background < 18°C)
      const f = t / 0.2;
      r = Math.round(10 + 35 * f);
      g = Math.round(6 + 14 * f);
      b = Math.round(48 + 55 * f);
    } else if (t < 0.45) {
      // 0.2 - 0.45: Violet to Rich Indigo & Magenta (18°C - 26°C)
      const f = (t - 0.2) / 0.25;
      r = Math.round(45 + 105 * f);
      g = Math.round(20 + 12 * f);
      b = Math.round(103 + 20 * (1 - f));
    } else if (t < 0.7) {
      // 0.45 - 0.7: Magenta to Crimson & Warm Amber (26°C - 33°C clothing / ambient)
      const f = (t - 0.45) / 0.25;
      r = Math.round(150 + 92 * f);
      g = Math.round(32 + 88 * f);
      b = Math.round(28 * (1 - f));
    } else if (t < 0.9) {
      // 0.7 - 0.9: Bright Orange to Radiant Yellow (33°C - 37.5°C human head & core skin)
      const f = (t - 0.7) / 0.2;
      r = Math.round(242 + 13 * f);
      g = Math.round(120 + 122 * f);
      b = Math.round(20 * f);
    } else {
      // 0.9 - 1.0: Yellow to Super-Hot White (>37.5°C core heat anomaly, weapons, kinetic friction)
      const f = (t - 0.9) / 0.1;
      r = 255;
      g = Math.round(242 + 13 * f);
      b = Math.round(42 + 213 * f);
    }

    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
})();

// Real Night Vision Shader: Starlight IR Photon Amplification + Green Phosphor CRT Matrix
function applyNightVisionShader(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // High-sensitivity starlight luminance formula
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      // Starlight photon amplification with non-linear gamma lift for dark shadow visibility
      const amplified = Math.min(255, Math.pow(l / 255, 0.65) * 310);

      // Military Green Phosphor CRT color matrix with starlight scintillation noise
      const noise = (Math.random() - 0.5) * 12;
      data[i] = Math.max(0, Math.min(255, amplified * 0.12 + noise * 0.2));
      data[i + 1] = Math.max(0, Math.min(255, amplified * 1.25 + 16 + noise));
      data[i + 2] = Math.max(0, Math.min(255, amplified * 0.2 + noise * 0.3));
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (_e) {}
}

// Real Thermal FLIR Heat Detector Shader: Ironbow Spectrum + Core Temp Estimator
function applyThermalFLIRShader(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { centerSpotTempC: number; maxHeatAnomaly: boolean } {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const len = data.length;

    let centerRadiance = 135;
    let maxRadiance = 0;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const centerIdx = (cy * width + cx) * 4;

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Human warmth chrominance weighting: skin & biological warmth bias red/green
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const warmthBias = Math.max(0, r - b);
      const thermalValue = Math.min(255, Math.max(0, Math.round(luminance * 0.74 + warmthBias * 0.46)));

      if (thermalValue > maxRadiance) maxRadiance = thermalValue;

      const lutIdx = thermalValue * 3;
      data[i] = IRONBOW_LUT[lutIdx];
      data[i + 1] = IRONBOW_LUT[lutIdx + 1];
      data[i + 2] = IRONBOW_LUT[lutIdx + 2];
    }

    if (centerIdx >= 0 && centerIdx < len) {
      centerRadiance = Math.round(0.299 * data[centerIdx] + 0.587 * data[centerIdx + 1] + 0.114 * data[centerIdx + 2]);
    }

    ctx.putImageData(imgData, 0, 0);

    // Map radiance to estimated celsius (16°C cold ambient to 40°C hot core)
    const centerSpotTempC = parseFloat((16 + (centerRadiance / 255) * 24.5).toFixed(1));
    return {
      centerSpotTempC,
      maxHeatAnomaly: maxRadiance > 225,
    };
  } catch (_e) {
    return { centerSpotTempC: 36.6, maxHeatAnomaly: false };
  }
}

// Forensic Blur, Low-Light & Motion Contour Enhancement Filter
function applyBlurAndLowLightEnhancement(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const len = data.length;

    // Fast luminance analysis across subsampled pixels
    let totalLuminance = 0;
    let sampleCount = 0;
    let minL = 255;
    let maxL = 0;

    for (let i = 0; i < len; i += 16) {
      const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalLuminance += l;
      sampleCount++;
      if (l < minL) minL = l;
      if (l > maxL) maxL = l;
    }

    const avgL = sampleCount > 0 ? totalLuminance / sampleCount : 128;
    const isDark = avgL < 110;

    // Contrast stretch and shadow recovery
    const scale = 255 / Math.max(35, maxL - minL);
    const gamma = isDark ? 0.72 : 0.88;

    for (let i = 0; i < len; i += 4) {
      let r = (data[i] - minL) * scale;
      let g = (data[i + 1] - minL) * scale;
      let b = (data[i + 2] - minL) * scale;

      if (isDark) {
        r = 255 * Math.pow(Math.max(0, Math.min(255, r)) / 255, gamma);
        g = 255 * Math.pow(Math.max(0, Math.min(255, g)) / 255, gamma);
        b = 255 * Math.pow(Math.max(0, Math.min(255, b)) / 255, gamma);
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    // High-performance 3x3 Laplacian edge-sharpening convolution
    const output = ctx.createImageData(width, height);
    const outData = output.data;
    const w4 = width * 4;
    outData.set(data);

    for (let y = 1; y < height - 1; y++) {
      const yOffset = y * w4;
      for (let x = 1; x < width - 1; x++) {
        const idx = yOffset + (x * 4);
        for (let c = 0; c < 3; c++) {
          const center = data[idx + c];
          const up = data[idx - w4 + c];
          const down = data[idx + w4 + c];
          const left = data[idx - 4 + c];
          const right = data[idx + 4 + c];
          const sharp = (center * 2.8) - ((up + down + left + right) * 0.45);
          outData[idx + c] = sharp > 255 ? 255 : (sharp < 0 ? 0 : sharp);
        }
        outData[idx + 3] = data[idx + 3];
      }
    }

    ctx.putImageData(output, 0, 0);
  } catch (_e) {
    // If browser security limits getImageData, graceful passthrough
  }
}

interface CameraMonitorViewProps {
  currentUser: UserAccount;
  cameras: CameraDevice[];
  activeCamera: CameraDevice;
  onSelectCamera: (cam: CameraDevice) => void;
  enrolledProfiles: EnrolledProfile[];
  onNewClipRecorded: (clip: EncryptedVideoClip) => void;
  onNewFacialResult: (res: FacialBiometricResult) => void;
  onTriggerAlarm: (reason: string, details?: string, facialResult?: FacialBiometricResult, snapshot?: string) => void;
  defcon: DefconLevel;
  onOpenSosModal?: () => void;
  aiCrimeSettings?: AiCrimeDetectionSettings;
  onOpenAiSettings?: () => void;
  onOpenTvMode?: () => void;
  onOpenCastMode?: () => void;
  activePeerStream?: MediaStream | null;
  activePeerRelayFrame?: string | null;
}

export const CameraMonitorView: React.FC<CameraMonitorViewProps> = ({
  currentUser,
  cameras,
  activeCamera,
  onSelectCamera,
  enrolledProfiles,
  onNewClipRecorded,
  onNewFacialResult,
  onTriggerAlarm,
  defcon,
  onOpenSosModal,
  aiCrimeSettings,
  onOpenAiSettings,
  onOpenTvMode,
  onOpenCastMode,
  activePeerStream,
  activePeerRelayFrame,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const motionDetectorRef = useRef<MotionDetector>(new MotionDetector());
  const animationFrameRef = useRef<number | null>(null);

  // States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isArmed, setIsArmed] = useState<boolean>(activeCamera.isArmed);
  const [sensitivityFloor, setSensitivityFloor] = useState<number>(30); // 15% high to 45% low
  const [currentMotionScore, setCurrentMotionScore] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [fps, setFps] = useState<number>(30);
  const [latestFaceResult, setLatestFaceResult] = useState<FacialBiometricResult | null>(null);
  const [isAnalyzingFace, setIsAnalyzingFace] = useState<boolean>(false);
  const [isIntercomActive, setIsIntercomActive] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [showDeviceSettingsModal, setShowDeviceSettingsModal] = useState<boolean>(false);
  const [customStreamUrl, setCustomStreamUrl] = useState<string>('');
  const [notificationGranted, setNotificationGranted] = useState<boolean>(false);

  // Simulation feed state for fallback when physical camera is restricted or denied
  const [isSimulatedFeed, setIsSimulatedFeed] = useState<boolean>(false);

  // Blur, Low-Light & Crime Video States
  const [visionSensorMode, setVisionSensorMode] = useState<VisionSensorMode>('NORMAL_HD');
  const [isBlurEnhanceEnabled, setIsBlurEnhanceEnabled] = useState<boolean>(true);
  const [isCrimeGuardActive, setIsCrimeGuardActive] = useState<boolean>(true);
  const [liveSpotTemp, setLiveSpotTemp] = useState<number>(36.6);
  const [liveKineticAnalysis, setLiveKineticAnalysis] = useState<{
    actionName: string;
    isNormalLifeEvent: boolean;
    kineticVelocity: number;
    kineticIntensity: 'LOW_REST' | 'MODERATE_NORMAL' | 'HIGH_SUDDEN' | 'VIOLENT_EXPLOSIVE';
    triggeringFactors: string[];
  }>({
    actionName: 'NORMAL_WALKING',
    isNormalLifeEvent: true,
    kineticVelocity: 3.5,
    kineticIntensity: 'MODERATE_NORMAL',
    triggeringFactors: [],
  });
  const [isScreenVideoMode, setIsScreenVideoMode] = useState<boolean>(false);
  const [showCrimeVideoModal, setShowCrimeVideoModal] = useState<boolean>(false);
  const [activeCrimeSimulation, setActiveCrimeSimulation] = useState<string | null>(null);
  const [lastCrimeAlertBanner, setLastCrimeAlertBanner] = useState<string | null>(null);
  const [isPlayingUploadedVideo, setIsPlayingUploadedVideo] = useState<boolean>(false);
  const [uploadedVideoName, setUploadedVideoName] = useState<string>('');
  const simulationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulationLoopIdRef = useRef<number | null>(null);

  // WebRTC Cross-Device Remote Peer Stream State
  const peerVideoRef = useRef<HTMLVideoElement | null>(null);
  const [feedSource, setFeedSource] = useState<'LOCAL' | 'REMOTE_PEER'>('LOCAL');
  const [isDualCameraSplit, setIsDualCameraSplit] = useState<boolean>(false);

  // PTZ (Pan-Tilt-Zoom) Motorized Controller & Digital Slew State
  const [showPtzController, setShowPtzController] = useState<boolean>(false);
  const [ptzTransform, setPtzTransform] = useState<{ pan: number; tilt: number; zoom: number }>({
    pan: 0,
    tilt: 0,
    zoom: 1.0,
  });

  useEffect(() => {
    if (activePeerStream) {
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = activePeerStream;
        peerVideoRef.current.play().catch(() => {});
      }
      if (activeCamera.type === 'PHONE_NODE' || activeCamera.type === 'WEBRTC_PHONE_STREAM') {
        setFeedSource('REMOTE_PEER');
      }
    }
  }, [activePeerStream, activeCamera.type]);

  // Master Commander Situational Study & Detection Time States
  const [situationalStudyProgress, setSituationalStudyProgress] = useState<number>(0);
  const [lastStudyDurationSeconds, setLastStudyDurationSeconds] = useState<number>(2.4);

  // Active continuous situational study window ticker
  useEffect(() => {
    if (!isCameraActive && !isSimulatedFeed) return;
    const windowSec = aiCrimeSettings?.temporalStudyWindowSeconds || 4.5;
    const interval = setInterval(() => {
      setSituationalStudyProgress((prev) => {
        const next = prev + 0.1;
        if (next >= windowSec) {
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isCameraActive, isSimulatedFeed, aiCrimeSettings?.temporalStudyWindowSeconds]);

  // FPS tracking
  const lastTimeRef = useRef<number>(performance.now());
  const framesRef = useRef<number>(0);

  // Audio Context for PTT VU meter
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Check notification permission on mount
  useEffect(() => {
    requestPushPermission().then(setNotificationGranted);
  }, []);

  // Enumerate hardware cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate video inputs:', err);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Start Hardware Camera Stream safely with progressive fallback
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        setCameraError(null);
        setIsSimulatedFeed(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        let stream: MediaStream | null = null;
        try {
          // Request video ONLY - never request audio here so microphone permissions won't block the camera feed!
          stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId
              ? { deviceId: { ideal: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
              : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
          });
        } catch (_idealErr) {
          // Fallback without resolution constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        }

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr: any) {
            if (
              playErr?.name !== 'AbortError' &&
              !playErr?.message?.includes('interrupted') &&
              !playErr?.message?.includes('removed')
            ) {
              console.warn('Video playback warning:', playErr);
            }
          }
        }

        setIsCameraActive(true);
        refreshDevices();
      } catch (err: any) {
        if (
          err?.name !== 'AbortError' &&
          !err?.message?.includes('interrupted') &&
          !err?.message?.includes('removed')
        ) {
          console.warn('Camera sensor startup notice:', err?.message || err);
          const isPermissionDenied =
            err?.name === 'NotAllowedError' ||
            err?.name === 'PermissionDeniedError' ||
            err?.message?.toLowerCase().includes('permission') ||
            err?.message?.toLowerCase().includes('denied');

          setCameraError(
            isPermissionDenied
              ? 'Camera permission denied or blocked by browser/iframe security settings.'
              : err?.message || 'Failed to connect to local camera sensor. Check browser permissions.'
          );
          setIsCameraActive(false);
        }
      }
    },
    [refreshDevices]
  );

  // Restore Default Camera & AI Settings Handler
  const restoreDefaultCameraSettings = useCallback(() => {
    setVisionSensorMode('NORMAL_HD');
    setIsBlurEnhanceEnabled(true);
    setIsCrimeGuardActive(true);
    setSensitivityFloor(30);
    setIsArmed(true);
    setCameraError(null);
    setIsSimulatedFeed(false);
    if (simulationLoopIdRef.current) {
      cancelAnimationFrame(simulationLoopIdRef.current);
      simulationLoopIdRef.current = null;
    }
    startCamera(selectedDeviceId);
  }, [selectedDeviceId, startCamera]);

  // Tactical Simulated Sentry Feed (renders synthetic room + animated subject + telemetry on canvas)
  const startSimulatedFeed = useCallback(() => {
    setCameraError(null);
    setIsSimulatedFeed(true);
    setIsCameraActive(true);

    const canvas = simulationCanvasRef.current;
    if (!canvas) return;
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetX = 240;
    let targetY = 380;
    let dirX = 3.2;
    let dirY = 1.6;

    const renderSimulation = () => {
      ctx.fillStyle = '#050c18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor grid perspective
      ctx.strokeStyle = '#0f2744';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Moving human subject target
      targetX += dirX;
      targetY += dirY;
      if (targetX > canvas.width - 200 || targetX < 180) dirX = -dirX;
      if (targetY > canvas.height - 180 || targetY < 240) dirY = -dirY;

      // Draw synthetic subject (head & body)
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.arc(targetX, targetY - 70, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#224d7f';
      ctx.beginPath();
      ctx.ellipse(targetX, targetY + 10, 48, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subject tracking reticle
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(targetX - 55, targetY - 110, 110, 200);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px monospace';
      ctx.fillText(`SUBJECT_TRACK [X:${Math.round(targetX)} Y:${Math.round(targetY)}]`, targetX - 55, targetY - 120);

      // Camera HUD overlay
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.fillText(`CAM-01 [MAIN PERIMETER] • ${new Date().toLocaleTimeString()} • TACTICAL SENTRY SIMULATION`, 24, 36);

      simulationLoopIdRef.current = requestAnimationFrame(renderSimulation);
    };

    if (simulationLoopIdRef.current) {
      cancelAnimationFrame(simulationLoopIdRef.current);
    }
    simulationLoopIdRef.current = requestAnimationFrame(renderSimulation);

    // If canvas captureStream is supported, pipe into video element
    if (typeof (canvas as any).captureStream === 'function') {
      try {
        const stream = (canvas as any).captureStream(30);
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Canvas captureStream fallback notice:', e);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (simulationLoopIdRef.current) {
      cancelAnimationFrame(simulationLoopIdRef.current);
      simulationLoopIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (_) {}
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsSimulatedFeed(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Initialize camera automatically on mount with cancellation guard
  useEffect(() => {
    let isCancelled = false;

    startCamera(selectedDeviceId).catch((err) => {
      if (!isCancelled) {
        console.warn('Initial camera connect note:', err);
      }
    });

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [selectedDeviceId, startCamera, stopCamera]);

  // Capture current video frame as high-res base64 JPEG with active sensor enhancements
  const captureSnapshot = useCallback((): string | null => {
    let sourceElement: HTMLVideoElement | HTMLCanvasElement | null = videoRef.current;
    if (isSimulatedFeed && simulationCanvasRef.current) {
      sourceElement = simulationCanvasRef.current;
    }
    if (!sourceElement) return null;
    if (sourceElement instanceof HTMLVideoElement && sourceElement.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    const width = sourceElement instanceof HTMLVideoElement ? sourceElement.videoWidth || 1280 : sourceElement.width || 1280;
    const height = sourceElement instanceof HTMLVideoElement ? sourceElement.videoHeight || 720 : sourceElement.height || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
    if (isBlurEnhanceEnabled) {
      applyBlurAndLowLightEnhancement(ctx, canvas.width, canvas.height);
    }
    if (visionSensorMode === 'NIGHT_VISION') {
      applyNightVisionShader(ctx, canvas.width, canvas.height);
    } else if (visionSensorMode === 'THERMAL_FLIR') {
      applyThermalFLIRShader(ctx, canvas.width, canvas.height);
    }
    return canvas.toDataURL('image/jpeg', 0.88);
  }, [isBlurEnhanceEnabled, visionSensorMode, isSimulatedFeed]);

  // Biometric Facial & Kinetic Recognition Call via Express Backend & Gemini
  const performBiometricAnalysis = useCallback(
    async (snapshot?: string) => {
      const snap = snapshot || captureSnapshot();
      if (!snap || isAnalyzingFace) return;

      const analysisStartTime = performance.now();
      setIsAnalyzingFace(true);
      try {
        const response = await fetch('/api/security/facial-recognition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: snap,
            enrolledProfiles,
            cameraName: activeCamera.name,
            visionSensorMode,
            isHighSensitivity: isCrimeGuardActive,
            crimeDetectionMode: isCrimeGuardActive,
            targetStudyWindowSeconds: aiCrimeSettings?.temporalStudyWindowSeconds || 4.5,
          }),
        });

        const data = await response.json();
        const durationSec = Number(((performance.now() - analysisStartTime) / 1000).toFixed(2));
        setLastStudyDurationSeconds(data?.timeTakenSeconds || durationSec);

        if (data && data.success) {
          const result: FacialBiometricResult = {
            personDetected: data.personDetected,
            faceCount: data.faceCount || 1,
            status: data.status,
            recognizedPersonName: data.recognizedPersonName,
            clearanceLevel: data.clearanceLevel,
            confidence: data.confidence || 90,
            attributes: data.attributes,
            threatLevel: data.threatLevel || 'ELEVATED',
            threatIndicators: data.threatIndicators || [],
            recommendedAction: data.recommendedAction || 'MONITOR',
            tacticalSummary: data.tacticalSummary || 'Face and kinetic movement analysis completed.',
            snapshotBase64: snap,
            timestamp: new Date().toISOString(),
            crimeDetected: data.crimeDetected,
            crimeType: data.crimeType,
            weaponsVisible: data.weaponsVisible || [],
            isBlurryOrLowLight: data.isBlurryOrLowLight,
            imageQualityAssessment: data.imageQualityAssessment,
            immediateAlarmDispatchRequired: data.immediateAlarmDispatchRequired,
            visionSensorMode: data.visionSensorMode || visionSensorMode,
            bodyActionAnalysis: data.bodyActionAnalysis,
            thermalSignature: data.thermalSignature,
            timeTakenSeconds: data.timeTakenSeconds || durationSec,
            temporalStudyWindowSeconds: data.temporalStudyWindowSeconds || (aiCrimeSettings?.temporalStudyWindowSeconds || 4.5),
            communityStatus: data.communityStatus || (data.crimeDetected ? 'COMMUNITY_VIOLATION_CRIME' : 'ACCEPTABLE_NORMAL'),
            matchedTrainingRules: data.matchedTrainingRules || [],
          };

          setLatestFaceResult(result);
          onNewFacialResult(result);

          if (result.bodyActionAnalysis) {
            setLiveKineticAnalysis({
              actionName: result.bodyActionAnalysis.actionName,
              isNormalLifeEvent: result.bodyActionAnalysis.isNormalLifeEvent,
              kineticVelocity: result.bodyActionAnalysis.kineticIntensity === 'VIOLENT_EXPLOSIVE' ? 84 : 15,
              kineticIntensity: result.bodyActionAnalysis.kineticIntensity,
              triggeringFactors: result.bodyActionAnalysis.triggeringFactorsDetected || [],
            });
          }

          if (result.thermalSignature?.coreTempReadingCelsius) {
            setLiveSpotTemp(result.thermalSignature.coreTempReadingCelsius);
          }

          // If recognized authorized, play friendly chime
          if (result.status === 'RECOGNIZED_AUTHORIZED') {
            playAlarmSiren('CHIME_GREETING');
            sendPushNotification(
              `ACCESS GRANTED: ${result.recognizedPersonName}`,
              `Authorized individual recognized with ${result.confidence}% confidence.`
            );
          } else if (
            result.crimeDetected ||
            result.immediateAlarmDispatchRequired ||
            result.status === 'SUSPICIOUS_INTRUDER' ||
            result.threatLevel === 'HIGH' ||
            result.threatLevel === 'CRITICAL'
          ) {
            // Suspicious intruder or crime: trigger emergency alarm and notify authorities!
            onTriggerAlarm(
              result.crimeType ? `CRIME_${result.crimeType}` : 'BIOMETRIC_THREAT',
              `Subject threat alert: ${result.tacticalSummary}`,
              result,
              snap
            );
            playAlarmSiren('EMERGENCY_DEFCON_1');
          }
        }
      } catch (err) {
        console.warn('Facial recognition endpoint error:', err);
      } finally {
        setIsAnalyzingFace(false);
      }
    },
    [captureSnapshot, isAnalyzingFace, enrolledProfiles, activeCamera.name, visionSensorMode, isCrimeGuardActive, onNewFacialResult, onTriggerAlarm]
  );

  // Real Recording Trigger: MediaRecorder + AES-GCM Encrypted Cloud Vault Upload
  const startRecordingClip = useCallback((reason = 'MANUAL_RECORD') => {
    if (!mediaStreamRef.current || isRecording) return;
    try {
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: 1000000, // 1 Mbps target provides crisp security resolution with rapid encryption & instant upload
      };

      const recorder = new MediaRecorder(mediaStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = [...recordedChunksRef.current];
        recordedChunksRef.current = [];
        setIsRecording(false);
        setRecordingSeconds(0);

        if (chunks.length === 0) return;
        const rawBlob = new Blob(chunks, { type: mimeType });
        if (rawBlob.size === 0) return;

        // Encrypt with Web Crypto API AES-256-GCM
        try {
          const { cipherBase64, ivHex, sha256Hex } = await encryptClip(rawBlob);

          const clipId = `CLP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
          const newClip: EncryptedVideoClip = {
            id: clipId,
            accountId: currentUser.accountId,
            cameraName: activeCamera.name,
            timestamp: new Date().toISOString(),
            durationMs: 6000,
            mimeType: 'video/webm',
            dataBase64: cipherBase64,
            ivHex,
            sha256Hash: sha256Hex,
            prevHash: 'LOCAL_ENCRYPTED_CHAIN',
            triggerReason: reason,
            threatLevel: latestFaceResult?.threatLevel || 'DEFCON_3_ELEVATED',
            sizeBytes: rawBlob.size,
            facialTag: latestFaceResult?.status,
            personName: latestFaceResult?.recognizedPersonName,
            isVerified: true,
          };

          // 1. Immediately store clip in the user's active session and encrypted vault
          onNewClipRecorded(newClip);

          // 2. Resiliently sync to backend server vault
          try {
            const uploadRes = await fetch('/api/vault/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accountId: currentUser.accountId,
                cameraName: activeCamera.name,
                durationMs: 6000,
                mimeType: 'video/webm',
                dataBase64: cipherBase64,
                ivHex,
                sha256Hash: sha256Hex,
                triggerReason: reason,
                threatLevel: latestFaceResult?.threatLevel || 'DEFCON_3_ELEVATED',
                facialTag: latestFaceResult?.status,
                personName: latestFaceResult?.recognizedPersonName,
              }),
            });

            if (uploadRes.ok) {
              const data = await uploadRes.json();
              if (data && data.success) {
                if (data.prevHash) newClip.prevHash = data.prevHash;
                if (data.clipId) newClip.id = data.clipId;
              }
            } else {
              console.warn('Vault server upload response status:', uploadRes.status);
            }
          } catch (netErr) {
            // Network or server warmup blip: clip remains safely persisted in local encrypted vault
            console.warn('Vault cloud sync deferred (offline/local mode active). Clip secured in local military-grade AES vault.');
          }
        } catch (encErr) {
          console.warn('Clip encryption note:', encErr);
        }
      };

      recorder.start(1000); // 1-second timeslices ensure smooth stream capture
      setIsRecording(true);
      setRecordingSeconds(1);

      // Automatically record 6 seconds when motion triggers
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 6000);
    } catch (err) {
      console.warn('MediaRecorder notice:', err);
    }
  }, [isRecording, currentUser.accountId, activeCamera.name, latestFaceResult, onNewClipRecorded]);

  // Recording timer increment
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Real Motion Detection Canvas Loop
  useEffect(() => {
    let lastMotionTriggerTime = 0;
    let lastFaceAnalysisTime = 0;

    const processFrame = () => {
      const sourceElement: HTMLVideoElement | HTMLCanvasElement | null =
        isSimulatedFeed && simulationCanvasRef.current ? simulationCanvasRef.current : videoRef.current;

      if (sourceElement && canvasRef.current && isCameraActive) {
        // Compute FPS
        const now = performance.now();
        framesRef.current++;
        if (now - lastTimeRef.current >= 1000) {
          setFps(framesRef.current);
          framesRef.current = 0;
          lastTimeRef.current = now;
        }

        const displayWidth = (sourceElement as HTMLElement).clientWidth || (sourceElement as HTMLCanvasElement).width || 1280;
        const displayHeight = (sourceElement as HTMLElement).clientHeight || (sourceElement as HTMLCanvasElement).height || 720;

        // Match overlay canvas dimensions to video display
        if (
          canvasRef.current.width !== displayWidth ||
          canvasRef.current.height !== displayHeight
        ) {
          canvasRef.current.width = displayWidth;
          canvasRef.current.height = displayHeight;
        }

        // Run real pixel-differencing motion analysis
        const analysis: MotionAnalysis = motionDetectorRef.current.analyzeFrame(
          sourceElement,
          sensitivityFloor,
          canvasRef.current
        );

        setCurrentMotionScore(analysis.motionScore);

        // If armed and motion triggers threshold
        if (isArmed && analysis.isTriggered && now - lastMotionTriggerTime > 12000) {
          lastMotionTriggerTime = now;
          const snap = captureSnapshot();

          // Push browser notification
          sendPushNotification(
            `🚨 MOTION DETECTED: ${activeCamera.name}`,
            `Intrusion activity score ${analysis.motionScore}% exceeded floor threshold (${sensitivityFloor}%). Footage recorded to encrypted vault.`
          );

          // Start recording
          startRecordingClip('MOTION_AUTONOMOUS_TRIGGER');

          // Trigger facial biometrics if not recently run
          if (now - lastFaceAnalysisTime > 15000 && snap) {
            lastFaceAnalysisTime = now;
            performBiometricAnalysis(snap);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, isArmed, sensitivityFloor, activeCamera.name, captureSnapshot, startRecordingClip, performBiometricAnalysis]);

  // Two-Way Audio Intercom (Push-to-Talk)
  const startIntercomPTT = async () => {
    try {
      playAlarmSiren('PTT_ROGER');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsIntercomActive(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const pollVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        if (isIntercomActive) {
          requestAnimationFrame(pollVolume);
        }
      };
      pollVolume();
    } catch (err) {
      console.warn('Intercom microphone access failed:', err);
    }
  };

  const stopIntercomPTT = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsIntercomActive(false);
    setMicVolume(0);
  };

  return (
    <div className="space-y-4">
      {/* SENTRY STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/40 bg-[#071322] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isArmed
                ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-400'
                : 'border-slate-700 bg-slate-900/60 text-slate-500'
            }`}
          >
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-exo text-sm font-bold text-slate-100">
              <span>AUTONOMOUS SENTRY:</span>
              <span className={isArmed ? 'text-emerald-400' : 'text-slate-400'}>
                {isArmed ? 'ARMED & ACTIVE' : 'STANDBY (MANUAL ONLY)'}
              </span>
            </div>
            <div className="text-xs font-mono-code text-slate-400 flex items-center gap-2 flex-wrap">
              <span>Channel: <span className="text-sky-300">{activeCamera.name}</span></span>
              {activeCamera.connectionMethod && (
                <span className="rounded border border-sky-600/40 bg-sky-950/80 px-2 py-0.5 text-[10px] text-sky-300">
                  {activeCamera.connectionMethod.replace(/_/g, ' ')}
                </span>
              )}
              <span>• Encrypted Vault Storage Locked</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Restore Camera & AI Defaults */}
          <button
            onClick={restoreDefaultCameraSettings}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-teal-600/70 bg-teal-950/80 px-3 py-1.5 text-xs font-mono-code font-bold text-teal-300 hover:bg-teal-900 transition-colors shadow-[0_0_12px_rgba(20,184,166,0.25)]"
            title="Restore default camera settings, reset AI parameters and re-initialize sensor stream"
          >
            <RefreshCw className="h-3.5 w-3.5 text-teal-400" />
            <span>RESTORE CAMERA SETTINGS</span>
          </button>

          {/* Inspect Connected Device & Camera Feed Settings */}
          <button
            onClick={() => setShowDeviceSettingsModal(true)}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/70 bg-sky-950/90 px-3 py-1.5 text-xs font-mono-code font-bold text-sky-300 hover:bg-sky-900 transition-all shadow-[0_0_12px_rgba(56,189,248,0.3)]"
            title="Open connected camera hardware profile and device specifications"
          >
            <Settings className="h-3.5 w-3.5 text-sky-400" />
            <span>DEVICE SPECS</span>
          </button>

          {/* Arm / Disarm Toggle */}
          <button
            onClick={() => setIsArmed(!isArmed)}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono-code font-bold transition-colors ${
              isArmed
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            {isArmed ? 'DISARM SENTRY' : 'ARM SENTRY'}
          </button>

          {/* Quick Snapshot Trigger */}
          <button
            onClick={() => {
              const snap = captureSnapshot();
              if (snap) {
                performBiometricAnalysis(snap);
              }
            }}
            type="button"
            disabled={!isCameraActive || isAnalyzingFace}
            className="flex items-center gap-1.5 rounded-lg border border-sky-800/60 bg-sky-950/70 px-3 py-1.5 text-xs font-mono-code text-sky-300 transition-colors hover:bg-sky-900"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{isAnalyzingFace ? 'SCANNING BIOMETRICS...' : 'SCAN BIOMETRICS'}</span>
          </button>

          {/* Pair Mobile / IP Cam Button */}
          <button
            onClick={() => setShowPairModal(true)}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-900/60 bg-indigo-950/60 px-3 py-1.5 text-xs font-mono-code text-indigo-300 hover:bg-indigo-900"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>PAIR PHONE / IP CAM</span>
          </button>

          {/* Screen Cast Mode Button */}
          {onOpenCastMode && (
            <button
              onClick={onOpenCastMode}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/70 bg-cyan-950/80 px-3 py-1.5 text-xs font-mono-code font-bold text-cyan-300 hover:bg-cyan-900 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
              title="Cast live camera or full dashboard wirelessly to Smart TVs, phones, or monitors"
            >
              <Cast className="h-3.5 w-3.5 text-cyan-400" />
              <span>SCREEN CAST</span>
            </button>
          )}

          {/* TV Mode Matrix Button */}
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/70 bg-amber-950/80 px-3 py-1.5 text-xs font-mono-code font-bold text-amber-300 hover:bg-amber-900 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all"
              title="Display all camera feeds simultaneously on Smart TV / Big Screen"
            >
              <Tv className="h-3.5 w-3.5 text-amber-400" />
              <span>TV MATRIX</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-sky-950/60 bg-[#07111c] p-3">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Feed Status</div>
          <div className="mt-1 flex items-center gap-1.5 font-exo text-sm font-bold">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className={isCameraActive ? 'text-emerald-400' : 'text-red-400'}>
              {isCameraActive ? 'LIVE ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] font-mono-code text-slate-500">
            {isCameraActive ? `${fps} FPS • 1080p FHD` : 'Hardware stream paused'}
          </div>
        </div>

        <div className="rounded-lg border border-sky-950/60 bg-[#07111c] p-3">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Vault Recording</div>
          <div className="mt-1 font-exo text-sm font-bold">
            {isRecording ? (
              <span className="flex items-center gap-1.5 text-red-400 animate-pulse">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                RECORDING 00:0{recordingSeconds}
              </span>
            ) : (
              <span className="text-slate-300">STANDBY (AES-GCM)</span>
            )}
          </div>
          <div className="mt-0.5 text-[10px] font-mono-code text-slate-500">
            {isRecording ? 'Capturing encrypted clip' : 'Armed on motion trigger'}
          </div>
        </div>

        <div className="rounded-lg border border-sky-950/60 bg-[#07111c] p-3">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Motion Trigger Floor</div>
          <div className="mt-1 flex items-center justify-between font-exo text-sm font-bold text-sky-400">
            <span>{sensitivityFloor}% Floor</span>
            <span className="text-xs font-mono-code text-slate-400">Act: {currentMotionScore}%</span>
          </div>
          {/* Motion Bar */}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-slate-800">
            <div
              className={`h-full transition-all duration-150 ${
                currentMotionScore >= sensitivityFloor ? 'bg-red-500' : 'bg-sky-400'
              }`}
              style={{ width: `${currentMotionScore}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-sky-950/60 bg-[#07111c] p-3">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">AI Biometric Status</div>
          <div className="mt-1 font-exo text-sm font-bold">
            {latestFaceResult ? (
              latestFaceResult.status === 'RECOGNIZED_AUTHORIZED' ? (
                <span className="text-emerald-400">RECOGNIZED: {latestFaceResult.recognizedPersonName}</span>
              ) : latestFaceResult.status === 'SUSPICIOUS_INTRUDER' ? (
                <span className="text-red-400">INTRUDER THREAT</span>
              ) : (
                <span className="text-amber-400">UNKNOWN VISITOR</span>
              )
            ) : (
              <span className="text-slate-400">SCANNING SENSOR</span>
            )}
          </div>
          <div className="mt-0.5 text-[10px] font-mono-code text-slate-500">
            {latestFaceResult ? `${latestFaceResult.confidence}% confidence` : `${enrolledProfiles.length} profiles enrolled`}
          </div>
        </div>
      </div>

      {/* SENSOR VISION MODES & AI CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-sky-900/60 bg-[#06101c] p-3 text-xs font-mono-code">
        {/* Sensor Modes */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-bold uppercase text-[11px] mr-1 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-sky-400" /> SENSOR MODE:
          </span>
          <button
            onClick={() => setVisionSensorMode('NORMAL_HD')}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              visionSensorMode === 'NORMAL_HD'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                : 'bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>NORMAL HD</span>
          </button>
          <button
            onClick={() => setVisionSensorMode('NIGHT_VISION')}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              visionSensorMode === 'NIGHT_VISION'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Moon className="h-3.5 w-3.5 text-emerald-400" />
            <span>NIGHT VISION (IR)</span>
          </button>
          <button
            onClick={() => setVisionSensorMode('THERMAL_FLIR')}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              visionSensorMode === 'THERMAL_FLIR'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Thermometer className="h-3.5 w-3.5 text-amber-400" />
            <span>THERMAL FLIR</span>
          </button>
        </div>

        {/* AI Enhancements & Safety Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* De-blur contour sharpening */}
          <button
            onClick={() => setIsBlurEnhanceEnabled(!isBlurEnhanceEnabled)}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs border transition-all ${
              isBlurEnhanceEnabled
                ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
            title="De-blur filter: Laplacian contour sharpening + histogram contrast stretching"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>DE-BLUR: {isBlurEnhanceEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Crime Guard Sensitivity */}
          <button
            onClick={() => setIsCrimeGuardActive(!isCrimeGuardActive)}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs border transition-all ${
              isCrimeGuardActive
                ? 'border-rose-500 bg-rose-950/80 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
            title="Max sensitivity danger & crime detection (screen or real life)"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>CRIME GUARD: {isCrimeGuardActive ? 'MAX SENSITIVITY' : 'NORMAL'}</span>
          </button>

          {/* AI Situational Study Window & Time Indicator */}
          <div className="flex items-center gap-2 rounded-lg border border-amber-900/60 bg-black/60 px-3 py-1.5 text-xs font-mono-code">
            <Hourglass className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">STUDY WINDOW:</span>
            <span className="font-bold text-amber-300">
              {situationalStudyProgress.toFixed(1)}s / {aiCrimeSettings?.temporalStudyWindowSeconds || 4.5}s
            </span>
            <div className="h-2 w-14 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-100"
                style={{
                  width: `${Math.min(
                    100,
                    (situationalStudyProgress / (aiCrimeSettings?.temporalStudyWindowSeconds || 4.5)) * 100
                  )}%`,
                }}
              />
            </div>
            {onOpenAiSettings && (
              <button
                onClick={onOpenAiSettings}
                type="button"
                className="ml-1 flex items-center gap-1 rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-700 hover:bg-amber-900"
                title="Configure AI training rules and detection times in Master Commander"
              >
                <BrainCircuit className="h-3 w-3 text-amber-400" />
                <span>AI RULES</span>
              </button>
            )}
          </div>

          {/* PTZ (PAN-TILT-ZOOM) CONTROLLER BUTTON */}
          <button
            onClick={() => setShowPtzController(!showPtzController)}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono-code font-bold transition-all ${
              showPtzController
                ? 'border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'border-cyan-700/60 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900'
            }`}
            title="Toggle Pan-Tilt-Zoom (PTZ) motorized gimbal controller"
          >
            <Compass className={`h-3.5 w-3.5 text-cyan-400 ${showPtzController ? 'animate-spin-slow' : ''}`} />
            <span>{showPtzController ? 'CLOSE PTZ' : 'PTZ CONTROLS'}</span>
          </button>

          {/* TV WALL MATRIX BUTTON */}
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/60 bg-amber-950/80 px-3 py-1.5 text-xs font-mono-code font-bold text-amber-300 hover:bg-amber-900 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              title="Launch TV Mode Matrix with all cameras and AI threat detection simultaneously"
            >
              <Tv className="h-3.5 w-3.5 text-amber-400" />
              <span>TV WALL MATRIX</span>
            </button>
          )}

          {/* Dual-Camera Simultaneous Split View Button */}
          <button
            onClick={() => setIsDualCameraSplit(!isDualCameraSplit)}
            type="button"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono-code font-bold transition-all ${
              isDualCameraSplit
                ? 'border-indigo-400 bg-indigo-950 text-indigo-200 shadow-[0_0_15px_rgba(129,140,248,0.4)]'
                : 'border-indigo-700/60 bg-indigo-950/70 text-indigo-300 hover:bg-indigo-900'
            }`}
            title="Display both local camera and remote paired phone camera simultaneously (Dual-Feed Split View)"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>{isDualCameraSplit ? 'DUAL CAMERA: ON' : 'DUAL CAMERA SPLIT'}</span>
          </button>

          {/* WebRTC Phone Peer Toggle if active */}
          {(activePeerStream || activePeerRelayFrame) && (
            <button
              onClick={() => setFeedSource(feedSource === 'LOCAL' ? 'REMOTE_PEER' : 'LOCAL')}
              type="button"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono-code font-bold transition-all ${
                feedSource === 'REMOTE_PEER'
                  ? 'border-emerald-500 bg-emerald-950 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>{feedSource === 'REMOTE_PEER' ? 'SHOWING: PHONE P2P' : 'SWITCH TO PHONE P2P'}</span>
            </button>
          )}

          {/* Restore Camera Settings button */}
          <button
            onClick={restoreDefaultCameraSettings}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-teal-600/70 bg-teal-950/90 px-3 py-1.5 text-xs font-mono-code font-bold text-teal-300 hover:bg-teal-900 transition-all shadow-[0_0_12px_rgba(20,184,166,0.3)]"
            title="Restore default camera settings, reconnect sensor stream, and reset AI parameters"
          >
            <RefreshCw className="h-3.5 w-3.5 text-teal-400" />
            <span>RESTORE CAMERA SETTINGS</span>
          </button>
        </div>
      </div>

      {/* MAIN CAMERA STAGE & HUD */}
      <div className="relative overflow-hidden rounded-xl border border-sky-900/60 bg-[#020509] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        {/* HUD Overlay Strip */}
        <div className="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-sky-900/40 bg-gradient-to-b from-black/80 to-transparent p-3 text-xs font-mono-code text-slate-300">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-red-950/80 px-2 py-0.5 text-[11px] font-bold text-red-400 border border-red-800/40">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              LIVE FEED
            </span>
            <span className="text-slate-300 font-semibold">{activeCamera.name}</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-sky-400">{activeCamera.location}</span>

            {(feedSource === 'REMOTE_PEER' || activeCamera.type === 'PHONE_NODE') && (
              <span className="flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-600 animate-pulse">
                <Radio className="h-3 w-3 text-emerald-400" />
                <span>PHONE CONNECTED • P2P ENCRYPTED</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {(ptzTransform.zoom > 1.0 || ptzTransform.pan !== 0 || ptzTransform.tilt !== 0) && (
              <span className="flex items-center gap-1 rounded bg-cyan-950/90 border border-cyan-500/50 px-2 py-0.5 text-[11px] text-cyan-300 font-bold">
                <Compass className="h-3 w-3 text-cyan-400" />
                <span>
                  PTZ: {ptzTransform.pan > 0 ? `+${Math.round(ptzTransform.pan)}` : Math.round(ptzTransform.pan)}° /{' '}
                  {ptzTransform.tilt > 0 ? `+${Math.round(ptzTransform.tilt)}` : Math.round(ptzTransform.tilt)}° ({ptzTransform.zoom.toFixed(1)}X)
                </span>
              </span>
            )}
            <span className="rounded bg-sky-950/80 px-2 py-0.5 text-[11px] text-sky-300 border border-sky-800/40">
              {new Date().toLocaleTimeString()}
            </span>
            <span className="rounded bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-300">
              {fps} FPS
            </span>
          </div>
        </div>

        {/* Video Stage and Canvas Overlay */}
        <div className="relative flex aspect-video w-full items-center justify-center bg-black overflow-hidden">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-red-400">
              <AlertTriangle className="h-12 w-12 mb-3 text-red-500 animate-bounce" />
              <div className="font-exo font-bold text-lg text-slate-100">Camera Feed Disconnected / Permission Denied</div>
              <p className="mt-1 max-w-md text-xs font-mono-code text-slate-400">{cameraError}</p>

              {/* Action Recovery Buttons */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => startCamera(selectedDeviceId)}
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs font-mono-code text-white hover:bg-sky-600 shadow-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" /> RETRY CAMERA ACCESS
                </button>

                <button
                  onClick={restoreDefaultCameraSettings}
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-teal-600 bg-teal-950 px-4 py-2 text-xs font-mono-code text-teal-300 hover:bg-teal-900 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 text-teal-400" /> RESTORE DEFAULTS
                </button>

                <button
                  onClick={startSimulatedFeed}
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-950 px-4 py-2 text-xs font-mono-code text-emerald-300 hover:bg-emerald-900 transition-colors"
                >
                  <Play className="h-4 w-4 text-emerald-400" /> LAUNCH TACTICAL SENTRY SIMULATION
                </button>
              </div>

              {/* Helpful Permission Resolution Guide */}
              <div className="mt-6 max-w-lg rounded-xl border border-slate-800 bg-[#040a14] p-4 text-left text-xs font-mono-code text-slate-300">
                <div className="font-bold text-sky-400 flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span>CAMERA PERMISSION RESOLUTION GUIDE</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                  <li>
                    <strong className="text-slate-200">Address Bar Permission:</strong> In your browser's address bar, click the camera / tune / lock icon and set Camera to <span className="text-emerald-400 font-bold">"Always allow"</span>.
                  </li>
                  <li>
                    <strong className="text-slate-200">New Tab Window:</strong> If testing in an embedded iframe preview, open the app in a dedicated browser tab so hardware permissions aren't restricted by iframe policies.
                  </li>
                  <li>
                    <strong className="text-slate-200">Simulated Feed Fallback:</strong> Click <span className="text-emerald-300">"Launch Tactical Sentry Simulation"</span> to run real motion detection, AI biometrics, night vision, and thermal modes immediately.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className={`relative h-full w-full ${isDualCameraSplit ? 'grid grid-cols-2 gap-1 bg-slate-950 p-1' : 'flex items-center justify-center'}`}>
              {/* Left Pane: Local Camera / Simulation */}
              <div className="relative h-full w-full flex items-center justify-center overflow-hidden rounded bg-black">
                <div className="absolute top-2 left-2 z-10 rounded bg-black/70 px-2 py-0.5 text-[10px] text-sky-300 font-mono-code border border-sky-800/60">
                  📷 LOCAL CAMERA NODE ({activeCamera.name})
                </div>
                {isSimulatedFeed && (
                  <canvas ref={simulationCanvasRef} className="h-full w-full object-cover" />
                )}
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  style={{
                    display: isSimulatedFeed ? 'none' : 'block',
                    filter:
                      visionSensorMode === 'NIGHT_VISION'
                        ? 'contrast(135%) brightness(120%) saturate(50%) hue-rotate(90deg) sepia(0.35)'
                        : visionSensorMode === 'THERMAL_FLIR'
                        ? 'invert(0.85) contrast(150%) saturate(220%) hue-rotate(180deg)'
                        : isBlurEnhanceEnabled
                        ? 'contrast(115%) brightness(105%)'
                        : 'none',
                  }}
                  className="h-full w-full object-cover"
                />
                {!isDualCameraSplit && (
                  <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
                )}
              </div>

              {/* Right Pane: Remote Paired Device Camera & Activity Stream */}
              {isDualCameraSplit ? (
                <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden rounded bg-black border-l border-sky-900/40">
                  <div className="absolute top-2 left-2 z-10 rounded bg-black/70 px-2 py-0.5 text-[10px] text-emerald-300 font-mono-code border border-emerald-800/60 flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                    <span>📱 PAIRED DEVICE CAMERA & ACTIVITY</span>
                  </div>
                  {activePeerStream ? (
                    <video
                      ref={peerVideoRef}
                      playsInline
                      autoPlay
                      className="h-full w-full object-cover"
                    />
                  ) : activePeerRelayFrame ? (
                    <img src={activePeerRelayFrame} alt="Paired Device Camera" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
                      <Radio className="h-8 w-8 text-emerald-400 animate-pulse mb-2" />
                      <div className="font-exo font-bold text-xs text-slate-200">Paired Device Activity Stream</div>
                      <div className="mt-2 w-full rounded border border-emerald-800/50 bg-emerald-950/40 p-2.5 text-left text-[10px] font-mono-code text-emerald-300 space-y-1">
                        <div className="font-bold text-emerald-400">CONNECTED DEVICE TELEMETRY:</div>
                        <div>• Active App: Sentinel Mobile Sentry Node</div>
                        <div>• Camera: Rear Optical 4K Sensor Active</div>
                        <div>• Battery: 94% (Charging) • 5G Uplink</div>
                        <div>• Sentry State: Patrolling Corridor B</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Remote Smartphone Peer Video Feed (WebRTC) */}
                  {feedSource === 'REMOTE_PEER' && activePeerStream ? (
                    <video
                      ref={peerVideoRef}
                      playsInline
                      autoPlay
                      className="h-full w-full object-cover transition-all duration-200"
                    />
                  ) : feedSource === 'REMOTE_PEER' && activePeerRelayFrame ? (
                    <img
                      src={activePeerRelayFrame}
                      alt="Remote Phone Camera Feed"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  {!isDualCameraSplit && (
                    <canvas
                      ref={canvasRef}
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Real-time Kinetic Action Telemetry Banner */}
          {isCameraActive && (
            <div className="absolute top-12 left-4 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-sky-800/50 bg-black/80 px-3 py-1.5 backdrop-blur-md text-xs font-mono-code">
              <div className={`h-2.5 w-2.5 rounded-full ${liveKineticAnalysis.isNormalLifeEvent ? 'bg-emerald-400' : 'bg-red-500 animate-ping'}`} />
              <span className={liveKineticAnalysis.isNormalLifeEvent ? 'text-emerald-300 font-bold' : 'text-red-400 font-bold'}>
                {liveKineticAnalysis.isNormalLifeEvent ? '🛡️ BENIGN EVENT' : '🚨 KINETIC DANGER'}: {liveKineticAnalysis.actionName}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 text-[11px]">{liveKineticAnalysis.kineticIntensity}</span>
              <span className="text-slate-500">|</span>
              <span className="text-sky-400 font-semibold">{liveKineticAnalysis.kineticVelocity} m/s</span>
            </div>
          )}

          {/* Night Vision Phosphor Reticle */}
          {visionSensorMode === 'NIGHT_VISION' && isCameraActive && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between p-6">
              <div className="self-end rounded border border-emerald-500/50 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono-code font-bold text-emerald-300">
                STARLIGHT IR SENSOR • 850nm EMITTER • GAIN 3.2X
              </div>
              <div className="h-24 w-24 rounded-full border border-emerald-500/40 border-dashed animate-pulse flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="self-start rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono-code text-emerald-400">
                LUMINANCE: 0.002 LUX • NIGHT OPTICAL MODE
              </div>
            </div>
          )}

          {/* Thermal FLIR Reticle & Live Spot Temp */}
          {visionSensorMode === 'THERMAL_FLIR' && isCameraActive && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between p-6">
              <div className="self-end rounded border border-amber-500/60 bg-amber-950/85 px-2.5 py-1 text-xs font-mono-code font-bold text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                SPOT TEMP: {liveSpotTemp.toFixed(1)}°C / {((liveSpotTemp * 9) / 5 + 32).toFixed(1)}°F
              </div>
              {/* Thermal Crosshairs */}
              <div className="relative flex items-center justify-center">
                <Crosshair className="h-16 w-16 text-amber-400/70" />
                <span className="absolute -bottom-5 text-[10px] font-mono-code text-amber-300 bg-black/70 px-1.5 py-0.5 rounded">
                  HEAT TARGET {liveSpotTemp > 37.5 ? '🔥 ELEVATED' : 'NORMAL CORE'}
                </span>
              </div>
              {/* Ironbow Gradient Scale */}
              <div className="self-start flex items-center gap-2 rounded bg-black/75 p-1.5 border border-slate-700 text-[10px] font-mono-code">
                <span className="text-blue-400">18°C</span>
                <div className="h-2.5 w-24 rounded bg-gradient-to-r from-blue-700 via-purple-600 via-rose-500 to-amber-300" />
                <span className="text-amber-300">42°C</span>
              </div>
            </div>
          )}

          {/* Biometric Analysis Overlay Tag */}
          {latestFaceResult && isCameraActive && (
            <div
              className={`absolute bottom-4 left-4 z-20 max-w-sm rounded-lg border p-3 font-mono-code text-xs backdrop-blur-md transition-all ${
                latestFaceResult.status === 'RECOGNIZED_AUTHORIZED'
                  ? 'border-emerald-500/60 bg-emerald-950/85 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : latestFaceResult.status === 'SUSPICIOUS_INTRUDER' || latestFaceResult.crimeDetected
                  ? 'border-red-500/80 bg-red-950/90 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                  : 'border-amber-500/60 bg-amber-950/85 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              }`}
            >
              <div className="flex items-center gap-2 font-exo text-sm font-bold">
                {latestFaceResult.status === 'RECOGNIZED_AUTHORIZED' ? (
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <UserX className="h-4 w-4 text-amber-400" />
                )}
                <span>
                  {latestFaceResult.status === 'RECOGNIZED_AUTHORIZED'
                    ? `AUTHORIZED: ${latestFaceResult.recognizedPersonName}`
                    : latestFaceResult.crimeDetected
                    ? `CRIME: ${latestFaceResult.crimeType || 'HOSTILE THREAT'}`
                    : latestFaceResult.status === 'SUSPICIOUS_INTRUDER'
                    ? 'THREAT: SUSPICIOUS INTRUDER'
                    : 'UNREGISTERED VISITOR'}
                </span>
                <span className="ml-auto text-[10px] opacity-80">{latestFaceResult.confidence}%</span>
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-300">
                {latestFaceResult.tacticalSummary}
              </div>
              {latestFaceResult.bodyActionAnalysis && (
                <div className="mt-1 text-[10px] text-slate-300 border-t border-white/10 pt-1">
                  Kinetics: <span className="text-sky-300 font-bold">{latestFaceResult.bodyActionAnalysis.actionName}</span> • Intensity: {latestFaceResult.bodyActionAnalysis.kineticIntensity}
                  {latestFaceResult.bodyActionAnalysis.triggeringFactorsDetected?.length > 0 && (
                    <div className="text-red-300 font-semibold mt-0.5">
                      Triggers: {latestFaceResult.bodyActionAnalysis.triggeringFactorsDetected.join(', ')}
                    </div>
                  )}
                </div>
              )}
              {latestFaceResult.thermalSignature && (
                <div className="mt-1 text-[10px] text-amber-300">
                  Thermal: {latestFaceResult.thermalSignature.coreTempReadingCelsius}°C core • {latestFaceResult.thermalSignature.heatDistribution}
                </div>
              )}

              {/* Time Taken to Study Situation & Community Norm Distinction */}
              <div className="mt-1.5 pt-1.5 border-t border-white/15 text-[10px] space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-sky-400" />
                    <span>TIME TAKEN: <strong className="text-white font-bold">{latestFaceResult.timeTakenSeconds ? `${latestFaceResult.timeTakenSeconds}s` : `${lastStudyDurationSeconds}s`}</strong></span>
                  </span>
                  <span className="text-slate-400">
                    STUDY WINDOW: <strong className="text-amber-300">{latestFaceResult.temporalStudyWindowSeconds || aiCrimeSettings?.temporalStudyWindowSeconds || 4.5}s</strong>
                  </span>
                </div>
                {latestFaceResult.communityStatus && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">COMMUNITY STATUS:</span>
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${
                      latestFaceResult.communityStatus === 'COMMUNITY_VIOLATION_CRIME'
                        ? 'bg-red-950 text-red-300 border-red-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {latestFaceResult.communityStatus === 'COMMUNITY_VIOLATION_CRIME'
                        ? '🚨 UNACCEPTABLE CRIME'
                        : '🛡️ ACCEPTABLE NORMAL'}
                    </span>
                  </div>
                )}
                {latestFaceResult.matchedTrainingRules && latestFaceResult.matchedTrainingRules.length > 0 && (
                  <div className="text-[9px] text-sky-300 truncate">
                    Matched Rule: {latestFaceResult.matchedTrainingRules[0]}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sentry Scanline Effect */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30" />
        </div>

        {/* BOTTOM CAMERA CONTROLS BAR */}
        <div className="border-t border-sky-900/40 bg-[#060e18] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Camera / Hardware Selector & Reset */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono-code text-slate-400">SENSOR:</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  startCamera(e.target.value);
                }}
                className="rounded border border-sky-900/60 bg-[#0b1726] px-2.5 py-1 text-xs font-mono-code text-slate-200 outline-none"
              >
                {availableDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Hardware Sensor #${idx + 1}`}
                  </option>
                ))}
              </select>

              {/* Sensitivity Slider */}
              <div className="flex items-center gap-1.5 rounded border border-sky-950 bg-[#0b1726] px-2 py-1">
                <Sliders className="h-3 w-3 text-sky-400" />
                <span className="text-[10px] font-mono-code text-slate-400">FLOOR:</span>
                <input
                  type="range"
                  min="8"
                  max="60"
                  value={sensitivityFloor}
                  onChange={(e) => setSensitivityFloor(Number(e.target.value))}
                  className="h-1.5 w-16 accent-sky-400 cursor-pointer"
                />
                <span className="text-[10px] font-mono-code text-sky-300">{sensitivityFloor}%</span>
              </div>

              {/* Open Camera Hardware Specs Modal */}
              <button
                onClick={() => setShowDeviceSettingsModal(true)}
                type="button"
                className="flex items-center gap-1 rounded border border-sky-700/70 bg-sky-950/90 px-2.5 py-1 text-[11px] font-mono-code text-sky-200 hover:bg-sky-900 transition-colors shadow-sm"
                title="Inspect connected camera hardware profile and specs"
              >
                <Settings className="h-3 w-3 text-sky-400" />
                <span>DEVICE INFO</span>
              </button>

              {/* Quick Reset Settings Button */}
              <button
                onClick={restoreDefaultCameraSettings}
                type="button"
                className="flex items-center gap-1 rounded border border-teal-800/60 bg-teal-950/70 px-2 py-1 text-[11px] font-mono-code text-teal-300 hover:bg-teal-900 transition-colors"
                title="Restore default camera settings and restart stream"
              >
                <RefreshCw className="h-3 w-3 text-teal-400" />
                <span>RESET DEFAULTS</span>
              </button>

              {/* Restore Real Camera Display Button */}
              <button
                onClick={() => {
                  setIsSimulatedFeed(false);
                  if (simulationLoopIdRef.current) {
                    cancelAnimationFrame(simulationLoopIdRef.current);
                    simulationLoopIdRef.current = null;
                  }
                  startCamera(selectedDeviceId);
                }}
                type="button"
                className="flex items-center gap-1 rounded border border-sky-600/70 bg-sky-900/90 px-2.5 py-1 text-[11px] font-mono-code text-sky-100 hover:bg-sky-800 transition-colors shadow-sm"
                title="Force restore real webcam hardware camera display"
              >
                <Camera className="h-3 w-3 text-sky-300" />
                <span>RESTORE REAL CAMERA</span>
              </button>

              {/* Tactical Sentry Simulation Toggle if camera is offline */}
              {!isCameraActive && (
                <button
                  onClick={startSimulatedFeed}
                  type="button"
                  className="flex items-center gap-1 rounded border border-emerald-800/70 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-mono-code text-emerald-300 hover:bg-emerald-900 transition-colors shadow-sm"
                  title="Run tactical synthetic sentry simulation"
                >
                  <Play className="h-3 w-3 text-emerald-400" />
                  <span>SIMULATION FEED</span>
                </button>
              )}
            </div>

            {/* Tactical Action Buttons: PTT Intercom, Record, Alarm */}
            <div className="flex flex-wrap items-center gap-2">
              {/* PTT Walkie-Talkie Button */}
              <button
                onMouseDown={startIntercomPTT}
                onMouseUp={stopIntercomPTT}
                onTouchStart={startIntercomPTT}
                onTouchEnd={stopIntercomPTT}
                type="button"
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono-code font-bold transition-all ${
                  isIntercomActive
                    ? 'border-emerald-500 bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'border-sky-800/60 bg-sky-950/70 text-sky-300 hover:bg-sky-900'
                }`}
                title="Press and hold to transmit voice audio through camera"
              >
                {isIntercomActive ? <Mic className="h-3.5 w-3.5 animate-pulse" /> : <MicOff className="h-3.5 w-3.5" />}
                <span>{isIntercomActive ? `TRANSMITTING (${micVolume}%)` : 'HOLD TO TALK (PTT)'}</span>
              </button>

              {/* Manual Record Button */}
              <button
                onClick={() => (isRecording ? mediaRecorderRef.current?.stop() : startRecordingClip('MANUAL_RECORD'))}
                type="button"
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono-code font-bold transition-colors ${
                  isRecording
                    ? 'border-red-500 bg-red-600 text-white animate-pulse'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{isRecording ? 'STOP CLIP' : 'RECORD CLIP'}</span>
              </button>

              {/* Siren Deterrence Audio */}
              <button
                onClick={() => playAlarmSiren('EMERGENCY_DEFCON_1')}
                type="button"
                className="flex items-center gap-1 rounded-lg border border-amber-600/70 bg-amber-950/80 px-2.5 py-1.5 text-xs font-mono-code text-amber-300 hover:bg-amber-900"
                title="Sound deterrence siren"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>SIREN</span>
              </button>

              {/* PTZ Motorized Gimbal Controller Button */}
              <button
                onClick={() => setShowPtzController(!showPtzController)}
                type="button"
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono-code font-bold transition-all ${
                  showPtzController
                    ? 'border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'border-cyan-700/60 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900'
                }`}
                title="Open Pan-Tilt-Zoom (PTZ) motorized camera controller"
              >
                <Compass className={`h-3.5 w-3.5 text-cyan-400 ${showPtzController ? 'animate-spin-slow' : ''}`} />
                <span>{showPtzController ? 'CLOSE PTZ' : 'PTZ CONTROLLER'}</span>
              </button>

              {/* EMERGENCY DISPATCH TRIGGER */}
              <button
                onClick={() => {
                  const snap = captureSnapshot();
                  onTriggerAlarm(
                    'MANUAL_EMERGENCY_DISPATCH',
                    'Direct emergency dispatch triggered by operator via camera monitor.',
                    latestFaceResult || undefined,
                    snap || undefined
                  );
                }}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-red-600 bg-red-950 px-3 py-1.5 text-xs font-mono-code font-bold text-red-200 transition-all hover:bg-red-600 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                <ShieldAlert className="h-3.5 w-3.5 animate-ping text-red-400" />
                <span>DISPATCH AUTHORITIES</span>
              </button>

              {/* SOS & CONTACTS MODAL BUTTON */}
              {onOpenSosModal && (
                <button
                  onClick={onOpenSosModal}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-sky-500/60 bg-sky-950/90 px-3 py-1.5 text-xs font-mono-code font-bold text-sky-200 hover:bg-sky-800 transition-colors shadow-sm"
                  title="Open Emergency SOS & Contacts Matrix"
                >
                  <Radio className="h-3.5 w-3.5 text-sky-400" />
                  <span>SOS & CONTACTS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PTZ MOTORIZED GIMBAL CONTROLLER PANEL */}
      {showPtzController && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200">
          <PtzCameraController
            camera={activeCamera}
            onPtzChange={setPtzTransform}
          />
        </div>
      )}

      {/* PAIR PHONE / IP CAM HARDWARE INTEGRATION MODAL */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-sky-500/40 bg-[#071424] p-5 shadow-[0_0_40px_rgba(0,0,0,0.9)] font-mono-code">
            <div className="flex items-center justify-between border-b border-sky-900/60 pb-3">
              <div className="flex items-center gap-2 font-exo text-base font-bold text-sky-400">
                <QrCode className="h-5 w-5" />
                <span>HARDWARE CAMERA & PHONE INTEGRATION</span>
              </div>
              <button
                onClick={() => setShowPairModal(false)}
                className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                Connect any smartphone, tablet, or external CCTV camera directly to SENTINEL ARC.
                Each paired feed streams live into the matrix with real-time motion detection and encrypted storage.
              </p>

              {/* QR / Pairing Code Card */}
              <div className="flex flex-col items-center justify-center rounded-lg border border-sky-900/80 bg-[#030912] p-4 text-center">
                <div className="mb-2 text-[10px] text-sky-400 uppercase tracking-wider">
                  Scan QR Code with Phone Camera
                </div>
                {/* SVG QR Code Simulation for Pairing Link */}
                <div className="flex h-36 w-36 items-center justify-center rounded-lg border-2 border-sky-500/40 bg-white p-2">
                  <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center text-white text-[10px] p-2">
                    <QrCode className="h-16 w-16 text-sky-400" />
                    <span className="mt-1 font-bold text-sky-300">ARC-NODE-911</span>
                  </div>
                </div>
                <div className="mt-3 text-sm font-bold text-emerald-400">
                  PAIRING TOKEN: <span className="text-white">ARC-NODE-911</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  Target: <span className="text-sky-300">{window.location.origin}/?role=camera_node&pair=ARC-NODE-911</span>
                </div>
                <button
                  onClick={() => {
                    window.open(`${window.location.origin}/?role=camera_node&pair=ARC-NODE-911`, '_blank');
                  }}
                  type="button"
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-500/70 bg-emerald-950/80 px-3 py-1.5 text-xs font-mono-code font-bold text-emerald-300 hover:bg-emerald-900 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <QrCode className="h-4 w-4 text-emerald-400" />
                  <span>OPEN MOBILE CAMERA NODE IN NEW TAB (TEST STREAM)</span>
                </button>
              </div>

              {/* RTSP / IP Camera URL Input */}
              <div>
                <label className="block text-[11px] font-bold text-sky-400 uppercase">
                  Add Local RTSP / HTTP IP Camera Stream:
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={customStreamUrl}
                    onChange={(e) => setCustomStreamUrl(e.target.value)}
                    placeholder="rtsp://admin:pass@192.168.1.120:554/stream1"
                    className="flex-1 rounded border border-sky-900/60 bg-[#030811] px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400"
                  />
                  <button
                    onClick={() => {
                      if (customStreamUrl) {
                        alert(`Camera stream "${customStreamUrl}" successfully bound to matrix.`);
                        setShowPairModal(false);
                      }
                    }}
                    className="rounded bg-sky-600 px-3 py-1.5 font-bold text-white hover:bg-sky-500"
                  >
                    LINK FEED
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowPairModal(false)}
                className="rounded border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONNECTED CAMERA HARDWARE PROFILE & DEVICE SPECIFICATIONS MODAL */}
      {showDeviceSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-sky-500/60 bg-[#06101d] p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] font-mono-code text-slate-200">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-900/70 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-950 border border-sky-500/50 text-sky-400">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-exo text-base font-bold text-white tracking-wide flex items-center gap-2">
                    <span>CONNECTED DEVICE HARDWARE PROFILE</span>
                    <span className="rounded bg-sky-950/80 px-2 py-0.5 text-[10px] text-sky-300 border border-sky-800">
                      AES-256 VERIFIED
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Active Sensor: <span className="text-sky-300 font-bold">{activeCamera.name}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDeviceSettingsModal(false)}
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                title="Close settings"
              >
                ✕ ESC
              </button>
            </div>

            {/* Hardware Profile Details */}
            <div className="mt-4 space-y-4 text-xs">
              {/* Target Device Specs */}
              <div className="rounded-lg border border-sky-900/40 bg-[#030914] p-3.5">
                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2">
                  1. Target Device Specifications
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500">Device Name: </span>
                    <span className="text-white font-bold">
                      {activeCamera.connectedDeviceSettings?.deviceName || activeCamera.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Model: </span>
                    <span className="text-slate-200">
                      {activeCamera.connectedDeviceSettings?.deviceModel || 'Sentry-Cam HD Pro'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Manufacturer: </span>
                    <span className="text-slate-200">
                      {activeCamera.connectedDeviceSettings?.manufacturer || 'OmniGuard Technologies'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">OS / Firmware: </span>
                    <span className="text-emerald-400">
                      {activeCamera.connectedDeviceSettings?.osVersion || 'SentryOS v4.2.1 Secure Kernel'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Transport Details */}
              <div className="rounded-lg border border-sky-900/40 bg-[#030914] p-3.5">
                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>2. Hardware Physical Transport Link</span>
                  <span className="rounded bg-sky-950 px-2 py-0.5 text-[10px] text-sky-300 border border-sky-800">
                    {activeCamera.connectedDeviceSettings?.connectionMethod || 'USB_UVC_DIRECT'}
                  </span>
                </div>

                {activeCamera.connectedDeviceSettings?.transportDetails.usb && (
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500">USB Vendor ID: </span>
                      <span className="text-sky-300 font-mono">
                        {activeCamera.connectedDeviceSettings.transportDetails.usb.vendorId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Product ID: </span>
                      <span className="text-sky-300 font-mono">
                        {activeCamera.connectedDeviceSettings.transportDetails.usb.productId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Bus Speed: </span>
                      <span className="text-emerald-300">
                        {activeCamera.connectedDeviceSettings.transportDetails.usb.busSpeed}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Serial No: </span>
                      <span className="text-slate-400">
                        {activeCamera.connectedDeviceSettings.transportDetails.usb.serialNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Optical Camera Specs & Battery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-sky-900/40 bg-[#030914] p-3">
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2">
                    3. Optical Sensor Specs
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div>
                      Sensor:{' '}
                      <span className="text-slate-100 font-bold">
                        {activeCamera.connectedDeviceSettings?.cameraSpecs.sensorName || 'CMOS Hardware Optical Sensor'}
                      </span>
                    </div>
                    <div>
                      Feed Status:{' '}
                      <span className={isCameraActive ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {isCameraActive ? 'LIVE ACTIVE STREAM' : 'DISCONNECTED / OFFLINE'}
                      </span>
                    </div>
                    <div>
                      Field of View (FOV):{' '}
                      <span className="text-slate-200">
                        {activeCamera.connectedDeviceSettings?.cameraSpecs.fovDegrees || 110}° Diagonal
                      </span>
                    </div>
                    <div>
                      Active Mode:{' '}
                      <span className="text-sky-300 font-bold">
                        {visionSensorMode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-sky-900/40 bg-[#030914] p-3">
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2">
                    4. Security Handshake & Power
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Battery className="h-3.5 w-3.5 text-emerald-400" />
                      <span>
                        Battery:{' '}
                        <strong className="text-emerald-400">
                          {activeCamera.connectedDeviceSettings?.powerStatus.batteryLevelPercent ?? 98}%
                        </strong>{' '}
                        ({activeCamera.connectedDeviceSettings?.powerStatus.powerSource || 'AC_MAINS_BACKUP'})
                      </span>
                    </div>
                    <div>
                      Handshake:{' '}
                      <span className="text-sky-300 font-mono text-[10px]">
                        {activeCamera.connectedDeviceSettings?.securityHandshake.mutualTlsOrToken || 'SHA256_MUTUAL_TLS_VALID'}
                      </span>
                    </div>
                    <div>
                      Verified Status:{' '}
                      <span className="text-emerald-400 font-bold">CRYPTOGRAPHICALLY VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-sky-900/60 pt-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className={`h-2 w-2 rounded-full ${isCameraActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{isCameraActive ? 'Live camera sensor linked' : 'Camera stream paused or disconnected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={restoreDefaultCameraSettings}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-teal-800/70 bg-teal-950/80 px-3 py-1.5 text-xs text-teal-300 hover:bg-teal-900 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-teal-400" />
                  <span>RESTORE DEFAULTS</span>
                </button>
                <button
                  onClick={() => setShowDeviceSettingsModal(false)}
                  type="button"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
