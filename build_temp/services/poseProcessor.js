"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRecordedVideo = exports.extractAnglesFromLandmarks = void 0;
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
];
const angleAt = (a, b, c) => {
    if (!a || !b || !c)
        return null;
    const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
    const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
    const dot = (ab.x * cb.x) + (ab.y * cb.y) + (ab.z * cb.z);
    const magAb = Math.sqrt((ab.x * ab.x) + (ab.y * ab.y) + (ab.z * ab.z));
    const magCb = Math.sqrt((cb.x * cb.x) + (cb.y * cb.y) + (cb.z * cb.z));
    if (magAb === 0 || magCb === 0)
        return null;
    const normalized = Math.max(-1, Math.min(1, dot / (magAb * magCb)));
    const degrees = (Math.acos(normalized) * 180) / Math.PI;
    if (!Number.isFinite(degrees))
        return null;
    return Number(degrees.toFixed(2));
};
const averagePoint = (a, b) => {
    if (!a || !b)
        return undefined;
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: ((a.z || 0) + (b.z || 0)) / 2,
    };
};
const trunkLeanAngle = (shoulderMid, hipMid) => {
    if (!shoulderMid || !hipMid)
        return null;
    const verticalPoint = { x: hipMid.x, y: hipMid.y - 1, z: hipMid.z || 0 };
    return angleAt(shoulderMid, hipMid, verticalPoint);
};
const normalizeCoordinate = (raw, minVisibility) => {
    var _a, _b, _c;
    if (!raw)
        return null;
    const x = Number(raw.x);
    const y = Number(raw.y);
    const z = Number((_a = raw.z) !== null && _a !== void 0 ? _a : 0);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        return null;
    const visibility = Number((_c = (_b = raw.visibility) !== null && _b !== void 0 ? _b : raw.score) !== null && _c !== void 0 ? _c : raw.confidence);
    if (Number.isFinite(visibility) && visibility < minVisibility)
        return null;
    return {
        x,
        y,
        z,
        visibility: Number.isFinite(visibility) ? visibility : undefined,
    };
};
const normalizeLandmarks = (landmarks, minVisibility) => {
    const result = {};
    if (!landmarks)
        return result;
    if (Array.isArray(landmarks)) {
        landmarks.forEach((item, index) => {
            const point = normalizeCoordinate(item, minVisibility);
            if (!point)
                return;
            const keyByName = typeof (item === null || item === void 0 ? void 0 : item.name) === 'string' ? item.name : '';
            const keyByType = typeof (item === null || item === void 0 ? void 0 : item.type) === 'string' ? item.type : '';
            const keyByIndex = LANDMARK_NAMES[index] || '';
            const key = keyByName || keyByType || keyByIndex;
            if (key) {
                result[key] = point;
            }
        });
        return result;
    }
    if (typeof landmarks === 'object') {
        Object.entries(landmarks).forEach(([key, value]) => {
            const point = normalizeCoordinate(value, minVisibility);
            if (point) {
                result[key] = point;
            }
        });
    }
    return result;
};
const clampWindow = (window) => {
    if (!window || !Number.isFinite(window))
        return 3;
    return Math.max(3, Math.min(5, Math.floor(window)));
};
const limitFrames = (samples, maxFrames) => {
    const safeMax = Math.max(1, Math.floor(maxFrames || 20));
    if (samples.length <= safeMax) {
        return samples;
    }
    const stride = (samples.length - 1) / (safeMax - 1);
    const selected = [];
    for (let i = 0; i < safeMax; i += 1) {
        const index = Math.min(samples.length - 1, Math.round(i * stride));
        selected.push(samples[index]);
    }
    return selected;
};
const averageNumeric = (values) => {
    const valid = values.filter((value) => Number.isFinite(value));
    if (valid.length === 0)
        return null;
    const mean = valid.reduce((acc, value) => acc + value, 0) / valid.length;
    return Number(mean.toFixed(2));
};
const smoothAngles = (frames, smoothingWindow) => {
    return frames.map((frame, index) => {
        const start = Math.max(0, index - smoothingWindow + 1);
        const window = frames.slice(start, index + 1);
        return Object.assign(Object.assign({}, frame), { angles: {
                left_knee_angle: averageNumeric(window.map(item => item.angles.left_knee_angle)),
                right_knee_angle: averageNumeric(window.map(item => item.angles.right_knee_angle)),
                left_hip_angle: averageNumeric(window.map(item => item.angles.left_hip_angle)),
                right_hip_angle: averageNumeric(window.map(item => item.angles.right_hip_angle)),
                left_ankle_angle: averageNumeric(window.map(item => item.angles.left_ankle_angle)),
                right_ankle_angle: averageNumeric(window.map(item => item.angles.right_ankle_angle)),
                trunk_lean_angle: averageNumeric(window.map(item => item.angles.trunk_lean_angle)),
            } });
    });
};
const extractAnglesFromLandmarks = (landmarks, options) => {
    const minVisibility = Number.isFinite(options === null || options === void 0 ? void 0 : options.minVisibility) ? Number(options === null || options === void 0 ? void 0 : options.minVisibility) : 0.35;
    const normalized = normalizeLandmarks(landmarks, minVisibility);
    return buildAngles(normalized);
};
exports.extractAnglesFromLandmarks = extractAnglesFromLandmarks;
const buildAngles = (landmarks) => {
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
const clampFps = (fps) => {
    if (!fps || !Number.isFinite(fps))
        return 8;
    return Math.max(5, Math.min(10, Math.floor(fps)));
};
const downsampleByFps = (samples, targetFps) => {
    if (samples.length === 0)
        return [];
    const intervalMs = 1000 / targetFps;
    const sorted = [...samples].sort((a, b) => a.timestampMs - b.timestampMs);
    const selected = [];
    let nextTimestamp = sorted[0].timestampMs;
    for (const sample of sorted) {
        if (selected.length === 0 || sample.timestampMs >= nextTimestamp) {
            selected.push(sample);
            nextTimestamp = sample.timestampMs + intervalMs;
        }
    }
    return selected;
};
const processRecordedVideo = (videoUri, exerciseName, rawSamples, options) => {
    const _videoUri = videoUri;
    const targetFps = clampFps(options === null || options === void 0 ? void 0 : options.targetFps);
    const minVisibility = Number.isFinite(options === null || options === void 0 ? void 0 : options.minVisibility) ? Number(options === null || options === void 0 ? void 0 : options.minVisibility) : 0.35;
    const smoothingWindow = clampWindow(options === null || options === void 0 ? void 0 : options.smoothingWindow);
    const cappedSamples = limitFrames(downsampleByFps(rawSamples || [], targetFps), (options === null || options === void 0 ? void 0 : options.maxFrames) || 20);
    const rawFrames = cappedSamples.map((sample) => {
        const landmarks = normalizeLandmarks(sample.landmarks, minVisibility);
        return {
            timestamp: Math.max(0, Math.floor(sample.timestampMs)),
            landmarks,
            angles: buildAngles(landmarks),
        };
    });
    const frames_data = smoothAngles(rawFrames, smoothingWindow);
    if (!_videoUri) {
        return {
            exercise_name: exerciseName,
            frames_data,
        };
    }
    return {
        exercise_name: exerciseName,
        frames_data,
    };
};
exports.processRecordedVideo = processRecordedVideo;
