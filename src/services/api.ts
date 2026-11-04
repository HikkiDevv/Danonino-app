import {
  AgentStatus,
  ChatMessage,
  HabitatState,
  MemoryItem,
  EvolutionData,
  AutonomyData
} from '../types';

// En Capacitor/Android nativo, las peticiones van directamente al servidor local en Termux (127.0.0.1:8768)
// En desarrollo web Vite, van relativas a '/api' que es redirigido por el proxy de Vite
const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();

export const getBaseApiUrl = (): string => {
  const custom = localStorage.getItem('danonino_api_url');
  if (custom) return custom.replace(/\/+$/, '');
  if (isNative) return 'http://127.0.0.1:8768/api';
  return '/api';
};

export const getAuthToken = (): string => {
  return localStorage.getItem('danonino_api_token') || 'danonino-app-secret-token';
};

const buildHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'X-Danonino-Token': getAuthToken()
  };
};

export const api = {
  async getStatus(chatId = 'app_user'): Promise<AgentStatus> {
    const res = await fetch(`${getBaseApiUrl()}/status?chatId=${encodeURIComponent(chatId)}`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error en API status: ${res.statusText}`);
    return res.json();
  },

  async sendChatMessage(message: string, sender = 'Dan', chatId = 'app_user'): Promise<{ ok: boolean; reply: string; timestamp: string }> {
    const res = await fetch(`${getBaseApiUrl()}/chat`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ message, sender, chatId })
    });
    if (!res.ok) throw new Error(`Error enviando mensaje: ${res.statusText}`);
    return res.json();
  },

  async getChatHistory(chatId = 'app_user', limit = 50): Promise<{ ok: boolean; count: number; messages: ChatMessage[] }> {
    const res = await fetch(`${getBaseApiUrl()}/chat/history?chatId=${encodeURIComponent(chatId)}&limit=${limit}`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error obteniendo historial: ${res.statusText}`);
    return res.json();
  },

  async getHabitat(): Promise<HabitatState> {
    const res = await fetch(`${getBaseApiUrl()}/habitat`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error obteniendo habitat: ${res.statusText}`);
    return res.json();
  },

  async getMemories(q = '', category = '', limit = 40): Promise<{ ok: boolean; count: number; memories: MemoryItem[] }> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('limit', String(limit));

    const res = await fetch(`${getBaseApiUrl()}/memories?${params.toString()}`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error consultando recuerdos: ${res.statusText}`);
    return res.json();
  },

  async getEvolution(): Promise<EvolutionData> {
    const res = await fetch(`${getBaseApiUrl()}/evolution`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error obteniendo evolución: ${res.statusText}`);
    return res.json();
  },

  async getAutonomous(): Promise<AutonomyData> {
    const res = await fetch(`${getBaseApiUrl()}/autonomous`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error obteniendo actividad autónoma: ${res.statusText}`);
    return res.json();
  },

  async triggerDreamCycle(): Promise<{ ok: boolean; dreamResult: any }> {
    const res = await fetch(`${getBaseApiUrl()}/autonomous/dream`, {
      method: 'POST',
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error ejecutando DreamCycle: ${res.statusText}`);
    return res.json();
  },

  async sendLiveInteraction(
    message: string,
    imageBase64?: string,
    streamType: string = 'voice_only',
    sessionId: string = 'live_session',
    audioBase64?: string
  ): Promise<{
    ok: boolean;
    reply: string;
    userTranscript?: string;
    audioBase64?: string;
    interrupted?: boolean;
    sessionId: string;
    streamType: string;
    latencyMs: number;
    tokensEst: number;
    hasVisual: boolean;
    hasAudio?: boolean;
  }> {
    const res = await fetch(`${getBaseApiUrl()}/live/interact`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        message,
        imageBase64,
        audioBase64,
        streamType,
        sessionId,
        sender: 'Dan',
        chatId: 'app_user'
      })
    });
    if (!res.ok) throw new Error(`Error en Danonino Live: ${res.statusText}`);
    return res.json();
  },

  async getTTSAudio(text: string, voice = 'es-PE-AlexNeural'): Promise<string> {
    const res = await fetch(`${getBaseApiUrl()}/live/tts`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ text, voice })
    });
    if (!res.ok) throw new Error(`Error generando voz: ${res.statusText}`);
    const data = await res.json();
    return data.audioBase64;
  },

  async cancelLiveTask(sessionId: string = 'live_session'): Promise<{ ok: boolean; cancelled: boolean }> {
    const res = await fetch(`${getBaseApiUrl()}/live/cancel`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ sessionId })
    });
    if (!res.ok) throw new Error(`Error cancelando tarea en vivo: ${res.statusText}`);
    return res.json();
  },

  subscribeEvents(onEvent: (event: { type: string; payload?: any; timestamp: string }) => void): () => void {
    const sseUrl = `${getBaseApiUrl()}/events?token=${encodeURIComponent(getAuthToken())}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch (_) {}
    };

    return () => {
      eventSource.close();
    };
  }
};
