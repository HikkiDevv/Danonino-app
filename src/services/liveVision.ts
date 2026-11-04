// danonino-app/src/services/liveVision.ts
// Gestión de Cámara y Proyección Nativa de Pantalla Android (MediaProjection)

import { registerPlugin, Capacitor } from '@capacitor/core';

export interface ScreenCapturePluginInterface {
  startCapture(): Promise<{ success: boolean }>;
  getFrame(): Promise<{ frame: string | null }>;
  stopCapture(): Promise<{ stopped: boolean }>;
}

export const NativeScreenCapture = registerPlugin<ScreenCapturePluginInterface>('ScreenCapture');

export interface VisionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (default 0.65)
  maxFps?: number; // default 0.4 fps (1 frame cada 2.5s)
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private facingMode: 'user' | 'environment' = 'environment';
  private lastCaptureTime = 0;
  private frameCount = 0;
  private fpsWindowStart = Date.now();
  private currentFps = 0;

  constructor(private options: VisionOptions = {}) {
    this.options = {
      maxWidth: 640,
      maxHeight: 480,
      quality: 0.65,
      maxFps: 0.4,
      ...options
    };
  }

  public async start(videoElement?: HTMLVideoElement, facing: 'user' | 'environment' = 'environment'): Promise<MediaStream> {
    this.stop();
    this.facingMode = facing;

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    if (videoElement) {
      this.videoEl = videoElement;
      this.videoEl.srcObject = this.stream;
      await this.videoEl.play().catch(() => {});
    }

    return this.stream;
  }

  public async switchFacingMode(): Promise<'user' | 'environment'> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.stream) {
      await this.start(this.videoEl || undefined, this.facingMode);
    }
    return this.facingMode;
  }

  public getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  public captureCompressedFrame(force = false): string | null {
    if (!this.stream) return null;
    const now = Date.now();
    const minIntervalMs = 1000 / (this.options.maxFps || 0.4);

    if (!force && now - this.lastCaptureTime < minIntervalMs) {
      return null;
    }

    if (!this.videoEl) {
      this.videoEl = document.createElement('video');
      this.videoEl.muted = true;
      this.videoEl.playsInline = true;
      this.videoEl.srcObject = this.stream;
      this.videoEl.play().catch(() => {});
    }

    if (this.videoEl.videoWidth === 0 || this.videoEl.videoHeight === 0) {
      return null;
    }

    if (!this.canvasEl) {
      this.canvasEl = document.createElement('canvas');
    }

    const vw = this.videoEl.videoWidth;
    const vh = this.videoEl.videoHeight;
    const maxW = this.options.maxWidth || 640;
    const maxH = this.options.maxHeight || 480;

    let targetW = vw;
    let targetH = vh;
    if (vw > maxW || vh > maxH) {
      const ratio = Math.min(maxW / vw, maxH / vh);
      targetW = Math.round(vw * ratio);
      targetH = Math.round(vh * ratio);
    }

    this.canvasEl.width = targetW;
    this.canvasEl.height = targetH;
    const ctx = this.canvasEl.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoEl, 0, 0, targetW, targetH);
    this.lastCaptureTime = now;
    this.frameCount++;

    if (now - this.fpsWindowStart >= 2000) {
      this.currentFps = Number(((this.frameCount * 1000) / (now - this.fpsWindowStart)).toFixed(1));
      this.frameCount = 0;
      this.fpsWindowStart = now;
    }

    return this.canvasEl.toDataURL('image/jpeg', this.options.quality || 0.65);
  }

  public getCurrentFps(): number {
    return this.currentFps;
  }

  public stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
    this.frameCount = 0;
    this.currentFps = 0;
  }
}

// -------------------------------------------------------------
// ScreenShareManager: Proyección de Pantalla Nativa Android
// -------------------------------------------------------------
export class ScreenShareManager {
  private isNative = false;
  private isCapturing = false;
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private onStopCallback: (() => void) | null = null;

  constructor(private options: VisionOptions = {}) {
    this.options = {
      maxWidth: 960,
      maxHeight: 540,
      quality: 0.65,
      ...options
    };
  }

  public async start(onEnded?: () => void): Promise<boolean> {
    this.stop();
    this.onStopCallback = onEnded || null;

    // Si estamos en Android nativo (Capacitor), usar el plugin nativo de MediaProjection
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeScreenCapture.startCapture();
        if (res && res.success) {
          this.isNative = true;
          this.isCapturing = true;
          return true;
        }
      } catch (err: any) {
        throw new Error(err.message || 'El usuario canceló la captura de pantalla');
      }
    }

    // Fallback para navegador web estándar si soporta getDisplayMedia
    if (navigator.mediaDevices && typeof (navigator.mediaDevices as any).getDisplayMedia === 'function') {
      this.stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      const videoTrack = this.stream?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stop();
          this.onStopCallback?.();
        };
      }

      this.videoEl = document.createElement('video');
      this.videoEl.muted = true;
      this.videoEl.playsInline = true;
      this.videoEl.srcObject = this.stream;
      await this.videoEl.play().catch(() => {});

      this.isCapturing = true;
      return true;
    }

    throw new Error('La captura de pantalla no es soportada en este entorno');
  }

  public async captureFrameAsync(): Promise<string | null> {
    if (this.isNative) {
      try {
        const res = await NativeScreenCapture.getFrame();
        return res.frame || null;
      } catch (_) {
        return null;
      }
    }

    if (!this.stream || !this.videoEl) return null;
    const vw = this.videoEl.videoWidth;
    const vh = this.videoEl.videoHeight;
    if (vw === 0 || vh === 0) return null;

    if (!this.canvasEl) {
      this.canvasEl = document.createElement('canvas');
    }

    const maxW = this.options.maxWidth || 960;
    const maxH = this.options.maxHeight || 540;

    let targetW = vw;
    let targetH = vh;
    if (vw > maxW || vh > maxH) {
      const ratio = Math.min(maxW / vw, maxH / vh);
      targetW = Math.round(vw * ratio);
      targetH = Math.round(vh * ratio);
    }

    this.canvasEl.width = targetW;
    this.canvasEl.height = targetH;
    const ctx = this.canvasEl.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoEl, 0, 0, targetW, targetH);
    return this.canvasEl.toDataURL('image/jpeg', this.options.quality || 0.65);
  }

  public isActive(): boolean {
    return this.isCapturing;
  }

  public stop() {
    if (this.isNative) {
      NativeScreenCapture.stopCapture().catch(() => {});
      this.isNative = false;
    }
    this.isCapturing = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }
  }
}
