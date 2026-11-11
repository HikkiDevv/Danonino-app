import React, { useCallback, useEffect, useState } from 'react';
import { Utensils, Gamepad2, Heart, Moon, Trophy, Gift, RefreshCw } from 'lucide-react';
import { api, conSesion } from '../services/api';
import { JuegosData, JuegosGrupo } from '../types';
import { Encabezado, hace, Cargando, Vacio } from '../components/Interior';

const ESTADO: Record<string, { texto: string; color: string }> = {
  feliz: { texto: 'feliz', color: '#8fe0c4' },
  tranquilo: { texto: 'tranquilo', color: '#c9b8a8' },
  hambriento: { texto: 'con hambre', color: '#f2bd5c' },
  triste: { texto: 'triste', color: '#8fb8ff' },
  cansado: { texto: 'cansado', color: '#c98bd6' },
  dormido: { texto: 'dormido', color: '#9a8fd6' },
  enfermo: { texto: 'enfermito', color: '#ff8fa8' }
};
const ACCIONES = [
  { id: 'comer', texto: 'Comer', icono: Utensils },
  { id: 'jugar', texto: 'Jugar', icono: Gamepad2 },
  { id: 'mimar', texto: 'Mimar', icono: Heart },
  { id: 'dormir', texto: 'Siesta', icono: Moon }
] as const;
const MEDALLAS = ['🥇', '🥈', '🥉'];

const Barra: React.FC<{ etiqueta: string; valor: number; color: string }> = ({ etiqueta, valor, color }) => (
  <div className="flex items-center gap-3">
    <span className="kicker w-16">{etiqueta}</span>
    <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(4, valor)}%`, background: color }} />
    </div>
    <span className="text-[12px] tabular-nums text-slate-400 w-9 text-right">{valor}%</span>
  </div>
);

const TarjetaGrupo: React.FC<{ g: JuegosGrupo; alCambiar: () => void }> = ({ g, alCambiar }) => {
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [version, setVersion] = useState(0);
  const m = g.mascota;

  const cuidar = async (accion: 'comer' | 'jugar' | 'mimar' | 'dormir') => {
    setOcupado(true);
    try {
      const r = await api.cuidarMascota(g.clave, accion);
      setMensaje(r.mensaje);
      setVersion((v) => v + 1);
      alCambiar();
    } catch (e: any) { setMensaje(e.message); } finally { setOcupado(false); }
  };

  return (
    <section className="hoja rounded-hoja p-4 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="titular text-[20px] leading-tight">{g.nombre}</p>
          <p className="kicker mt-1">{g.miembros} personas{g.juntos ? ` · Danonino lleva ${g.juntos} aquí` : ''}</p>
        </div>
      </header>

      {m ? (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden bg-slate-900">
            <img src={conSesion(`/juegos/mascota/${g.clave}?v=${version}`)} alt={m.nombre} className="w-full aspect-[8/9] object-cover" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="titular text-[18px]">{m.nombre}</p>
              <p className="kicker">{m.especieNombre} {m.etapa} · nació {hace(m.nacio)}</p>
            </div>
            <span className="chip" style={{ color: ESTADO[m.estado]?.color }}>{ESTADO[m.estado]?.texto || m.estado}</span>
          </div>
          <div className="space-y-2">
            <Barra etiqueta="Barriga" valor={100 - m.hambre} color="#f2bd5c" />
            <Barra etiqueta="Ánimo" valor={m.animo} color="#ff8fa8" />
            <Barra etiqueta="Energía" valor={m.energia} color="#8fe0c4" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ACCIONES.map(({ id, texto, icono: Icono }) => (
              <button key={id} disabled={ocupado} onClick={() => cuidar(id)} className="boton-fantasma rounded-2xl py-2.5 flex flex-col items-center gap-1 disabled:opacity-50">
                <Icono className="w-4 h-4" />
                <span className="text-[12px]">{texto}</span>
              </button>
            ))}
          </div>
          {mensaje && <p className="text-[14px] text-slate-200 leading-snug">{mensaje}</p>}
          {m.cuidadores.length > 0 && <p className="kicker">Lo cuidan más: {m.cuidadores.map((c) => c.nombre).join(', ')}</p>}
        </div>
      ) : (
        <p className="text-[14px] text-slate-400 leading-snug">Este grupo no tiene mascota. En WhatsApp: «Danonino, adoptemos una mascota kitsune».</p>
      )}

      <div className="border-t border-slate-800 pt-3">
        <p className="kicker flex items-center gap-1.5 !text-danonino-oro"><Trophy className="w-3.5 h-3.5" /> Adivina la canción</p>
        {g.ranking.length ? (
          <ol className="mt-2 space-y-1.5">
            {g.ranking.map((p, i) => (
              <li key={p.nombre} className="flex items-center justify-between text-[14px]">
                <span className="text-slate-200">{MEDALLAS[i] || `${i + 1}.`} {p.nombre}</span>
                <span className="tabular-nums text-slate-400">{p.puntos} pts · {p.aciertos} aciertos</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-[13px] text-slate-500 mt-1.5">Nadie ha jugado todavía. «Danonino, adivina la canción».</p>}
      </div>

      {g.amigoSecreto && (
        <div className="border-t border-slate-800 pt-3">
          <p className="kicker flex items-center gap-1.5 !text-danonino-oro"><Gift className="w-3.5 h-3.5" /> Amigo secreto · {g.amigoSecreto.estado === 'abierto' ? 'abierto' : 'sorteado'}</p>
          <p className="text-[14px] text-slate-300 mt-1.5 leading-snug">{g.amigoSecreto.participantes.join(', ') || 'Nadie apuntado todavía'}</p>
          {(g.amigoSecreto.presupuesto || g.amigoSecreto.fecha) && <p className="kicker mt-1">{[g.amigoSecreto.presupuesto, g.amigoSecreto.fecha && `el ${g.amigoSecreto.fecha}`].filter(Boolean).join(' · ')}</p>}
        </div>
      )}
    </section>
  );
};

/** Juegos de los grupos de WhatsApp donde estás: la mascota (para cuidarla desde aquí), los marcadores y el amigo secreto. */
export const JuegosView: React.FC = () => {
  const [d, setD] = useState<JuegosData | null>(null);
  const [error, setError] = useState('');
  const cargar = useCallback(() => { api.getJuegos().then((x) => { setD(x); setError(''); }).catch((e) => setError(e.message)); }, []);
  useEffect(() => { cargar(); }, [cargar]);

  if (!d) return <div className="px-5 pb-28">{error ? <Vacio>{error}</Vacio> : <Cargando />}</div>;

  return (
    <div className="px-5 pb-28 space-y-6 entrar">
      <Encabezado numero="09" kicker="Juegos" bajada="La mascota de cada grupo de WhatsApp donde estás, quién va ganando adivina la canción y el amigo secreto.">
        Juegos de <em>tus grupos</em>
      </Encabezado>
      <button onClick={cargar} className="boton-fantasma rounded-full px-3.5 py-1.5 text-[13px] flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Actualizar</button>
      {!d.vinculado && <Vacio>Vincula tu número de WhatsApp en tu perfil para ver los juegos de tus grupos.</Vacio>}
      {d.vinculado && !d.grupos.length && <Vacio>Danonino no está en ningún grupo contigo todavía.</Vacio>}
      {d.grupos.map((g) => <TarjetaGrupo key={g.clave} g={g} alCambiar={cargar} />)}
    </div>
  );
};
