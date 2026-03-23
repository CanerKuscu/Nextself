declare module 'react-native-vision-camera' {
    import * as React from 'react';
    import { ViewProps } from 'react-native';

    export type CameraDevice = any;

    export class Camera extends React.Component<ViewProps & Record<string, any>> {
        startRecording: (options: {
            flash?: 'off' | 'on' | 'auto';
            onRecordingFinished: (video: { path: string }) => void | Promise<void>;
            onRecordingError: (error: unknown) => void;
        }) => void;
        stopRecording: () => void;
    }

    export const VisionCameraProxy: {
        initFrameProcessorPlugin: (name: string) => { call: (frame: any, options?: Record<string, any>) => any } | null;
    };

    export const useCameraDevice: (position: 'back' | 'front') => CameraDevice | undefined;
    export const useCameraPermission: () => { hasPermission: boolean; requestPermission: () => Promise<boolean> };
    export const useFrameProcessor: <T extends (...args: any[]) => any>(processor: T, deps?: React.DependencyList) => T;
}
