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
