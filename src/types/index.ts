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

export interface OneirosJuicio {
  texto: string;
  verdad: string;
  juicio: string;
  acierto: boolean;
  porQue?: string;
}

export interface OneirosAnalisis {
  estado: 'pendiente' | 'analizado';
  interpretacion: string | null;
  simbolos: string[];
  hipotesis: string | null;
  pregunta: string | null;
  criterio: string | null;
  aciertos: number;
  dudas: number;
  total: number;
  juicios: OneirosJuicio[];
}

export interface OneirosAprendizaje {
  suenosAnalizados: number;
  precision: number | null;
  evolucion: { antes: number | null; ahora: number | null } | null;
  criterio: string | null;
  hipotesis: string[];
  preguntas: string[];
  simbolos: { simbolo: string; veces: number }[];
  errores: string[];
}

export interface PerfilDanonino {
  userId: string;
  apodo: string;
  descripcion: string;
  aspecto: string;
  tieneAvatar: boolean;
  avatarVersion: number;
}

export interface GrupoDanonino {
  id: string;
  nombre: string;
  estado: 'activo' | 'invitado';
  personas: number;
  ultimo: string | null;
}

export interface GrupoMiembro {
  userId: string;
  nombre: string;
  username: string;
  estado: 'activo' | 'invitado';
  agenteActivo: boolean;
  apodo: string;
  tieneAvatar: boolean;
  avatarVersion: number;
}

export interface GrupoDetalle {
  id: string;
  nombre: string;
  creadorId: string;
  miembros: GrupoMiembro[];
}

export interface GrupoMensaje {
  id: string;
  tipo: 'persona' | 'agente' | 'sistema';
  userId: string;
  nombre: string;
  texto: string;
  creado: string;
}

export interface OneirosAsociacion {
  a_origen: string;
  a_texto: string;
  b_origen: string;
  b_texto: string;
  vinculo: string;
  tipo: 'evidente' | 'inesperada';
}

export interface OneirosHipotesis {
  id: string;
  texto: string;
  estado: string;
  medido: number | null;
  muestra: number | null;
}

export interface OneirosCicloConfig {
  activo: boolean;
  comunicar: boolean;
  intervaloHoras: number;
  mensajesSemana: number;
  silencioDesde: number;
  silencioHasta: number;
}

export interface OneirosCuriosidad {
  id: string;
  pregunta: string;
  motivo: string;
  prioridad: number;
  respuesta?: string;
}

export interface OneirosPanelCiclo {
  config: OneirosCicloConfig;
  estado: {
    fase: string | null;
    faseIndice: number;
    fasesTotales: number;
    aplazadoHasta: string | null;
    ciclosTerminados: number;
    ultimoCiclo: { fin: string | null; estado: string; resumen: string | null; llamadas: number } | null;
    proximoCiclo: string | null;
    llamadasHoy: number;
    limiteDiario: number;
  };
  curiosidades: OneirosCuriosidad[];
  resueltas: OneirosCuriosidad[];
  iniciativas: { id: string; objetivo: string; estado: string; accion: string; justificacion: string; aprendizaje: string | null }[];
  experimentos: OneirosHipotesis[];
  limitaciones: { id: string; texto: string }[];
  aprendizajes: { id: string; intento: string; esperaba: string | null; ocurrio: string | null; aprendio: string | null }[];
  mensajes: { id: string; texto: string; estado: string; motivo: string | null }[];
  decisiones: { id: number; decision: string; razon: string | null; fecha: string }[];
}

