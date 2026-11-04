// danonino-app/src/services/liveAudio.ts
// Motor de Audio de Alta Fidelidad: Captura PCM directa, Codificador WAV universal y Reproductor HTML5

export interface AudioCallbacks {
  onAudioLevel?: (level: number) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBase64: string) => void;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  // Subchunk 1 fmt
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 para PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 para PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)
  // Subchunk 2 data
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Escribir muestras PCM con clamp a 16-bit
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export class LiveAudioSession {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;

  // Buffer de muestras PCM directas
  private pcmChunks: Float32Array[] = [];
  private isRecordingPCM = false;
  private recordingStartTime = 0;

  private isAgentSpeaking = false;
  private isUserSpeaking = false;
  private isMuted = false;

  private vadSilenceTimer: any = null;

  constructor(private callbacks: AudioCallbacks = {}) {}

  public async start(): Promise<MediaStream> {
    if (this.micStream) return this.micStream;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    this.micStream = stream;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;

      // ScriptProcessor para captura continua directa de muestras PCM
      this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecordingPCM || this.isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Clonar datos de muestra
        const copy = new Float32Array(inputData.length);
        copy.set(inputData);
        this.pcmChunks.push(copy);
      };

      this.sourceNode.connect(this.analyser);
      this.sourceNode.connect(this.processorNode);
      // Conectar a destination con ganancia nula para evitar feedback local
      const muteGain = this.audioCtx.createGain();
      muteGain.gain.value = 0;
      this.processorNode.connect(muteGain);
      muteGain.connect(this.audioCtx.destination);
    }

    this.startLevelMonitoring();
    return stream;
  }

  // Mute de Hardware
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }

    if (muted) {
      this.isRecordingPCM = false;
      this.pcmChunks = [];
      this.isUserSpeaking = false;
      if (this.vadSilenceTimer) {
        clearTimeout(this.vadSilenceTimer);
        this.vadSilenceTimer = null;
      }
      this.callbacks.onAudioLevel?.(0);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setAgentSpeaking(speaking: boolean) {
    this.isAgentSpeaking = speaking;
    if (speaking) {
      if (this.vadSilenceTimer) {
        clearTimeout(this.vadSilenceTimer);
        this.vadSilenceTimer = null;
      }
      this.isRecordingPCM = false;
      this.pcmChunks = [];
      this.isUserSpeaking = false;
    }
  }

  private startLevelMonitoring() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.analyser) return;

      if (this.isMuted) {
        this.callbacks.onAudioLevel?.(0);
        this.animFrameId = requestAnimationFrame(update);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const level = Math.min(100, Math.round((average / 128) * 100));

      this.callbacks.onAudioLevel?.(level);

      // Si Danonino está hablando, no auto-grabamos el altavoz
      if (this.isAgentSpeaking) {
        this.animFrameId = requestAnimationFrame(update);
        return;
      }

      // Umbral calibrado de voz (28 dB)
      const SPEECH_THRESHOLD = 28;

      if (level > SPEECH_THRESHOLD) {
        if (!this.isUserSpeaking) {
          this.isUserSpeaking = true;
          this.callbacks.onSpeechStart?.();
          this.startSegmentRecording();
        }

        if (this.vadSilenceTimer) {
          clearTimeout(this.vadSilenceTimer);
          this.vadSilenceTimer = null;
        }
      } else {
        // Silencio sostenido por 900ms tras hablar
        if (this.isUserSpeaking && !this.vadSilenceTimer) {
          this.vadSilenceTimer = setTimeout(async () => {
            this.isUserSpeaking = false;
            this.vadSilenceTimer = null;
            const audioB64 = await this.stopSegmentRecording();

            if (audioB64) {
              this.callbacks.onSpeechEnd?.(audioB64);
            }
          }, 900);
        }
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  public startSegmentRecording() {
    if (this.isMuted) return;
    this.pcmChunks = [];
    this.recordingStartTime = Date.now();
    this.isRecordingPCM = true;
  }

  public async stopSegmentRecording(): Promise<string> {
    this.isRecordingPCM = false;
    const duration = Date.now() - this.recordingStartTime;

    // Descartar si duró menos de 250ms o no hay chunks
    if (duration < 250 || this.pcmChunks.length === 0) {
      this.pcmChunks = [];
      return '';
    }

    // Calcular longitud total de muestras
    let totalLength = 0;
    for (const chunk of this.pcmChunks) {
      totalLength += chunk.length;
    }

    if (totalLength < 1000) {
      this.pcmChunks = [];
      return '';
    }

    // Unir chunks en un solo Float32Array
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    this.pcmChunks = [];

    const sampleRate = this.audioCtx?.sampleRate || 44100;
    const wavBlob = encodeWAV(merged, sampleRate);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string) || '';
        resolve(base64);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(wavBlob);
    });
  }

  public getWaveformData(): Uint8Array | null {
    if (!this.analyser || this.isMuted) return null;
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  public stop() {
    this.isRecordingPCM = false;
    this.pcmChunks = [];
    if (this.vadSilenceTimer) clearTimeout(this.vadSilenceTimer);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch (_) {}
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (_) {}
      this.sourceNode = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.analyser = null;
    }
  }
}

