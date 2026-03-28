export interface PoseCoordinate {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

export interface KinematicAngles {
    left_knee_angle: number | null;
    right_knee_angle: number | null;
    left_hip_angle: number | null;
    right_hip_angle: number | null;
    left_ankle_angle: number | null;
    right_ankle_angle: number | null;
    trunk_lean_angle: number | null;
}

export interface KinematicFrameData {
    timestamp: number;
    landmarks: Record<string, PoseCoordinate>;
    angles: KinematicAngles;
}

export interface KinematicReport {
    exercise_name: string;
    frames_data: KinematicFrameData[];
}

export interface PoseSample {
    timestampMs: number;
    landmarks: unknown;
}

export interface PoseProcessingOptions {
    targetFps?: number;
    durationMs?: number;
    maxFrames?: number;
    minVisibility?: number;
    smoothingWindow?: number;
}

const LANDMARK_NAMES = [
    'nose',
    'left_eye_inner',
    'left_eye',
    'left_eye_outer',
    'right_eye_inner',
    'right_eye',
    'right_eye_outer',
    'left_ear',
    'right_ear',
    'mouth_left',
    'mouth_right',
    'left_shoulder',
    'right_shoulder',
    'left_elbow',
    'right_elbow',
    'left_wrist',
    'right_wrist',
    'left_pinky',
    'right_pinky',
    'left_index',
    'right_index',
    'left_thumb',
    'right_thumb',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
    'left_heel',
    'right_heel',
    'left_foot_index',
    'right_foot_index',
] as const;

const angleAt = (a?: PoseCoordinate, b?: PoseCoordinate, c?: PoseCoordinate): number | null => {
    if (!a || !b || !c) return null;
    const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
    const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
    const dot = (ab.x * cb.x) + (ab.y * cb.y) + (ab.z * cb.z);
    const magAb = Math.sqrt((ab.x * ab.x) + (ab.y * ab.y) + (ab.z * ab.z));
    const magCb = Math.sqrt((cb.x * cb.x) + (cb.y * cb.y) + (cb.z * cb.z));
    if (magAb === 0 || magCb === 0) return null;
    const normalized = Math.max(-1, Math.min(1, dot / (magAb * magCb)));
    const degrees = (Math.acos(normalized) * 180) / Math.PI;
    if (!Number.isFinite(degrees)) return null;
    return Number(degrees.toFixed(2));
};

const averagePoint = (a?: PoseCoordinate, b?: PoseCoordinate): PoseCoordinate | undefined => {
    if (!a || !b) return undefined;
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: ((a.z || 0) + (b.z || 0)) / 2,
    };
};

const trunkLeanAngle = (shoulderMid?: PoseCoordinate, hipMid?: PoseCoordinate): number | null => {
    if (!shoulderMid || !hipMid) return null;
    const verticalPoint: PoseCoordinate = { x: hipMid.x, y: hipMid.y - 1, z: hipMid.z || 0 };
    return angleAt(shoulderMid, hipMid, verticalPoint);
};

