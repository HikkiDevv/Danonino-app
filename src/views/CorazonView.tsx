import React, { useEffect, useState } from 'react';
import { HeartHandshake, Swords, Heart, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { CorazonData, BarraEmocion, EventoEmocion, NombreEmocion } from '../types';
import { Encabezado, Constelacion, BarraFina, EMO, hace, Cargando, Vacio } from '../components/Interior';

const ADJ: Record<NombreEmocion, string> = {
  alegria: 'contento', curiosidad: 'curioso', ternura: 'tierno', orgullo: 'orgulloso', sorpresa: 'sorprendido',
  tristeza: 'triste', enojo: 'molesto', ansiedad: 'inquieto', verguenza: 'avergonzado', aburrimiento: 'aburrido'
};
const adjetivo = (barras: BarraEmocion[]) => {
  const top = [...barras].sort((a, b) => (b.valor - b.base) - (a.valor - a.base))[0];
  return top && top.valor - top.base >= 0.1 ? ADJ[top.emocion] : 'tranquilo';
};

const etapaRomance = (r: number) =>
  r < 0.12 ? 'le cae especialmente bien' : r < 0.3 ? 'empieza a sentir algo' : r < 0.5 ? 'le gusta' : r < 0.75 ? 'le gusta mucho' : 'está enamorado';

const Motivos: React.FC<{ eventos: EventoEmocion[] }> = ({ eventos }) => (
  eventos.length ? (
    <ol className="relative border-l border-danonino-border ml-1.5 space-y-3.5">
      {eventos.slice(0, 10).map((e, i) => {
        const principal = Object.entries(e.cambios).sort((a, b) => Math.abs(b[1] || 0) - Math.abs(a[1] || 0))[0]?.[0] as NombreEmocion | undefined;
        return (
          <li key={`${e.ts}-${i}`} className="pl-4 relative">
            <span className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full ring-4 ring-danonino-bg" style={{ background: principal ? EMO[principal]?.color : '#7f7369' }} />
            <p className="text-[13px] text-slate-200 leading-snug first-letter:uppercase">{e.causa}{e.origen === 'modelo' && <span className="kicker ml-2 !text-danonino-menta">lo sintió él</span>}</p>
            <p className="kicker mt-0.5">{hace(e.ts)}{principal ? ` · ${EMO[principal]?.nombre.toLowerCase()}` : ''}</p>
          </li>
        );
      })}
    </ol>
  ) : <Vacio>Todavía no le ha pasado nada que lo mueva. Escríbele.</Vacio>
);

const Barras: React.FC<{ barras: BarraEmocion[] }> = ({ barras }) => (
  <div className="space-y-2.5">{[...barras].sort((a, b) => b.valor - a.valor).map((b) => <BarraFina key={b.emocion} b={b} />)}</div>
);

export const CorazonView: React.FC = () => {
  const [d, setD] = useState<CorazonData | null>(null);
  const [error, setError] = useState('');
  const [vista, setVista] = useState<'app' | 'whatsapp'>('app');

  const cargar = () => api.getCorazon().then((r) => { setD(r); setError(''); }).catch((e) => setError(e.message));
  useEffect(() => { cargar(); const t = setInterval(cargar, 30000); return () => clearInterval(t); }, []);

  if (!d) return <div className="px-5 pb-28">{error ? <Vacio>{error}</Vacio> : <Cargando />}</div>;
  const wa = vista === 'whatsapp' && d.whatsapp;
  const barras = wa ? d.whatsapp!.barras : d.barras;
  const eventos = wa ? d.whatsapp!.eventos : d.eventos;
  const afecto = d.vinculo.afecto;

  return (
    <div className="px-5 pb-28 space-y-6 entrar">
      <Encabezado numero="02" kicker="Corazón" bajada={wa ? 'El Danonino de WhatsApp: lo que siente con todos sus grupos.' : 'Lo que siente tu Danonino ahora. Cambia con lo que vive y se le pasa con el tiempo.'}>
        Hoy está <em>{adjetivo(barras)}</em>
      </Encabezado>

      {d.esDuena && d.whatsapp && (
        <div className="flex gap-2">
          <button onClick={() => setVista('app')} className={`chip ${vista === 'app' ? 'chip-activo' : ''}`}>Tu Danonino</button>
          <button onClick={() => setVista('whatsapp')} className={`chip ${vista === 'whatsapp' ? 'chip-activo' : ''}`}>El de WhatsApp</button>
        </div>
      )}

      <section className="hoja rounded-hoja p-2 overflow-hidden relative">
        <Constelacion barras={barras} />
        <button onClick={cargar} className="absolute top-3 right-3 p-1.5 text-slate-500 active:text-danonino-tomate" aria-label="Actualizar"><RefreshCw className="w-3.5 h-3.5" /></button>
      </section>

      {!wa && (
        <section className="hoja rounded-hoja p-4">
          <div className="flex items-center gap-2 mb-3"><HeartHandshake className="w-4 h-4 text-danonino-rosa" /><span className="kicker">Contigo</span></div>
          <div className="flex items-end gap-4">
            <div className="titular text-[40px] tabular-nums">{afecto >= 0 ? '+' : ''}{Math.round(afecto * 100)}</div>
            <p className="text-[13px] text-slate-300 pb-1.5 leading-snug flex-1">
              {d.vinculo.descripcion ? <>Contigo: {d.vinculo.descripcion}.</> : 'Te está conociendo. El cariño se gana conversando.'}
              <span className="block kicker mt-1">{d.vinculo.interacciones} charlas</span>
            </p>
          </div>
          {d.vinculo.rencor > 0.15 && <p className="mt-3 text-[12px] text-danonino-tomate">Sigue un poco dolido contigo. Se le pasa con el tiempo, o con un perdón.</p>}
        </section>
      )}

      {wa && d.whatsapp!.vinculos.length > 0 && (
        <section className="space-y-2.5">
          <span className="kicker">Vínculos especiales</span>
          {d.whatsapp!.vinculos.map((v) => (
            <div key={v.telefono} className="hoja rounded-hoja p-4 flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${v.tipo === 'rivalidad' ? 'bg-danonino-tomate/15 text-danonino-tomate' : 'bg-danonino-rosa/15 text-danonino-rosa'}`}>
                {v.tipo === 'rivalidad' ? <Swords className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[19px] leading-none">{v.nombre}</div>
                <div className="text-[12px] text-slate-400 mt-1">{v.tipo === 'rivalidad' ? 'Su enemigo declarado' : v.romance !== null ? `Por él: ${etapaRomance(v.romance)}` : v.nota}</div>
                {v.romance !== null && (
                  <div className="mt-2 h-[5px] rounded-full bg-danonino-surface overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-danonino-rosa to-danonino-tomate transition-all duration-700" style={{ width: `${Math.round(v.romance * 100)}%` }} /></div>
                )}
              </div>
              {v.romance !== null && <span className="font-mono text-[11px] text-danonino-rosa">{Math.round(v.romance * 100)}%</span>}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <span className="kicker">Intensidad · la raya marca su humor normal</span>
        <div className="hoja rounded-hoja p-4"><Barras barras={barras} /></div>
      </section>

      <section className="space-y-3">
        <span className="kicker">Lo que lo movió</span>
        <Motivos eventos={eventos} />
      </section>
    </div>
  );
};
