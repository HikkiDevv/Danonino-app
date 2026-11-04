// danonino-app/src/services/liveAudio.ts
// Gestión avanzada de Audio para Android: Prevención de bucle acústico, Mute de Hardware y MediaRecorder

export interface AudioCallbacks {
  onAudioLevel?: (level: number) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBase64: string, transcript: string) => void;
  onBargeIn?: () => void;
}

export class LiveAudioSession {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private animFrameId: number | null = null;

  private isAgentSpeaking = false;
  private isUserSpeaking = false;
  private isRecording = false;
  private isMuted = false;
  private recordingStartTime = 0;

  private vadSilenceTimer: any = null;

  private recognition: any = null;
  private currentTranscript = '';

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
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);
    }

    this.startLevelMonitoring();
    this.initOptionalSpeechRecognition();
    return stream;
  }

  // Mute de Hardware real
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }

    if (muted) {
      if (this.isRecording) {
        this.stopSegmentRecording();
      }
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

  // Cuando Danonino está hablando, desactivamos auto-VAD para evitar bucle con los altavoces
  public setAgentSpeaking(speaking: boolean) {
    this.isAgentSpeaking = speaking;
    if (speaking) {
      if (this.vadSilenceTimer) {
        clearTimeout(this.vadSilenceTimer);
        this.vadSilenceTimer = null;
      }
      if (this.isRecording) {
        this.stopSegmentRecording();
      }
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
      // Normalizar 0 a 100
      const level = Math.min(100, Math.round((average / 128) * 100));

      this.callbacks.onAudioLevel?.(level);

      // Si el agente está hablando, NO activamos auto-grabación para no capturar el altavoz
      if (this.isAgentSpeaking) {
        this.animFrameId = requestAnimationFrame(update);
        return;
      }

      // Umbral calibrado de voz humana real (30 dB)
      const SPEECH_THRESHOLD = 30;

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
        // Silencio sostenido por 950ms tras haber hablado
        if (this.isUserSpeaking && !this.vadSilenceTimer) {
          this.vadSilenceTimer = setTimeout(async () => {
            this.isUserSpeaking = false;
            this.vadSilenceTimer = null;
            const audioB64 = await this.stopSegmentRecording();
            const transcript = this.currentTranscript.trim();
            this.currentTranscript = '';

            // Solo enviar si se capturó audio real válido
            if (audioB64 || transcript) {
              this.callbacks.onSpeechEnd?.(audioB64, transcript);
            }
          }, 950);
        }
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  // Grabación de segmento de voz con MediaRecorder
  public startSegmentRecording() {
    if (!this.micStream || this.isRecording || this.isMuted) return;
    this.recordedChunks = [];
    this.recordingStartTime = Date.now();

    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else {
        mimeType = '';
      }
    }

    try {
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.micStream, { mimeType })
        : new MediaRecorder(this.micStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(150);
      this.isRecording = true;
    } catch (e) {
      console.warn('Error iniciando MediaRecorder:', e);
    }
  }

  public async stopSegmentRecording(): Promise<string> {
    if (!this.mediaRecorder || !this.isRecording) return '';

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        this.isRecording = false;
        const duration = Date.now() - this.recordingStartTime;

        // Descartar grabaciones menores a 600ms para evitar chasquidos y fragmentos vacíos
        if (duration < 600 || this.recordedChunks.length === 0) {
          this.recordedChunks = [];
          resolve('');
          return;
        }

        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm'
        });
        this.recordedChunks = [];

        // Si el archivo pesa menos de 3.5 KB, es ruido/silencio vacío
        if (blob.size < 3500) {
          resolve('');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string) || '';
          resolve(base64);
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      };

      try {
        this.mediaRecorder!.stop();
      } catch (_) {
        this.isRecording = false;
        resolve('');
      }
    });
  }

  private initOptionalSpeechRecognition() {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) return;

    try {
      this.recognition = new SpeechClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; ++i) {
          text += event.results[i][0].transcript + ' ';
        }
        this.currentTranscript = text;
      };

      this.recognition.onerror = () => {};
      this.recognition.onend = () => {
        if (this.micStream && !this.isMuted) {
          try {
            this.recognition.start();
          } catch (_) {}
        }
      };

      this.recognition.start();
    } catch (_) {}
  }

  public getWaveformData(): Uint8Array | null {
    if (!this.analyser || this.isMuted) return null;
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  public stop() {
    if (this.vadSilenceTimer) clearTimeout(this.vadSilenceTimer);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (_) {}
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
// NativeAudioPlayer: Reproductor HTML5 Audio para la voz de Danonino
// -------------------------------------------------------------
export class NativeAudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying = false;

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
      this.audioElement = audio;

      audio.onplay = () => {
        this.isPlaying = true;
        onStart?.();
      };

      audio.onended = () => {
        this.isPlaying = false;
        this.audioElement = null;
        onEnded?.();
        resolve();
      };

      audio.onerror = (e) => {
        this.isPlaying = false;
        this.audioElement = null;
        onError?.(e);
        resolve();
      };

      audio.play().catch((err) => {
        this.isPlaying = false;
        onError?.(err);
        resolve();
      });
    });
  }

  public stop() {
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