const normalizeCoordinate = (raw: any, minVisibility: number): PoseCoordinate | null => {
    if (!raw) return null;
    const x = Number(raw.x);
    const y = Number(raw.y);
    const z = Number(raw.z ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    const visibility = Number(raw.visibility ?? raw.score ?? raw.confidence);
    if (Number.isFinite(visibility) && visibility < minVisibility) return null;
    return {
        x,
        y,
        z,
        visibility: Number.isFinite(visibility) ? visibility : undefined,
    };
};

const normalizeLandmarks = (landmarks: unknown, minVisibility: number): Record<string, PoseCoordinate> => {
    const result: Record<string, PoseCoordinate> = {};
    if (!landmarks) return result;

    if (Array.isArray(landmarks)) {
        landmarks.forEach((item, index) => {
            const point = normalizeCoordinate(item, minVisibility);
            if (!point) return;
            const keyByName = typeof (item as any)?.name === 'string' ? (item as any).name : '';
            const keyByType = typeof (item as any)?.type === 'string' ? (item as any).type : '';
            const keyByIndex = LANDMARK_NAMES[index] || '';
            const key = keyByName || keyByType || keyByIndex;
            if (key) {
                result[key] = point;
            }
        });
        return result;
    }

    if (typeof landmarks === 'object') {
        Object.entries(landmarks as Record<string, unknown>).forEach(([key, value]) => {
            const point = normalizeCoordinate(value as any, minVisibility);
            if (point) {
                result[key] = point;
            }
        });
    }

    return result;
};

const clampWindow = (window?: number) => {
    if (!window || !Number.isFinite(window)) return 3;
    return Math.max(3, Math.min(5, Math.floor(window)));
};

const limitFrames = (samples: PoseSample[], maxFrames?: number): PoseSample[] => {
    const safeMax = Math.max(1, Math.floor(maxFrames || 20));
    if (samples.length <= safeMax) {
        return samples;
    }
    const stride = (samples.length - 1) / (safeMax - 1);
    const selected: PoseSample[] = [];
    for (let i = 0; i < safeMax; i += 1) {
        const index = Math.min(samples.length - 1, Math.round(i * stride));
        selected.push(samples[index]);
    }
    return selected;
};

const averageNumeric = (values: Array<number | null>): number | null => {
    const valid = values.filter((value): value is number => Number.isFinite(value as number));
    if (valid.length === 0) return null;
    const mean = valid.reduce((acc, value) => acc + value, 0) / valid.length;
    return Number(mean.toFixed(2));
};

const smoothAngles = (frames: KinematicFrameData[], smoothingWindow: number): KinematicFrameData[] => {
    return frames.map((frame, index) => {
        const start = Math.max(0, index - smoothingWindow + 1);
        const window = frames.slice(start, index + 1);
        return {
            ...frame,
            angles: {
                left_knee_angle: averageNumeric(window.map(item => item.angles.left_knee_angle)),
                right_knee_angle: averageNumeric(window.map(item => item.angles.right_knee_angle)),
                left_hip_angle: averageNumeric(window.map(item => item.angles.left_hip_angle)),
                right_hip_angle: averageNumeric(window.map(item => item.angles.right_hip_angle)),
                left_ankle_angle: averageNumeric(window.map(item => item.angles.left_ankle_angle)),
                right_ankle_angle: averageNumeric(window.map(item => item.angles.right_ankle_angle)),
                trunk_lean_angle: averageNumeric(window.map(item => item.angles.trunk_lean_angle)),
            },
        };
    });
};

export const extractAnglesFromLandmarks = (
    landmarks: unknown,
    options?: { minVisibility?: number },
): KinematicAngles => {
    const minVisibility = Number.isFinite(options?.minVisibility) ? Number(options?.minVisibility) : 0.35;
    const normalized = normalizeLandmarks(landmarks, minVisibility);
    return buildAngles(normalized);
};

const buildAngles = (landmarks: Record<string, PoseCoordinate>): KinematicAngles => {
    const leftShoulder = landmarks.left_shoulder;
    const rightShoulder = landmarks.right_shoulder;
    const leftHip = landmarks.left_hip;
    const rightHip = landmarks.right_hip;
    const leftKnee = landmarks.left_knee;
    const rightKnee = landmarks.right_knee;
    const leftAnkle = landmarks.left_ankle;
    const rightAnkle = landmarks.right_ankle;
    const leftFoot = landmarks.left_foot_index;
    const rightFoot = landmarks.right_foot_index;

    const shoulderMid = averagePoint(leftShoulder, rightShoulder);
    const hipMid = averagePoint(leftHip, rightHip);

    return {
        left_knee_angle: angleAt(leftHip, leftKnee, leftAnkle),
        right_knee_angle: angleAt(rightHip, rightKnee, rightAnkle),
        left_hip_angle: angleAt(leftShoulder, leftHip, leftKnee),
        right_hip_angle: angleAt(rightShoulder, rightHip, rightKnee),
        left_ankle_angle: angleAt(leftKnee, leftAnkle, leftFoot),
        right_ankle_angle: angleAt(rightKnee, rightAnkle, rightFoot),
        trunk_lean_angle: trunkLeanAngle(shoulderMid, hipMid),
    };
};

const clampFps = (fps?: number) => {
    if (!fps || !Number.isFinite(fps)) return 8;
    return Math.max(5, Math.min(10, Math.floor(fps)));
};

const downsampleByFps = (samples: PoseSample[], targetFps: number): PoseSample[] => {
    if (samples.length === 0) return [];
    const intervalMs = 1000 / targetFps;
    const sorted = [...samples].sort((a, b) => a.timestampMs - b.timestampMs);
    const selected: PoseSample[] = [];
    let nextTimestamp = sorted[0].timestampMs;

    for (const sample of sorted) {
        if (selected.length === 0 || sample.timestampMs >= nextTimestamp) {
            selected.push(sample);
            nextTimestamp = sample.timestampMs + intervalMs;
        }
    }

    return selected;
};

export const processRecordedVideo = (
    _videoUri: string, // Kept for API compatibility
    exerciseName: string,
    rawSamples: PoseSample[],
    options?: PoseProcessingOptions,
): KinematicReport => {
    const targetFps = clampFps(options?.targetFps);
    const minVisibility = Number.isFinite(options?.minVisibility) ? Number(options?.minVisibility) : 0.35;
    const smoothingWindow = clampWindow(options?.smoothingWindow);
    const cappedSamples = limitFrames(downsampleByFps(rawSamples || [], targetFps), options?.maxFrames || 20);
    const rawFrames: KinematicFrameData[] = cappedSamples.map((sample) => {
        const landmarks = normalizeLandmarks(sample.landmarks, minVisibility);
        return {
            timestamp: Math.max(0, Math.floor(sample.timestampMs)),
            landmarks,
            angles: buildAngles(landmarks),
        };
    });
    const frames_data = smoothAngles(rawFrames, smoothingWindow);

    return {
        exercise_name: exerciseName,
        frames_data,
    };
};
