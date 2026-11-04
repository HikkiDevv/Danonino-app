export type CallState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'ended';

export type StreamMode = 'voice_only' | 'camera' | 'screen';

export interface CallTelemetry {
  fps: number;
  latencyMs: number;
  tokensEst: number;
  micLevel: number; // 0 to 100
  audioOutputLevel: number; // 0 to 100
}

export interface LiveInteractionResult {
  ok: boolean;
  reply: string;
  interrupted?: boolean;
  sessionId: string;
  streamType: StreamMode;
  hasVisual?: boolean;
  latencyMs?: number;
  tokensEst?: number;
}
