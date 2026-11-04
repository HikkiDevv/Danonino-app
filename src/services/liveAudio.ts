// danonino-app/src/services/liveAudio.ts
// Gestión avanzada de Audio, VAD, Web Speech STT y TTS con Barge-in

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: (finalTranscript: string) => void;
  onAudioLevel?: (level: number) => void;
  onBargeIn?: () => void;
}

export class AudioSessionManager {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isListening = false;
  private isAgentSpeaking = false;
  private vadSilenceTimer: any = null;
  private userSpeakingTimer: any = null;
  private isUserSpeaking = false;

  private recognition: any = null;
  private currentTranscript = '';
  private finalTranscriptBuffer = '';

  constructor(private callbacks: VADCallbacks = {}) {}

  public async startMicrophone(): Promise<MediaStream> {
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
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);
    }

    this.startLevelMonitoring();
    this.initSpeechRecognition();
    return stream;
  }

  public setAgentSpeaking(speaking: boolean) {
    this.isAgentSpeaking = speaking;
  }

  private startLevelMonitoring() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      // Calcular RMS promedio
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalizar 0 a 100
      const level = Math.min(100, Math.round((average / 128) * 100));

      this.callbacks.onAudioLevel?.(level);

      // Detección de umbral de voz (VAD)
      const SPEECH_THRESHOLD = 18; // Umbral de voz
      if (level > SPEECH_THRESHOLD) {
        // Si el usuario habla mientras Danonino está hablando -> Barge-In (interrupción)
        if (this.isAgentSpeaking) {
          if (!this.userSpeakingTimer) {
            this.userSpeakingTimer = setTimeout(() => {
              this.callbacks.onBargeIn?.();
              this.userSpeakingTimer = null;
            }, 180); // 180ms sostenidos para evitar ruidos breves
          }
        }

        if (!this.isUserSpeaking) {
          this.isUserSpeaking = true;
          this.callbacks.onSpeechStart?.();
        }

        if (this.vadSilenceTimer) {
          clearTimeout(this.vadSilenceTimer);
          this.vadSilenceTimer = null;
        }
      } else {
        if (this.userSpeakingTimer) {
          clearTimeout(this.userSpeakingTimer);
          this.userSpeakingTimer = null;
        }

        // Si antes estaba hablando y ahora hay silencio sostenido (900ms)
        if (this.isUserSpeaking && !this.vadSilenceTimer) {
          this.vadSilenceTimer = setTimeout(() => {
            this.isUserSpeaking = false;
            this.vadSilenceTimer = null;
            const textToSend = (this.finalTranscriptBuffer + ' ' + this.currentTranscript).trim();
            if (textToSend.length > 0) {
              this.callbacks.onSpeechEnd?.(textToSend);
              this.finalTranscriptBuffer = '';
              this.currentTranscript = '';
            }
          }, 950);
        }
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private initSpeechRecognition() {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition no soportado en este navegador/WebView');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (finalChunk) {
          this.finalTranscriptBuffer += ' ' + finalChunk;
        }
        this.currentTranscript = interim;

        // Si el usuario emite transcripción mientras Danonino habla -> Disparar Barge-in inmediato
        if (this.isAgentSpeaking && (interim.length > 2 || finalChunk.length > 0)) {
          this.callbacks.onBargeIn?.();
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('SpeechRecognition error:', e.error);
        }
      };

      this.recognition.onend = () => {
        // Reinicio automático continuo si seguimos escuchando
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (_) {}
        }
      };

      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error('Error iniciando SpeechRecognition:', e);
    }
  }

  public getWaveformData(): Uint8Array | null {
    if (!this.analyser) return null;
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  public stop() {
    this.isListening = false;
    if (this.vadSilenceTimer) clearTimeout(this.vadSilenceTimer);
    if (this.userSpeakingTimer) clearTimeout(this.userSpeakingTimer);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
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
// SpeechSynthesisTTS: Síntesis local instantánea y división inteligente
// -------------------------------------------------------------
export class SpeechSynthesisTTS {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private voice: SpeechSynthesisVoice | null = null;
  public rate = 1.05;
  public pitch = 1.0;

  constructor() {
    this.initVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoice();
      };
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Priorizar español
    const esVoice =
      voices.find((v) => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Google'))) ||
      voices.find((v) => v.lang.startsWith('es')) ||
      voices[0];
    if (esVoice) {
      this.voice = esVoice;
    }
  }

  public cancel() {
    this.isSpeaking = false;
    this.currentUtterance = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      this.cancel();

      // Limpiar texto de formato markdown y URLs para una locución limpia
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#+\s+/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      if (!cleanText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.lang = 'es-ES';
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          onError?.(e);
        }
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking || (typeof window !== 'undefined' && window.speechSynthesis?.speaking);
  }
}
