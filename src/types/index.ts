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
  usuarioActual?: {
    id: string;
    username: string;
    displayName: string;
    mensajesPrivados: number;
    recuerdosSemanticos: number;
    ciclosSueno: number;
  } | null;
}

export interface ChatMessage {
  id: string | number;
  sender: string;
  text: string;
  timestamp: string;
  fromMe: boolean;
  role?: 'user' | 'assistant';
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'audio' | null;
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

export interface ActivityEvent {
  id: string;
  type: 'reflection' | 'fact' | 'inference' | 'action' | 'error';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  confidence?: number;
  source?: string;
  category?: string;
}

export interface OneirosCharacter {
  id: string;
  name: string;
  role: string;
  persona: string;
  goals: string[];
  beliefs: string[];
  isAlternateSelf: boolean;
  createdAt: string;
}

export interface OneirosRule {
  name: string;
  value: string;
  mutable: boolean;
  reason?: string;
  modifiedAt?: string;
}

export interface OneirosEvent {
  id: number;
  dreamId: string;
  depthLevel: number;
  eventType: string;
  description: string;
  charactersInvolved?: string;
  lucidityAtTime?: number;
  ruleModified?: string;
  timestamp: string;
}

export interface OneirosDream {
  dreamId: string;
  userId: string;
  parentDreamId?: string | null;
  depthLevel: number;
  title: string;
  scenario: string;
  seed: string;
  lucidityScore: number;
  isLucid: boolean;
  mode: 'lucid' | 'recursive' | 'nightmare' | 'alternate_self' | 'false_awakening';
  state: 'active' | 'awakened' | 'paused';
  rules: OneirosRule[];
  narrativeJournal?: string;
  createdAt: string;
  awakenedAt?: string;
}

export type SleepCycleState = 'AWAKE' | 'DROWSY' | 'SLEEPING' | 'LUCID_DREAMING' | 'WAKING';

export interface OneirosSleepMetrics {
  timeAsleepSeconds: number;
  minutesInactive: number;
  autoSleepEnabled: boolean;
  inactivityThresholdMins: number;
  lastAwakenedAt?: string | null;
  sleepStartedAt?: string | null;
}

export interface OneirosDanoninoState {
  location: string;
  currentFocus: string;
  currentThought: string;
  relationships: Record<string, string>;
}

export interface OneirosLocation {
  id: string;
  name: string;
  description: string;
  stability: number;
}

export interface OneirosDialogueItem {
  speaker: string;
  text: string;
  turn?: number;
  timestamp?: string;
}

export interface OneirosLivingSimulationState {
  isRunning: boolean;
  intervalMs: number;
  tickCount: number;
  lastTickAt: string | null;
  danoninoState: OneirosDanoninoState;
  activeDialogue: OneirosDialogueItem[];
  locations: OneirosLocation[];
  discoveries: string[];
}

export interface OneirosObservatoryData {
  ok: boolean;
  hasActiveDream: boolean;
  dream: OneirosDream | null;
  characters: OneirosCharacter[];
  recentEvents: OneirosEvent[];
  livingSimulation?: OneirosLivingSimulationState;
  sleepState: SleepCycleState;
  sleepMetrics: OneirosSleepMetrics;
}
