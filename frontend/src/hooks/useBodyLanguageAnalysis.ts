import { useRef, useCallback, useEffect } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

// Landmark indices for eye and face analysis
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const NOSE_TIP = 1;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

interface AnalysisSnapshot {
  eyeContact: boolean;      // Is the user looking at camera?
  faceDetected: boolean;    // Is a face visible?
  faceCentered: boolean;    // Is the face centered in frame?
  headStable: boolean;      // Is the head relatively still?
  mouthMovement: number;    // How much is the mouth moving (0-1)
  timestamp: number;
}

export interface BodyLanguageData {
  eyeContact: number;       // Percentage (0-100)
  faceOrientation: number;  // Percentage facing camera (0-100)
  confidenceScore: number;  // Overall confidence (0-100)
  suggestions: string[];
}

export function useBodyLanguageAnalysis() {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const snapshotsRef = useRef<AnalysisSnapshot[]>([]);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);
  const lastHeadPosRef = useRef<{ x: number; y: number } | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize MediaPipe Face Landmarker
  const initialize = useCallback(async () => {
    if (faceLandmarkerRef.current) return;

    // Prevent multiple simultaneous inits
    if (initPromiseRef.current) {
      await initPromiseRef.current;
      return;
    }

    initPromiseRef.current = (async () => {
      try {
        console.log('[BodyLanguage] Initializing MediaPipe Face Landmarker...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });

        console.log('[BodyLanguage] MediaPipe Face Landmarker ready ✅');
      } catch (error) {
        console.error('[BodyLanguage] Failed to initialize:', error);
      }
    })();

    await initPromiseRef.current;
  }, []);

  // Analyze a single video frame
  const analyzeFrame = useCallback((video: HTMLVideoElement): AnalysisSnapshot | null => {
    if (!faceLandmarkerRef.current || !video || video.readyState < 2) {
      return null;
    }

    try {
      const result: FaceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(
        video,
        performance.now()
      );

      if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
        return {
          eyeContact: false,
          faceDetected: false,
          faceCentered: false,
          headStable: false,
          mouthMovement: 0,
          timestamp: Date.now(),
        };
      }

      const landmarks = result.faceLandmarks[0];

      // ─── Eye Contact Detection ───
      // Calculate iris position relative to eye corners
      const leftIrisCenter = getCenter(LEFT_IRIS.map(i => landmarks[i]));
      const rightIrisCenter = getCenter(RIGHT_IRIS.map(i => landmarks[i]));
      const leftEyeCenter = midpoint(landmarks[LEFT_EYE_INNER], landmarks[LEFT_EYE_OUTER]);
      const rightEyeCenter = midpoint(landmarks[RIGHT_EYE_INNER], landmarks[RIGHT_EYE_OUTER]);

      const leftDeviation = Math.abs(leftIrisCenter.x - leftEyeCenter.x);
      const rightDeviation = Math.abs(rightIrisCenter.x - rightEyeCenter.x);
      const avgDeviation = (leftDeviation + rightDeviation) / 2;
      const eyeContact = avgDeviation < 0.025; // Threshold for "looking at camera"

      // ─── Face Orientation ───
      const noseTip = landmarks[NOSE_TIP];
      const leftCheek = landmarks[LEFT_CHEEK];
      const rightCheek = landmarks[RIGHT_CHEEK];

      // Face is centered if nose is roughly in the middle
      const faceCenterX = noseTip.x;
      const faceCenterY = noseTip.y;
      const faceCentered = faceCenterX > 0.25 && faceCenterX < 0.75 && faceCenterY > 0.15 && faceCenterY < 0.85;

      // Check if face is rotated (yaw) by comparing left/right cheek distances to nose
      const leftDist = Math.abs(leftCheek.x - noseTip.x);
      const rightDist = Math.abs(rightCheek.x - noseTip.x);
      const yawRatio = Math.min(leftDist, rightDist) / Math.max(leftDist, rightDist);
      const isFacingCamera = yawRatio > 0.6; // Not turned too much

      // ─── Head Stability ───
      const currentHeadPos = { x: noseTip.x, y: noseTip.y };
      let headStable = true;
      if (lastHeadPosRef.current) {
        const movement = Math.sqrt(
          Math.pow(currentHeadPos.x - lastHeadPosRef.current.x, 2) +
          Math.pow(currentHeadPos.y - lastHeadPosRef.current.y, 2)
        );
        headStable = movement < 0.03; // Low movement threshold
      }
      lastHeadPosRef.current = currentHeadPos;

      // ─── Mouth Movement (from blendshapes) ───
      let mouthMovement = 0;
      if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
        const blendshapes = result.faceBlendshapes[0].categories;
        const jawOpen = blendshapes.find(b => b.categoryName === 'jawOpen');
        mouthMovement = jawOpen ? jawOpen.score : 0;
      }

      return {
        eyeContact,
        faceDetected: true,
        faceCentered: faceCentered && isFacingCamera,
        headStable,
        mouthMovement,
        timestamp: Date.now(),
      };
    } catch (error) {
      // Silently ignore frame errors (can happen if video not ready)
      return null;
    }
  }, []);

  // Start continuous analysis (call every ~2 seconds to avoid overload)
  const startAnalysis = useCallback((videoElement: HTMLVideoElement) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    snapshotsRef.current = [];

    analysisIntervalRef.current = setInterval(() => {
      const snapshot = analyzeFrame(videoElement);
      if (snapshot) {
        snapshotsRef.current.push(snapshot);
      }
    }, 2000); // Analyze every 2 seconds

    console.log('[BodyLanguage] Analysis started');
  }, [analyzeFrame]);

  // Stop analysis and return aggregated results
  const stopAnalysis = useCallback((): BodyLanguageData => {
    isRunningRef.current = false;
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    const snapshots = snapshotsRef.current;
    if (snapshots.length === 0) {
      return {
        eyeContact: 0,
        faceOrientation: 0,
        confidenceScore: 0,
        suggestions: ['No face was detected during the interview. Ensure your camera is on and your face is visible.'],
      };
    }

    // Calculate percentages from snapshots
    const detected = snapshots.filter(s => s.faceDetected);
    const total = detected.length || 1;

    const eyeContactPercent = Math.round((detected.filter(s => s.eyeContact).length / total) * 100);
    const faceCenteredPercent = Math.round((detected.filter(s => s.faceCentered).length / total) * 100);
    const headStablePercent = Math.round((detected.filter(s => s.headStable).length / total) * 100);
    const faceDetectedPercent = Math.round((detected.length / snapshots.length) * 100);

    // Calculate confidence score (weighted average)
    const confidenceScore = Math.round(
      eyeContactPercent * 0.35 +
      faceCenteredPercent * 0.25 +
      headStablePercent * 0.25 +
      faceDetectedPercent * 0.15
    );

    // Generate suggestions based on analysis
    const suggestions: string[] = [];

    if (eyeContactPercent < 50) {
      suggestions.push('Try to maintain more eye contact with the camera. Look directly at the webcam lens when speaking — this simulates real eye contact in video interviews.');
    } else if (eyeContactPercent < 75) {
      suggestions.push('Your eye contact is decent but could improve. Focus on looking at the camera more consistently, especially when answering questions.');
    }

    if (faceCenteredPercent < 60) {
      suggestions.push('Keep your face centered in the frame. Position your camera at eye level and sit at a comfortable distance so your head and shoulders are visible.');
    }

    if (headStablePercent < 50) {
      suggestions.push('Try to minimize excessive head movement. While natural movement is fine, too much fidgeting can appear nervous. Keep your posture steady and composed.');
    }

    if (faceDetectedPercent < 80) {
      suggestions.push('Your face was not visible for parts of the interview. Make sure you stay in frame throughout and ensure good lighting on your face.');
    }

    if (confidenceScore >= 75 && suggestions.length === 0) {
      suggestions.push('Excellent body language! You maintained great eye contact and composure. Keep this up in real interviews.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Overall decent body language. Continue practicing to build more natural confidence on camera.');
    }

    console.log(`[BodyLanguage] Analysis complete: eye=${eyeContactPercent}%, face=${faceCenteredPercent}%, stable=${headStablePercent}%, confidence=${confidenceScore}%`);

    return {
      eyeContact: eyeContactPercent,
      faceOrientation: faceCenteredPercent,
      confidenceScore,
      suggestions,
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, []);

  return { initialize, startAnalysis, stopAnalysis };
}

// ─── Utility helpers ───

function getCenter(points: Array<{ x: number; y: number; z: number }>) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