// -------------------------------------------------------------
// NativeAudioPlayer: Reproductor HTML5 Audio para la voz de Danonino con Analizador Web Audio API
// -------------------------------------------------------------
export class NativeAudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private animId: number | null = null;
  private isPlaying = false;
  private currentLevel = 0;

  constructor(private onLevelChange?: (level: number) => void) {}

  public playBase64(
    audioBase64: string,
    onStart?: () => void,
    onEnded?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stop();

      const src = audioBase64.startsWith('data:')
        ? audioBase64
        : `data:audio/mp3;base64,${audioBase64}`;

      const audio = new Audio(src);
      audio.crossOrigin = 'anonymous';
      this.audioElement = audio;

      // Intentar conectar analizador Web Audio API
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          if (!this.audioCtx || this.audioCtx.state === 'closed') {
            this.audioCtx = new AudioContextClass();
          }
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
          }

          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 128;
          this.analyser.smoothingTimeConstant = 0.25;

          this.sourceNode = this.audioCtx.createMediaElementSource(audio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioCtx.destination);
        }
      } catch (errCtx) {
        // Fallback si createMediaElementSource está restringido
        this.analyser = null;
      }

      audio.onplay = () => {
        this.isPlaying = true;
        this.startLevelTracking();
        onStart?.();
      };

      audio.onended = () => {
        this.stop();
        onEnded?.();
        resolve();
      };

      audio.onerror = (e) => {
        this.stop();
        onError?.(e);
        resolve();
      };

      audio.play().catch((err) => {
        this.stop();
        onError?.(err);
        resolve();
      });
    });
  }

  private startLevelTracking() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const dataArray = new Uint8Array(this.analyser ? this.analyser.frequencyBinCount : 32);

    const tick = () => {
      if (!this.isPlaying || !this.audioElement) {
        this.currentLevel = 0;
        this.onLevelChange?.(0);
        return;
      }

      if (this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        this.currentLevel = Math.min(100, Math.round((avg / 128) * 100));
      } else {
        // Simulación reactiva suave si el analizador nativo no está disponible
        this.currentLevel = 30 + Math.round(Math.random() * 40);
      }

      this.onLevelChange?.(this.currentLevel);
      this.animId = requestAnimationFrame(tick);
    };

    this.animId = requestAnimationFrame(tick);
  }

  public getWaveformData(): Uint8Array | null {
    if (!this.isPlaying || !this.analyser) return null;
    const buffer = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.currentLevel = 0;
    this.onLevelChange?.(0);

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.audioElement.src = '';
      } catch (_) {}
      this.audioElement = null;
    }
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
