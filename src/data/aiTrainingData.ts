import { AiCrimeDetectionSettings, AiTrainingContentItem } from '../types';

export const INITIAL_AI_TRAINING_ITEMS: AiTrainingContentItem[] = [
  // 1. VIDEO DEMO: Crime - Forced Entry & Crowbar Prying
  {
    id: 'TRN-VID-01',
    title: 'Forced Entry via Mechanical Prying Tool (Crowbar/Screwdriver)',
    method: 'VIDEO_DEMO',
    category: 'CRIME_UNACCEPTABLE',
    crimeType: 'BURGLARY_FORCED_BREACH',
    severity: 'CRITICAL_EMERGENCY',
    description:
      'Video analysis of suspect applying lateral force with metallic lever to door jamb or window frame in perimeter zone.',
    distinctionCriteria:
      'Distinguished from normal key insertion by asymmetric repetitive leverage motion, body leaning weight against the frame, lack of legitimate unlocking motion, and metallic tool profile.',
    studyTimeRequirementSeconds: 2.2,
    dateAdded: '2026-09-18 14:20:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
    videoDemo: {
      fileName: 'cctv_training_breach_test_04.mp4',
      durationSeconds: 12,
      annotatedKeyframesCount: 36,
      sampleClipType: 'BREAK_IN',
      taggedCrimeMoments: ['00:02.1 - Suspect approaches with concealed tool', '00:04.5 - Lever inserted into door seam', '00:06.8 - High kinetic force breach'],
    },
    gestureKinematics: {
      stanceName: 'Leverage Prying Stance',
      bodyPostures: ['Two-handed forward push against vertical surface', 'Lowered center of gravity', 'Foot braced on door threshold'],
      intensity: 'HIGH_SUDDEN',
    },
  },

  // 2. VIDEO DEMO: Normal - Courier Parcel Delivery
  {
    id: 'TRN-VID-02',
    title: 'Legitimate Courier Package Delivery & Digital Confirmation',
    method: 'VIDEO_DEMO',
    category: 'COMMUNITY_NORMAL_ACCEPTABLE',
    severity: 'BENIGN_NORMAL',
    description:
      'Standard parcel delivery workflow: uniform/high-vis outerwear, holding boxed cardboard parcel with printed label, gently setting down at doorway, photographing with handheld device.',
    distinctionCriteria:
      'Distinguished from prowling or theft by open posture, clear parcel in hands, mobile scanner verification, no door tampering, and prompt departure.',
    studyTimeRequirementSeconds: 2.8,
    dateAdded: '2026-09-18 15:10:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
    videoDemo: {
      fileName: 'courier_normal_delivery_workflow.mp4',
      durationSeconds: 16,
      annotatedKeyframesCount: 48,
      sampleClipType: 'NORMAL_DELIVERY',
      taggedCrimeMoments: ['00:01.2 - Uniformed approach with box', '00:05.4 - Package placed on welcome mat', '00:08.0 - Photo confirmation and peaceful exit'],
    },
    gestureKinematics: {
      stanceName: 'Bending Parcel Placement',
      bodyPostures: ['Upright walking approach', 'Controlled knee bend to set box down', 'Phone raised for barcode capture'],
      intensity: 'MODERATE_NORMAL',
    },
  },

  // 3. BODY GESTURE: Crime - Weapon Draw & Threat Brandishing
  {
    id: 'TRN-GES-01',
    title: 'Concealed Weapon Draw Stroke & Pointing Vector',
    method: 'GESTURE_MOVEMENT',
    category: 'CRIME_UNACCEPTABLE',
    crimeType: 'ARMED_ASSAULT_WEAPON',
    severity: 'CRITICAL_EMERGENCY',
    description:
      'Kinematic movement signature: sudden asymmetric reach of dominant hand to waistband, jacket interior, or pocket, followed by rapid two-handed Weaver or Isosceles forward arm lock.',
    distinctionCriteria:
      'Distinguished from retrieving a cell phone by rigid two-handed target tracking, bladed combat footing, weapon silhouette, and elevated kinetic acceleration.',
    studyTimeRequirementSeconds: 1.0,
    dateAdded: '2026-09-18 16:30:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
    gestureKinematics: {
      stanceName: 'Combat Tactical Draw & Extension',
      bodyPostures: ['Dominant hand dips to hip/waistband', 'Torso turns 45 degrees bladed', 'Arms thrust forward horizontally', 'Rigid head-eye lock on target'],
      intensity: 'VIOLENT_EXPLOSIVE',
    },
  },

  // 4. BODY GESTURE: Normal - Friendly Hand Wave & Key Unlocking
  {
    id: 'TRN-GES-02',
    title: 'Peaceful Neighbor Wave, Greeting & Keychain Handling',
    method: 'GESTURE_MOVEMENT',
    category: 'COMMUNITY_NORMAL_ACCEPTABLE',
    severity: 'BENIGN_NORMAL',
    description:
      'Everyday community interaction: hand raised above shoulder with open palm swaying side-to-side, smiling or relaxed facial micro-expressions, retrieving keychain smoothly from bag/pocket.',
    distinctionCriteria:
      'Distinguished from hostile gesturing by absence of clenched fists, relaxed kinetic rhythm (<1.2 m/s limb velocity), open palms, and upright symmetrical posture.',
    studyTimeRequirementSeconds: 1.8,
    dateAdded: '2026-09-18 17:00:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
    gestureKinematics: {
      stanceName: 'Open-Palm Casual Greeting',
      bodyPostures: ['Open palm raised at 45 to 90 degrees', 'Natural body weight shifting', 'Fingers spread non-threateningly'],
      intensity: 'LOW_REST',
    },
  },

  // 5. TEXT DESCRIPTION: Crime - Nighttime Boundary Scaling & Prowling
  {
    id: 'TRN-TXT-01',
    title: 'Perimeter Fence Scaling & Low-Crouch Stealth Prowling (Post 22:00)',
    method: 'TEXT_DESCRIPTION',
    category: 'CRIME_UNACCEPTABLE',
    crimeType: 'TRESPASS_PROWLING',
    severity: 'HIGH',
    description:
      'Rule & Legal Statute: Any individual climbing over perimeter fences, scaling gates, or navigating through shrubbery/blind spots in low-crouch profile after 22:00 hours without credentials.',
    distinctionCriteria:
      'Legitimate residents and visitors enter through illuminated pathways and pedestrian portals. Climbing barriers combined with face concealment constitutes definitive trespass.',
    studyTimeRequirementSeconds: 3.5,
    dateAdded: '2026-09-18 17:45:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
  },

  // 6. TEXT DESCRIPTION: Normal - Resident Evening Stroll & Pet Walking
  {
    id: 'TRN-TXT-02',
    title: 'Community Walkway Leisure, Dog Walking & Jogging',
    method: 'TEXT_DESCRIPTION',
    category: 'COMMUNITY_NORMAL_ACCEPTABLE',
    severity: 'BENIGN_NORMAL',
    description:
      'Community Norm: Pedestrians walking along paved sidewalks, accompanying leashed pets, jogging in athletic gear, or carrying groceries. Permissible at all hours on public/shared accessways.',
    distinctionCriteria:
      'Maintains continuous forward pace on designated paths; does not linger at private windows, test door handles, or conceal appearance.',
    studyTimeRequirementSeconds: 2.5,
    dateAdded: '2026-09-18 18:15:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
  },

  // 7. ACOUSTIC SIGNATURE: Crime - Glass Break & High-Decibel Scream
  {
    id: 'TRN-ACS-01',
    title: 'Tempered Glass Structural Fracture & Human Distress Vocalization',
    method: 'ACOUSTIC_SIGNATURE',
    category: 'CRIME_UNACCEPTABLE',
    crimeType: 'VANDALISM_BREAK_IN',
    severity: 'CRITICAL_EMERGENCY',
    description:
      'High-frequency harmonic burst (>4.5 kHz) characteristic of window glass shattering followed by sudden human vocal decibel spike exceeding 85dB SPL.',
    distinctionCriteria:
      'Distinguished from ambient road noise or dropped cookware by acoustic spectral envelope and correlated perimeter vibration.',
    studyTimeRequirementSeconds: 0.8,
    dateAdded: '2026-09-18 19:00:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
    audioAcoustic: {
      soundType: 'SHATTERING_GLASS_DISTRESS',
      decibelThreshold: 85,
      frequencyPattern: 'Impulsive high-frequency ring with subsequent broad-spectrum decay',
    },
  },

  // 8. COMMUNITY NORM RULE: Scheduled Maintenance & Sanitation Staff
  {
    id: 'TRN-NRM-01',
    title: 'Authorized Morning Sanitation & Landscaping Personnel (06:30 - 18:00)',
    method: 'COMMUNITY_NORM_RULE',
    category: 'COMMUNITY_NORMAL_ACCEPTABLE',
    severity: 'BENIGN_NORMAL',
    description:
      'Recognized community routine: Utility workers in high-visibility vests operating lawn trimmers, leaf blowers, or retrieving sanitation bins along driveways during daylight hours.',
    distinctionCriteria:
      'Correlated with official maintenance schedule, presence of utility carts/tools, and standardized daytime operating window.',
    studyTimeRequirementSeconds: 4.0,
    dateAdded: '2026-09-18 19:40:00',
    addedBy: 'Master Commander',
    status: 'ACTIVE_ENFORCED',
  },
];

export const DEFAULT_AI_CRIME_DETECTION_SETTINGS: AiCrimeDetectionSettings = {
  temporalStudyWindowSeconds: 4.5,
  minimumCrimeConfidenceThreshold: 80,
  minimumNormalConfidenceThreshold: 75,
  studyTimeForUrgentCrimeSeconds: 1.2,
  studyTimeForLoiteringSeconds: 15.0,
  studyTimeForNormalVerificationSeconds: 3.0,
  autoDispatchOnConfirmedCrime: true,
  continuousRealTimeObservation: true,
  trainingItems: INITIAL_AI_TRAINING_ITEMS,
};
