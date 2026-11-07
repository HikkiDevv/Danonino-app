import {
  AgentStatus,
  ChatMessage,
  HabitatState,
  MemoryItem,
  EvolutionData,
  AutonomyData,
  UserProfile,
  Conversation,
  AuthResponse,
  WhatsAppLinkData,
  ActivityEvent,
  OneirosDream,
  OneirosRule,
  OneirosObservatoryData,
  OneirosAprendizaje
} from '../types';

// Servicio de Danonino en Railway
export const DEFAULT_PUBLIC_API_URL = 'https://danonino-production.up.railway.app/api';

// Direcciones que guardaron versiones anteriores de la app: el túnel caducó y el bot del móvil está apagado.
// Se borran una sola vez; lo que alguien configure después a mano se respeta.
const limpiarDireccionAntigua = (): void => {
  if (localStorage.getItem('danonino_api_migrada_railway')) return;
  const guardada = localStorage.getItem('danonino_api_url') || '';
  if (/trycloudflare\.com|127\.0\.0\.1|localhost/i.test(guardada)) {
    localStorage.removeItem('danonino_api_url');
  }
  localStorage.setItem('danonino_api_migrada_railway', '1');
};

export const getBaseApiUrl = (): string => {
  if (!import.meta.env.DEV) limpiarDireccionAntigua();

  const custom = localStorage.getItem('danonino_api_url');
  if (custom) return custom.replace(/\/+$/, '');

  // Solo en desarrollo: en Android, Capacitor también sirve la app desde "localhost"
  if (import.meta.env.DEV) return 'http://127.0.0.1:8768/api';

  return DEFAULT_PUBLIC_API_URL;
};

export const getUserToken = (): string | null => {
  return localStorage.getItem('danonino_user_token');
};

export const setUserToken = (token: string): void => {
  localStorage.setItem('danonino_user_token', token);
};

export const getCurrentUser = (): UserProfile | null => {
  const raw = localStorage.getItem('danonino_user_profile');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: UserProfile | null): void => {
  if (user) {
    localStorage.setItem('danonino_user_profile', JSON.stringify(user));
  } else {
    localStorage.removeItem('danonino_user_profile');
  }
};

export const clearAuthSession = (): void => {
  localStorage.removeItem('danonino_user_token');
  localStorage.removeItem('danonino_user_profile');
  localStorage.removeItem('danonino_active_conv');
};

const buildHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = getUserToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Danonino-User-Token'] = token;
  }
  return headers;
};

