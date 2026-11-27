export type AppScreen = 'splash' | 'instructions' | 'ar' | 'closing';

export type TrackingStatus =
  | 'idle'
  | 'preparing-target'
  | 'requesting-camera'
  | 'scanning'
  | 'found'
  | 'lost'
  | 'error';

export type VideoPlaybackState =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'needs-tap'
  | 'ended'
  | 'error';

export type CameraErrorCode =
  | 'INSECURE_CONTEXT'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'IN_USE'
  | 'UNSUPPORTED'
  | 'MINDAR_ERROR';

export interface CameraErrorInfo {
  code: CameraErrorCode;
  title: string;
  message: string;
  tip: string;
}

export interface TargetSourceInfo {
  mindUrl: string;
  label: string;
  origin: 'precompiled-mind' | 'compiled-test-image' | 'custom-mind' | 'custom-image';
  previewImageUrl: string;
  aspectRatio: number; // height / width
  compiledBytes?: Uint8Array;
}

export interface ExperienceContentConfig {
  appTitle: string;
  openingQuote: string;
  openingButtonLabel: string;
  instructionsTitle: string;
  instructionsLead: string;
  targetImageUrl: string;
  precompiledMindPaths: string[];
  customMindFile?: File;
  customImageFile?: File;
  videoUrl: string;
  videoLabel: string;
  isTestVideo: boolean;
  backgroundMusicUrl: string;
  backgroundMusicLabel: string;
  backgroundMusicVolume: number;
  closingQuote: string;
  closingSubtitle: string;
}