export interface OneirosDream {
  asociaciones?: OneirosAsociacion[];
  tema?: string | null;
  analisis?: OneirosAnalisis | null;
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

// ==========================================
// Interior de Danonino (2026-11-09): corazón, aprendizaje, laboratorio, stickers y sección de la dueña
// ==========================================
export type NombreEmocion = 'alegria' | 'tristeza' | 'enojo' | 'ansiedad' | 'sorpresa' | 'ternura' | 'verguenza' | 'orgullo' | 'aburrimiento' | 'curiosidad';

export interface BarraEmocion { emocion: NombreEmocion; valor: number; base: number; }
export interface EventoEmocion { ts: number; causa: string; cambios: Partial<Record<NombreEmocion, number>>; origen?: string; }
export interface VinculoEspecial { nombre: string; telefono: string; nota: string; tipo: 'romance' | 'rivalidad' | 'nota'; romance: number | null; }

export interface CorazonData {
  ok: boolean;
  esDuena: boolean;
  barras: BarraEmocion[];
  eventos: EventoEmocion[];
  frase: string;
  vinculo: { afecto: number; interacciones: number; rencor: number; descripcion: string | null; rencor_texto?: string | null };
  whatsapp?: { barras: BarraEmocion[]; eventos: EventoEmocion[]; vinculos: VinculoEspecial[]; favoritos: number };
}

export interface Leccion { texto: string; ts: number; veces: number; }
export interface CambioOpinion { tema: string; antes: string; ahora: string; ts: number; }
export interface Consejo { tipo?: string; pregunta: string; respuesta: string; ts: number; }
export interface AprendizajeBloque { lecciones: Leccion[]; cambios: CambioOpinion[]; consejos: Consejo[]; }
export interface AprendizajeData extends AprendizajeBloque { ok: boolean; whatsapp?: AprendizajeBloque; }

export interface PropuestaMemoria { n: number; tipo: 'duplicado' | 'contradiccion'; ids: string[]; borrar: string[]; texto: string; ts: number; }
export interface ExamenOneiros extends OneirosAprendizaje {
  calibracion?: string | null;
  confusiones?: string | null;
  precisionPorClase?: Record<'real' | 'sonado' | 'mezcla', number | null>;
  trampas?: { intrusos: number; intrusosDetectados: number; falsosDespertares: number; falsosDetectados: number };
}
export interface LaboratorioData {
  ok: boolean;
  config: { totem: string; mision: string | null; intrusos: string[] };
  simbolos: { simbolo: string; veces: number; significado: string | null }[];
  propuestas: PropuestaMemoria[];
  examen: ExamenOneiros;
}

export interface StickerItem { id: string; etiquetas: string[]; descripcion: string; animado: boolean; usos: number; propio: boolean; }

export interface FotoPerfil { id: string; emociones: string[]; agregada: number; }
export interface DuenaResumen {
  ok: boolean;
  conectado: boolean;
  diario: { fecha: string; tema: string; texto: string }[];
  cola: { ts: number; tipo: string; texto: string; cancion: string | null }[];
  publicados: { id: string; texto: string; ts: number; tipo: string; vistas: number; respuestas: number }[];
  perfil: { fotos: FotoPerfil[]; config: { activo: boolean; cadaHoras: number; infoAuto: boolean; infoManual: string }; ultima: { id: string; emocion: string; ts: number } | null; emociones: string[] };
}

// Su mundo interior (2026-11-10)
export interface MundoGusto { categoria: string; valor: string; detalle: string | null; fijo: boolean; desde: number | null; }
export interface MundoDescubrimiento { tipo: string; valor: string; porque: string; ts: number; }
export interface MundoDibujo { id: string; tema: string; origen: 'propio' | 'sueno'; ts: number; publicado: boolean; }
export interface MundoOpinion { tema: string; antes: string; ahora: string; ts: number; quien?: string; }
export interface JuegosMascota { nombre: string; especie: string; especieNombre: string; etapa: string; estado: string; hambre: number; animo: number; energia: number; xp: number; nacio: number; cuidadores: { nombre: string; veces: number }[]; }
export interface JuegosRanking { nombre: string; puntos: number; aciertos: number; }
export interface JuegosGrupo { clave: string; nombre: string; miembros: number; juntos: string | null; mascota: JuegosMascota | null; ranking: JuegosRanking[]; amigoSecreto: { estado: string; participantes: string[]; presupuesto: string; fecha: string } | null; }
export interface JuegosData { ok: boolean; vinculado: boolean; grupos: JuegosGrupo[]; }
export interface MundoData {
  ok: boolean;
  gustos: MundoGusto[];
  descubrimientos: MundoDescubrimiento[];
  dibujos: MundoDibujo[];
  opiniones: MundoOpinion[];
  pasatiempo: { nombre: string; unidad: string; desde: number; coleccion: { texto: string; ts: number }[] } | null;
}