export const api = {
  // ==========================================
  // AUTENTICACIÓN Y PERFIL
  // ==========================================

  async register(username: string, password: string, displayName?: string, codigoInvitacion?: string): Promise<AuthResponse> {
    const res = await fetch(`${getBaseApiUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName, codigoInvitacion })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Error en registro de usuario');
    }
    setUserToken(data.token);
    setCurrentUser(data.user);
    if (data.initialConversationId) {
      localStorage.setItem('danonino_active_conv', data.initialConversationId);
    }
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${getBaseApiUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Credenciales incorrectas');
    }
    setUserToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${getBaseApiUrl()}/auth/logout`, {
        method: 'POST',
        headers: buildHeaders()
      });
    } catch (_) {}
    clearAuthSession();
  },

  async getMe(): Promise<UserProfile> {
    const res = await fetch(`${getBaseApiUrl()}/auth/me`, {
      headers: buildHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) clearAuthSession();
      throw new Error(`Error obteniendo perfil: ${res.statusText}`);
    }
    const data = await res.json();
    setCurrentUser(data.user);
    return data.user;
  },

  async updateProfile(displayName: string, preferences?: Record<string, any>): Promise<UserProfile> {
    const res = await fetch(`${getBaseApiUrl()}/auth/profile`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({ displayName, preferences })
    });
    if (!res.ok) throw new Error('Error actualizando perfil');
    const data = await res.json();
    setCurrentUser(data.user);
    return data.user;
  },

  async requestWhatsAppLink(): Promise<WhatsAppLinkData> {
    const res = await fetch(`${getBaseApiUrl()}/auth/link-whatsapp`, {
      method: 'POST',
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error('Error solicitando código de vinculación');
    return res.json();
  },

  // ==========================================
  // CONVERSACIONES Y MENSAJES AISLADOS
  // ==========================================

  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${getBaseApiUrl()}/conversations`, {
      headers: buildHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) clearAuthSession();
      throw new Error(`Error cargando conversaciones: ${res.statusText}`);
    }
    const data = await res.json();
    return data.conversations || [];
  },

  async createConversation(title: string = 'Nueva Conversación'): Promise<Conversation> {
    const res = await fetch(`${getBaseApiUrl()}/conversations`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ title })
    });
    if (!res.ok) throw new Error('Error creando conversación');
    const data = await res.json();
    return data.conversation;
  },

  async getConversationMessages(conversationId: string, limit: number = 100): Promise<ChatMessage[]> {
    const res = await fetch(`${getBaseApiUrl()}/conversations/${encodeURIComponent(conversationId)}/messages?limit=${limit}`, {
      headers: buildHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) clearAuthSession();
      throw new Error(`Error cargando mensajes: ${res.statusText}`);
    }
    const data = await res.json();
    return data.messages || [];
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    const res = await fetch(`${getBaseApiUrl()}/conversations/${encodeURIComponent(conversationId)}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error('Error eliminando conversación');
    return true;
  },

  async sendChatMessage(
    message: string,
    conversationId?: string,
    mediaBase64?: string,
    mediaType?: string
  ): Promise<{
    ok: boolean;
    reply: string;
    timestamp: string;
    messageId: string;
    conversationId: string;
    role: string;
    fromMe: boolean;
  }> {
    const res = await fetch(`${getBaseApiUrl()}/chat`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ message, conversationId, mediaBase64, mediaType })
    });
    if (!res.ok) {
      if (res.status === 401) clearAuthSession();
      throw new Error(`Error enviando mensaje: ${res.statusText}`);
    }
    return res.json();
  },

  async getChatHistory(conversationId?: string, limit = 50): Promise<{ ok: boolean; count: number; messages: ChatMessage[]; conversationId?: string }> {
    const url = conversationId
      ? `${getBaseApiUrl()}/chat/history?conversationId=${encodeURIComponent(conversationId)}&limit=${limit}`
      : `${getBaseApiUrl()}/chat/history?limit=${limit}`;
    const res = await fetch(url, {
      headers: buildHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) clearAuthSession();
      throw new Error(`Error obteniendo historial: ${res.statusText}`);
    }
    return res.json();
  },

  // ==========================================
  // ESTADO, HABITAT, RECUERDOS Y ACTIVIDAD
  // ==========================================

  async getStatus(): Promise<AgentStatus> {
    const res = await fetch(`${getBaseApiUrl()}/status`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error en API status: ${res.statusText}`);
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

  async deleteMemory(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${getBaseApiUrl()}/memories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error eliminando recuerdo: ${res.statusText}`);
    return res.json();
  },

  async updateMemory(id: string, text: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${getBaseApiUrl()}/memories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error(`Error actualizando recuerdo: ${res.statusText}`);
    return res.json();
  },

  async getActivity(limit = 30): Promise<{ ok: boolean; count: number; events: ActivityEvent[] }> {
    const res = await fetch(`${getBaseApiUrl()}/activity?limit=${limit}`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error obteniendo actividad: ${res.statusText}`);
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

  // ==========================================
  // DANONINO LIVE AISLADO
  // ==========================================

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
        sessionId
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

  // ==========================================
  // PROYECTO ONEIROS: SUEÑOS LÚCIDOS ARTIFICIALES
  // ==========================================

  async getOneirosObservatory(): Promise<OneirosObservatoryData> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/observatory`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error consultando observatorio Oneiros: ${res.statusText}`);
    return res.json();
  },

  async startOneirosDream(options: { mode?: string; scenario?: string; title?: string; tema?: string } = {}): Promise<{ ok: boolean; dream: OneirosDream }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/start`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(options)
    });
    if (!res.ok) throw new Error(`Error iniciando sueño Oneiros: ${res.statusText}`);
    return res.json();
  },

  async stepOneirosDream(dreamId?: string, action: string = ''): Promise<{ ok: boolean; dream: OneirosDream }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/step`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ dreamId, action })
    });
    if (!res.ok) throw new Error(`Error en paso onírico Oneiros: ${res.statusText}`);
    return res.json();
  },

  async modifyOneirosRule(dreamId: string, ruleName: string, newValue: string, reason: string = ''): Promise<{ ok: boolean; ruleName: string; newValue: string; rules: OneirosRule[] }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/rule`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ dreamId, ruleName, newValue, reason })
    });
    if (!res.ok) throw new Error(`Error modificando regla Oneiros: ${res.statusText}`);
    return res.json();
  },

  async descendOneiros(parentDreamId?: string): Promise<{ ok: boolean; subDream: OneirosDream }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/descend`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ parentDreamId })
    });
    if (!res.ok) throw new Error(`Error descendiendo nivel Oneiros: ${res.statusText}`);
    return res.json();
  },

  async wakeOneiros(dreamId?: string, reason = 'manual_app'): Promise<{ ok: boolean; dreamId: string; state: string; awakenedAt: string; narrativeJournal: string }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/wake`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ dreamId, reason })
    });
    if (!res.ok) throw new Error(`Error al despertar Oneiros: ${res.statusText}`);
    return res.json();
  },

  async toggleAutoSleep(autoSleepEnabled: boolean, inactivityThresholdMins?: number): Promise<{ ok: boolean; sleep: any }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/sleep/toggle`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ autoSleepEnabled, inactivityThresholdMins })
    });
    if (!res.ok) throw new Error(`Error configurando sueño autónomo: ${res.statusText}`);
    return res.json();
  },

  async forceSleepNow(mode: string = 'lucid'): Promise<{ ok: boolean; state: string; dream: OneirosDream }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/sleep/now`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ mode })
    });
    if (!res.ok) throw new Error(`Error iniciando sueño forzado: ${res.statusText}`);
    return res.json();
  },

  async getOneirosAprendizaje(): Promise<{ ok: boolean; aprendizaje: OneirosAprendizaje }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/aprendizaje`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error consultando el aprendizaje de Oneiros: ${res.statusText}`);
    return res.json();
  },

  async getOneirosArchive(limit: number = 15): Promise<{ ok: boolean; count: number; archive: OneirosDream[] }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/archive?limit=${limit}`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error consultando archivo Oneiros: ${res.statusText}`);
    return res.json();
  },

  async startLivingSimulation(dreamId?: string, intervalMs: number = 10000): Promise<{ ok: boolean; living: any }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/living/start`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ dreamId, intervalMs })
    });
    if (!res.ok) throw new Error(`Error iniciando simulación viva: ${res.statusText}`);
    return res.json();
  },

  async stopLivingSimulation(): Promise<{ ok: boolean; running: boolean }> {
    const res = await fetch(`${getBaseApiUrl()}/oneiros/living/stop`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error(`Error deteniendo simulación viva: ${res.statusText}`);
    return res.json();
  },

  async getMemoryAudit(limit: number = 50): Promise<{ ok: boolean; count: number; logs: any[] }> {
    const res = await fetch(`${getBaseApiUrl()}/memories/audit?limit=${limit}`, {
      headers: buildHeaders()
    });
    if (!res.ok) throw new Error(`Error consultando auditoría de memoria: ${res.statusText}`);
    return res.json();
  },

  // ==========================================
  // EVENTOS SSE PRIVADOS POR USUARIO
  // ==========================================

  subscribeEvents(onEvent: (event: { type: string; payload?: any; timestamp: string }) => void): () => void {
    const token = getUserToken();
    if (!token) return () => {};

    const sseUrl = `${getBaseApiUrl()}/events?user_token=${encodeURIComponent(token)}`;
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
