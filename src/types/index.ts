export type AgentMode = 'idle' | 'thinking' | 'chatting' | 'dreaming' | 'offline';

export interface AgentStatus {
  ok: boolean;
  agent: string;
  version: string;
  status: string;
  mode: AgentMode;
  tiempo: {
    horaOficial: string;
    fechaTexto: string;
    momentoDia: string;
    zonaHoraria: string;
  };
  sesion: {
    sesionId: string;
    mensajesSesion: number;
    ultimoMensaje: string | null;
  };
  telemetria: {
    bateria: number;
    cargando: boolean;
    temperatura: number;
    ramMb: number;
    ramPorcentaje: number;
  };
  metricasCognitivas: {
    episodiosConsolidados: number;
    memoriasTotales: number;
    ciclosSueno: number;
  };
}

export interface ChatMessage {
  id: string | number;
  sender: string;
  text: string;
  timestamp: string;
  fromMe: boolean;
  status?: 'sending' | 'sent' | 'error';
}

export interface MemoryItem {
  id: string;
  title?: string;
  text: string;
  category: string;
  color?: string;
  importance?: number;
  connections?: number;
  timestamp: string;
  sender?: string;
}

export interface HabitatState {
  ok: boolean;
  ambiente: 'mañana' | 'tarde' | 'noche' | 'madrugada';
  iluminacion: string;
  actividad: 'escritorio' | 'biblioteca' | 'laboratorio' | 'descanso';
  horaOficial: string;
  avatar: {
    estado: 'atento' | 'pensando' | 'soñando' | 'activo';
    ubicacion: string;
    coordenadas: { x: number; y: number };
  };
  curiosidades: string[];
}

export interface Competencia {
  nombre: string;
  estado: string;
  dominio: number;
  descripcion: string;
}

export interface EvolutionData {
  ok: boolean;
  competencias: Competencia[];
  estadisticas: {
    herramientasActivas: number;
    hipotesisComprobadas: number;
    conexionesAprendidas: number;
    alucinacionesDetectadas: number;
    tasaConfianza: number;
  };
}

export interface DreamJournalEntry {
  dream_id: string;
  status: string;
  memories_processed: number;
  associations_created: number;
  hypotheses_generated: number;
  started_at: string;
}

export interface AutonomyData {
  ok: boolean;
  autonomiaActiva: boolean;
  intervaloSuenoHoras: number;
  suenosRecientes: DreamJournalEntry[];
  iniciativas: any[];
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  preferences?: Record<string, any>;
  createdAt?: string;
  whatsappVinculos?: Array<{
    whatsapp_jid: string;
    verificado: number;
    creado_en: string;
    verificado_en?: string;
  }>;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt?: string;
}

export interface AuthResponse {
  ok: boolean;
  user: UserProfile;
  token: string;
  expiresAt: string;
  initialConversationId?: string;
  error?: string;
}

export interface WhatsAppLinkData {
  ok: boolean;
  code: string;
  expiresInMinutes: number;
  instrucciones: string;
}
